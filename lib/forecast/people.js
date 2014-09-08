'use strict';

var forecast = require('../forecast.js'),
    Q = require('q');

var peopleResult = Q.defer();

forecast.people(function(err, people) {
  if (err) {
    throw err;
  }

  peopleResult.resolve(people);
});

module.exports = {
  findById: function (personId) {
    var personResult = Q.defer();

    peopleResult.promise.then(function (people) {
      people.forEach(function (person) {
        if (person.id === personId) {
          personResult.resolve(person);
        }
      });
    });

    return personResult.promise;
  },
  findAll: function () {
    return peopleResult.promise;
  }
};
