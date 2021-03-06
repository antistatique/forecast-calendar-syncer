'use strict';

var express = require('express'),
    morgan = require('morgan'),
    google = require('googleapis'),
    forecast = require('./lib/forecast.js'),
    people = require('./lib/forecast/people.js'),
    projects = require('./lib/forecast/projects.js'),
    calendar = require('./lib/calendar.js'),
    config = require('./lib/config.js'),
    Q = require('q'),
    syncs = require('./lib/syncs.js'),
    CronJob = require('cron').CronJob;

var app = express();
app.use(morgan('combined'));
app.use(express.static(__dirname + '/public'));
app.listen(process.env.PORT || 8080);

app.get('/calendar/auth', function (req, res) {
  var oauth2Client = calendar.getOauth2Client();

  // generate a url that asks permissions for Google+ and Google Calendar scopes
  var scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes, // If you only need one scope you can pass it as string
    approval_prompt: 'force',
    hd: config.DOMAIN
  });

  return res.redirect(url);
});

app.get('/calendar/auth/callback', function (req, res) {
  calendar.getTokens(req.query.code)
    .then(function (tokens) {
      if (tokens.refresh_token) {
        return res.redirect('/calendar.html?access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token);
      }

      return res.redirect('/calendar.html?access_token=' + tokens.access_token);
    });
});

app.get('/calendar/all', function (req, res) {
  var calendarApi = calendar.getApi(req.query.access_token, req.query.refresh_token);
  calendarApi.calendarList.list(function (err, calendarList) {
    if (err) {
      console.log(err);
    }

    calendarList.items = calendarList.items.filter(function (calendar) {
      return 'owner' === calendar.accessRole;
    });

    return res.send(calendarList);
  });
});

app.get('/forecast/people', function (req, res) {
  people.findAll().then(function (people) {
    return res.send(people);
  });
});

var doSync = function (accessToken, refreshToken, personId, calendarId) {
  var calendarApi = calendar.getApi(accessToken, refreshToken);
  var today = new Date();
  var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  var deferred = Q.defer();

  // Save to MongoDb
  syncs.insert(personId, calendarId, accessToken, refreshToken);

  var options = {
    startDate: today,
    endDate: nextWeek
  };

  forecast.assignments(options, function(err, assignments) {
    if (err) {
      throw err;
    }

    var forecastResults = [];
    var data = [];

    assignments.forEach(function (assignment) {
      if (Number(personId) !== Number(assignment.person_id)) {
        return;
      }

      forecastResults.push(
        Q.all([
          projects.getFullName(assignment.project_id),
          people.findById(assignment.person_id)
        ]).spread(function (projectName, person) {
          data.push({
            project: projectName,
            person: person.first_name,
            assignment: assignment
          });

          calendar.insert(calendarApi, calendarId, projectName, assignment);
        })
      );
    });

    Q.all(forecastResults).then(function () {
      deferred.resolve(data);
    });
  });

  return deferred.promise;
};

app.post('/calendar/sync', function (req, res) {
  doSync(req.query.access_token, req.query.refresh_token, req.query.person, req.query.calendar)
    .then(function (data) {
      return res.send(data);
    });
});

// Every monday create the week events
new CronJob('0 0 8 * * *', function() {
  syncs.findAll()
    .then(function (rows) {
      for (var i = 0; i < rows.length; i += 1) {
        var row = rows[i];
        doSync(null, row.refreshToken, row.personId, row.calendarId);
      }
    });
}, null, true, 'Europe/Zurich');
