'use strict';

var google = require('googleapis'),
    dateFormat = require('dateformat'),
    Q = require('q'),
    config = require('./config.js');

var getOauth2Client = function (req) {
  var syncerUrl = req.protocol + '://' + req.get('host');

  var oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_API_CLIENT_ID,
    config.GOOGLE_API_CLIENT_SECRET,
    syncerUrl + '/calendar/auth/callback'
  );

  return oauth2Client;
};

var getApi = function (req) {
  var oauth2Client = getOauth2Client(req);

  oauth2Client.setCredentials({
    access_token: req.query.access_token,
    refresh_token: req.query.refresh_token
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

var findById = function (req, eventId) {
  var calendar = getApi(req);

  var findResult = Q.defer();

  calendar.events.get({
    calendarId: req.query.calendar,
    eventId: eventId
  }, function (err, resource) {
    // not found
    if (err) {
      findResult.reject();
    }

    findResult.resolve(resource);
  });

  return findResult.promise;
};

var insert = function (req, projectName, assignment) {
  // End date + 1 day @ midnight
  var endDate = new Date(new Date(assignment.end_date).getTime() + 1 * 24 * 60 * 60 * 1000);
  var eventId = 'fc' + assignment.id;
  var calendar = getApi(req);

  findById(req, eventId)
    .then(function (event) {
      event.summary = projectName;
      event.start.date = dateFormat(assignment.start_date, 'yyyy-mm-dd');
      event.end.date = dateFormat(endDate, 'yyyy-mm-dd');

      calendar.events.update({
        calendarId: req.query.calendar,
        eventId: eventId,
        resource: event
      });
    }, function () {
      // not found: insert
      var resource = {
        summary: projectName,
        start: {
          date: dateFormat(assignment.start_date, 'yyyy-mm-dd')
        },
        end: {
          date: dateFormat(endDate, 'yyyy-mm-dd')
        },
        visibility: 'private',
        id: eventId
      };

      calendar.events.insert({
        calendarId: req.query.calendar,
        resource: resource
      });
    });
};

module.exports = {
  insert: insert,
  getApi: getApi,
  getOauth2Client: getOauth2Client
};
