'use strict';

var forecast = require('../forecast.js'),
    Q = require('q');

var projectsResult = Q.defer();

forecast.projects(function(err, projects) {
  if (err) {
    throw err;
  }

  projectsResult.resolve(projects);
});

module.exports = {
  findById: function (projectId) {
    var projectResult = Q.defer();

    projectsResult.promise.then(function (projects) {
      projects.forEach(function (project) {
        if (project.id === projectId) {
          projectResult.resolve(project);
        }
      });
    });

    return projectResult.promise;
  }
};
