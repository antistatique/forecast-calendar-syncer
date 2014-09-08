'use strict';

var forecast = require('../forecast.js'),
    clients = require('./clients.js'),
    Q = require('q');

var projectsResult = Q.defer();

forecast.projects(function(err, projects) {
  if (err) {
    throw err;
  }

  projectsResult.resolve(projects);
});

var findById = function (projectId) {
  var projectResult = Q.defer();

  projectsResult.promise.then(function (projects) {
    projects.forEach(function (project) {
      if (project.id === projectId) {
        projectResult.resolve(project);
      }
    });
  });

  return projectResult.promise;
};

var getFullName = function (projectId) {
  var fullNameResult = Q.defer();

  findById(projectId).then(function (project) {
    if (null === project.client_id) {
      return fullNameResult.resolve(project.name);
    }

    clients.findById(project.client_id)
      .then(function (client) {
        fullNameResult.resolve(client.name + ' > ' + project.name);
      });
  });

  return fullNameResult.promise;
};

module.exports = {
  findById: findById,
  getFullName: getFullName
};
