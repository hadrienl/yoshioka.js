(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

getconfig = require('./tools/make/getconfig'),
Server = require('./tools/server').Server;
new Server(
	getconfig.getConfig({
		dev: true
	})
);

})();
