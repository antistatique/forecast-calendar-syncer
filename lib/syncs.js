'use strict';

var MongoClient = require('mongodb').MongoClient,
    config = require('./config.js'),
    Q = require('q');

var connection = Q.defer();

MongoClient.connect(config.MONGODB_CONNECTION_STRING, function(err, db) {
  if (err) throw err;

  connection.resolve(db);
});

module.exports = {
  insert: function (personId, calendarId, accessToken, refreshToken) {
    connection.promise.then(function (db) {
      var collection = db.collection('syncs');
      collection.insert({
        personId: personId,
        calendarId: calendarId,
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    });
  },
  findAll: function () {
    var allResults = Q.defer();

    connection.promise.then(function (db) {
      var collection = db.collection('syncs');

      collection.find().toArray(function (err, results) {
        allResults.resolve(results);
      });
    });

    return allResults.promise;
  }
};
