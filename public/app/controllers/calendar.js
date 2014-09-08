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
      console.log(response.data);
    });
  };
});
