(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

app_config_path = APP_PATH+'/config/app_config.js',
dev_config_path = APP_PATH+'/config/dev_config.js',

fs = require('fs');

exports.getConfig = function(config)
{
	var app_config = null, dev_config = null;
	
	config || (config = {});
	
	/**
	 * Get app config
	 */
	try
	{
		//console.log(app_config_path);
		app_config = fs.readFileSync(app_config_path).toString();
	}
	catch (e)
	{
		console.log("Your config/app_config.js does not exists.");
		app_config = {};
	}
	
	app_config || (app_config = '{}');
	
	try
	{
		app_config = JSON.parse(app_config);
	}
	catch (e)
	{
		console.log("Your config/app_config.js is not a valid JSON.");
		app_config = {};
	}
	if (true === config.dev)
	{
		/**
		 * Get dev config
		 */
		try
		{
			dev_config = fs.readFileSync(dev_config_path).toString();

			dev_config || (dev_config = '{}');
			dev_config = JSON.parse(dev_config);
			dev_config || (dev_config = {});
			dev_config.port || (dev_config.port = 1636);

			/**
			 * Merge app_config and dev_config
			 */
			for (var i in dev_config)
			{
				app_config[i] = dev_config[i];
			}
		}
		catch (e)
		{
			
		}
	}
	
	return app_config;
};

})();