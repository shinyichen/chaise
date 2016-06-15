(function() {
    'use strict';

    angular.module('chaise.authen', [])

    .factory('Session', ['$http', '$q', '$window', 'UriUtils', function ($http, $q, $window, UriUtils) {

        function NotFoundError(status, message) {
                this.code = 404;
                this.status = status;
                this.message = message;
        }

        NotFoundError.prototype = Object.create(Error.prototype);

        NotFoundError.prototype.constructor = NotFoundError;

        return {

            getSession: function() {
                var serviceURL = (chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : $window.location.origin + "/ermrest");

                return $http.get(serviceURL + "/authn/session").then(function(response) {
                    return response.data;
                }, function(response) {
                    // get session failed, not logged in
                    return $q.reject(new NotFoundError(response.statusText, response.data));
                });
            },

            login: function (referrer) {
                var serviceURL = (chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : $window.location.origin + "/ermrest");
                var url = serviceURL + '/authn/preauth?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
                var config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept': 'application/json'
                    }
                };

                $http.get(url, config).then(function(response){
                    var data = response.data;
                    if (data['redirect_url'] !== undefined) {
                        var url = data['redirect_url'];
                        $window.open(url, '_self');
                    } else if (data['login_form'] !== undefined) {
                        var login_form = data['login_form'];
                        var login_url = '../login?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
                        var method = login_form['method'];
                        var action = UriUtils.fixedEncodeURIComponent(login_form['action']);
                        var text = '';
                        var hidden = '';
                        for (var i = 0; i < login_form['input_fields'].length; i++) {
                            var field = login_form['input_fields'][i];
                            if (field.type === 'text') {
                                text = UriUtils.fixedEncodeURIComponent(field.name);
                            } else {
                                hidden = UriUtils.fixedEncodeURIComponent(field.name);
                            }
                        }
                        login_url += '&method=' + method + '&action=' + action + '&text=' + text + '&hidden=' + hidden;
                        $window.location = login_url;
                    }
                }, function() {
                    document.body.style.cursor = 'default';
                    $window.location = '../login?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
                });

            },

            logout: function() {
                var serviceURL = (chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : $window.location.origin + "/ermrest");
                var logoutURL = chaiseConfig['logoutURL'];
                var url = serviceURL + "/authn/session";
                if (logoutURL !== undefined) {
                    url += '?logout_url=' + UriUtils.fixedEncodeURIComponent(logoutURL);
                }

                $http.delete(url).then(function(response) {
                    $window.location = response.data.logout_url ;
                }, function() {
                    // user not logged in
                    $window.location = "/chaise/logout";
                });
            },

            NotFoundError: NotFoundError

        }
    }])

})();