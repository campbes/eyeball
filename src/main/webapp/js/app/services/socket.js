/*global eyeballApp, io*/

eyeballApp.factory('socket', ['$rootScope',function ($rootScope) {

    function connection() {
        var socket = io.connect();
        socket.socket.reconnect();

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            disconnect : function() {
                socket.disconnect();
            }
        };
    }
    return connection;
}]);