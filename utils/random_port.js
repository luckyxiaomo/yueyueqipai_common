var net = require('net');

module.exports = function (min, max, complete) {
	var findPort = function () {
		var port = (Math.random() * (max - min + 1) + min).toFixed(0);
		var server = net.createServer();

		server.listen(port, function (error) {
			server.once('close', function () {
				complete(port);
			});
			server.close();

			server.on('error', function (error) {
				findPort();
			});
		});
	};

	findPort();
};