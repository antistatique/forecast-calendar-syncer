'use strict';

var forecastCalendarSyncerApp = angular.module('forecastCalendarSyncerApp', []);

forecastCalendarSyncerApp.config(['$locationProvider', function ($locationProvider) {
  $locationProvider.html5Mode(true);
}]);

forecastCalendarSyncerApp.controller('CalendarCtrl', function ($scope, $http, $location) {
  $scope.people = [];
  $scope.calendars = [];
  $scope.data = {};
  $scope.assignments = [];

  var peopleRequest = $http({
    method: 'get',
    url: '/forecast/people'
  });
  peopleRequest.then(function (response) {
    $scope.people = response.data;
    $scope.people.sort(function (a, b) {
      if (a.first_name > b.first_name) {
        return 1;
      }
      if (a.first_name < b.first_name) {
        return -1;
      }
      return 0;
    });
  });

  var queryString = $location.search();
  var params = {
    access_token: queryString.access_token
  };

  if (queryString.refresh_token) {
    params.refresh_token = queryString.refresh_token;
  }

  var calendarsRequest = $http({
    method: 'get',
    url: '/calendar/all',
    params: params
  });
  calendarsRequest.then(function (response) {
    $scope.calendars = response.data;
    $scope.calendars.items.sort(function (a, b) {
      var aSummary = a.summary.toUpperCase();
      var bSummary = b.summary.toUpperCase();

      if (aSummary > bSummary) {
        return 1;
      }
      if (aSummary < bSummary) {
        return -1;
      }
      return 0;
    });
  });

  $scope.sync = function () {
    $scope.data.access_token = params.access_token;
    $scope.data.refresh_token = params.refresh_token;

    var syncRequest = $http({
      method: 'post',
      url: '/calendar/sync',
      params: $scope.data
    });
    syncRequest.then(function (response) {
      $scope.assignments = response.data;
    });
  };
});
