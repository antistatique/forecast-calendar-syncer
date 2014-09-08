'use strict';

var forecast = require('../forecast.js'),
    Q = require('q');

var clientsResult = Q.defer();

forecast.clients(function(err, clients) {
  if (err) {
    throw err;
  }

  clientsResult.resolve(clients);
});

module.exports = {
  findById: function (clientId) {
    var clientResult = Q.defer();

    clientsResult.promise.then(function (clients) {
      clients.forEach(function (client) {
        if (client.id === clientId) {
          clientResult.resolve(client);
        }
      });
    });

    return clientResult.promise;
  }
};
