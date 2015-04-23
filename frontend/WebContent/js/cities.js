'use strict';
var myApp = angular.module('myApp', []); // Taking Angular Application in Javascript Variable

//Below is the code to allow cross domain request from web server through angular.js
myApp.config(['$httpProvider', function($httpProvider) {
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
}
]);

/* Controllers */

myApp.controller('Cities', function ($scope, $http, $templateCache) {
	$scope.cities = {};
	$scope.trips = {};
	$scope.citiesId = {};
	$http.get('http://localhost:8080/cities').
	success(function(data) {
		var i = 0;
		data.forEach(function (city) {
			$scope.cities[i++] = city;
			$scope.citiesId[city.name] = city._id;
		});
	});

	$scope.sTrip = function(name) {
		$http.get('http://localhost:8080/searchtrip', {
			params: { city : name }
		}).
		success(function(data) {
			$scope.trips = data;
		});
	}

	$scope.joinTrip = function(tripId) {
		var globalName = "5533de93577d3d6a95012930";
		console.log('global = ' + globalName);
		var formData = {
				'tripid' : tripId,
				'userid' : globalName
		};

		var jdata = 'mydata='+JSON.stringify(formData);
		console.log("jdata = " + jdata);
		$http({
			method: 'POST',
			url: 'http://localhost:8080/jointrip',
			data:  jdata,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			cache: $templateCache
		}).
		success(function(response) {
			console.log("resSuc = " + response);
		}).
		error(function(response) {
			console.log("resErr = " +response);
		});
	};

	$scope.createTrip = function() {
		var globalName = "5533de93577d3d6a95012930";
		var formData = {
				'iduser' : globalName,
				'idcitystart' : $scope.citiesId[$scope.cityStartName],
				'idcityend' : $scope.citiesId[$scope.cityEndName],
				'nb' : $scope.nbSpots,
				'date' : $scope.dateTrip
		};

		var jdata = 'mydata='+JSON.stringify(formData);
		console.log("jdata = " + jdata);
		$http({
			method: 'POST',
			url: 'http://localhost:8080/createtrip',
			data:  jdata,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			cache: $templateCache
		}).
		success(function(response) {
			console.log("resSuc = " + response);
			$scope.sTrip($scope.citiesId[$scope.cityStartName]);
		}).
		error(function(response) {
			console.log("resErr = " +response);
		});
	};
	
	$scope.auth = function() {
		if ($scope.usernameAuth && $scope.passwordAuth) {
			console.log("infos");
			console.log($scope.usernameAuth + " " + $scope.passwordAuth);
			var formData = {
					'username' : $scope.usernameAuth,
					'password' : $scope.passwordAuth
			};

			var jdata = 'mydata='+JSON.stringify(formData);
			console.log("jdata = " + jdata);
			$http({
				method: 'POST',
				url: 'http://localhost:8080/login',
				data:  jdata,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				cache: $templateCache
			}).
			success(function(response) {
				console.log("resSuc = " + response);
				$scope.show = true;
			}).
			error(function(response) {
				console.log("resErr = " +response);
			});
		}
	};
	
	$scope.register = function() {
		if ($scope.usernameReg && $scope.passwordReg) {
			var formData = {
					'user_name' : $scope.usernameReg,
					'user_pwd' : $scope.passwordReg
			};

			var jdata = 'mydata='+JSON.stringify(formData);
			console.log("jdata = " + jdata);
			$http({
				method: 'POST',
				url: 'http://localhost:8080/register',
				data:  jdata,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				cache: $templateCache
			}).
			success(function(response) {
				console.log("resSuc = " + response);
				$scope.show = true;
			}).
			error(function(response) {
				console.log("resErr = " +response);
			});
		}
	};

})

//myApp.factory('Session', function($http) {
//	var Session = {
//			data: {},
//			saveSession: function() {
//				
//			},
//			updateSession: function() { 
//				Session.data = $http.get('session.json').then(function(r) { return r.data;});
//			}
//	};
//	Session.updateSession();
//	return Session; 
//});
