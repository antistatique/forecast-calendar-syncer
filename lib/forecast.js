'use strict';

var Forecast = require('forecast-api'),
    config = require('./config.js');

var forecast = new Forecast({
  accountId: config.FORECAST_ACCOUNT_ID,
  authorization: config.FORECAST_AUTHORIZATION
});

module.exports = forecast;
