'use strict';

var google = require('googleapis'),
    dateFormat = require('dateformat'),
    Q = require('q'),
    config = require('./config.js');

var getOauth2Client = function () {
  var oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_API_CLIENT_ID,
    config.GOOGLE_API_CLIENT_SECRET,
    config.BASE_URL + '/calendar/auth/callback'
  );

  return oauth2Client;
};

var getApi = function (accessToken, refreshToken) {
  var oauth2Client = getOauth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

var getTokens = function (code) {
  var tokensResult = Q.defer();

  getOauth2Client().getToken(code, function(err, tokens) {
    tokensResult.resolve(tokens);
  });

  return tokensResult.promise;
};

var findById = function (calendarApi, calendarId, eventId) {
  var findResult = Q.defer();

  calendarApi.events.get({
    calendarId: calendarId,
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

var insert = function (calendarApi, calendarId, projectName, assignment) {
  // End date + 1 day @ midnight
  var endDate = new Date(new Date(assignment.end_date).getTime() + 1 * 24 * 60 * 60 * 1000);
  var eventId = 'fc' + assignment.id;

  findById(calendarApi, calendarId, eventId)
    .then(function (event) {
      event.summary = projectName;
      event.start.date = dateFormat(assignment.start_date, 'yyyy-mm-dd');
      event.end.date = dateFormat(endDate, 'yyyy-mm-dd');

      calendarApi.events.update({
        calendarId: calendarId,
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

      calendarApi.events.insert({
        calendarId: calendarId,
        resource: resource
      });
    });
};

module.exports = {
  insert: insert,
  getApi: getApi,
  getOauth2Client: getOauth2Client,
  getTokens: getTokens
};
