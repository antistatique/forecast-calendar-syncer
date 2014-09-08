'use strict';

var MongoClient = require('mongodb').MongoClient,
    config = require('./config.js'),
    Q = require('q');

var connection = Q.defer();

MongoClient.connect(config.MONGODB_CONNECTION_STRING, function(err, db) {
  if (err) throw err;

  db.collection('syncs').ensureIndex({
    personId: 1,
    calendarId: 1
  }, {
    unique: true
  }, function () {
  });
  connection.resolve(db);
});

module.exports = {
  insert: function (personId, calendarId, accessToken, refreshToken) {
    connection.promise.then(function (db) {
      var collection = db.collection('syncs');
      collection.insert([{
        personId: personId,
        calendarId: calendarId,
        accessToken: accessToken,
        refreshToken: refreshToken
      }], { w: 1 });
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
