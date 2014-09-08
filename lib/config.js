'use strict';

var extend = require('extend'),
    all = require('./config/all.js'),
    fs = require('fs');

if (fs.existsSync(__dirname + '/config/dev.js')) {
  all = extend(true, all, require('./config/dev.js'));
}

module.exports = all;
