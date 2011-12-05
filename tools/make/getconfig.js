/**
 * @module tools/make/getconfig
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

app_config_path = APP_PATH+'/config/app_config.js',
dev_config_path = APP_PATH+'/config/dev_config.js',
tests_config_path = APP_PATH+'/config/tests_config.js',

fs = require('fs');
/**
 * Get the configuration JSON from app\_config.js and dev\_config.js
 * @method getConfig
 */
exports.getConfig = function(config)
{
	var app_config = null, dev_config = null;
	
	config || (config = {});
	
	/**
	 * Get app config
	 */
	try
	{
		app_config = fs.readFileSync(app_config_path).toString();
	}
	catch (e)
	{
		console.log("Your config/app_config.js does not exist.");
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
	if (true === config.tests)
	{
		/**
		 * Get tests config
		 */
		try
		{
			tests_config = fs.readFileSync(tests_config_path).toString();

			tests_config || (tests_config = '{}');
			tests_config = JSON.parse(tests_config);
			tests_config || (tests_config = {});
			tests_config.port || (tests_config.port = 1636);

			/**
			 * Merge app_config and dev_config
			 */
			for (var i in tests_config)
			{
				app_config[i] = tests_config[i];
			}
		}
		catch (e)
		{
			
		}
	}
	return app_config;
};

})();