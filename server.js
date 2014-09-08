'use strict';

var express = require('express'),
    morgan = require('morgan'),
    google = require('googleapis'),
    forecast = require('./lib/forecast.js'),
    people = require('./lib/forecast/people.js'),
    projects = require('./lib/forecast/projects.js'),
    calendar = require('./lib/calendar.js'),
    Q = require('q'),
    dateFormat = require('dateformat'),
    config = require('./lib/config.js');

var app = express();
app.use(morgan('combined'));
app.use(express.static(__dirname + '/public'));
app.listen(process.env.PORT || 8080);

app.get('/calendar/auth', function (req, res) {
  var oauth2Client = calendar.getOauth2Client(req);

  // generate a url that asks permissions for Google+ and Google Calendar scopes
  var scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
  });

  return res.redirect(url);
});

app.get('/calendar/auth/callback', function (req, res) {
  var oauth2Client = calendar.getOauth2Client(req);

  oauth2Client.getToken(req.query.code, function(err, tokens) {
    if (tokens.refresh_token) {
      return res.redirect('/calendar.html?access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token);
    }

    return res.redirect('/calendar.html?access_token=' + tokens.access_token);
  });
});

app.get('/calendar/all', function (req, res) {
  var calendarApi = calendar.getApi(req);
  calendarApi.calendarList.list(function (err, calendarList) {
    if (err) {
      console.log(err);
    }

    return res.send(calendarList);
  });
});

app.get('/forecast/people', function (req, res) {
  people.findAll().then(function (people) {
    return res.send(people);
  });
});

app.post('/calendar/sync', function (req, res) {
  var personId = req.query.person;
  var today = new Date();
  var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

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
          projects.findById(assignment.project_id),
          people.findById(assignment.person_id)
        ]).spread(function (project, person) {
          data.push({
            project: project.name,
            person: person.first_name,
            assignment: assignment
          });

          calendar.insert(req, project.name, assignment);
        })
      );
    });

    Q.all(forecastResults).then(function () {
      return res.send(data);
    });
  });
});
