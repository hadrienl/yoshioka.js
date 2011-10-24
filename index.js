(function() {

var APP_PATH = __dirname.replace('yoshioka.js', ''),
	
	app_config = APP_PATH+'/config/app_config.js',
	
	fs = require('fs'),
	Server = require('./tools/server').Server;

/**
 * Get app config
 */
app_config = fs.readFileSync(app_config).toString();
app_config || (app_config = '{}');
app_config = JSON.parse(app_config);
app_config.dev || (app_config.dev = {});
app_config.dev.port || (app_config.dev.port = 1636);

new Server(app_config.dev);

})();