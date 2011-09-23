	/**
	 * App path relative to this file
	 */
var PATH = __dirname.replace('/yoshioka.js/tools/make', '')+'/',
	NS = 'ys',
	
	/**
	 * Filesystem module
	 */
	fs = require('fs'),
	sys = require('sys'),

	/**
	 * modules configuration object
	 */
	CONFIG = {},

	fetcher = require('./fetcher/fetcher'),
	Fetcher = fetcher.Fetcher;

Fetcher.prototype.parseJSFile = function()
{
	fs.readFile(
		PATH + this.path+this.file,
		function(f, err, data)
		{
			var script = data.toString(),
				/**
				 * get module name from
				 * YUI().add call
				 */
				module = script.match(
					/add\(['"](.*?)['"]/
				),
				/**
				 * Get the requires array
				 */
				requires = script.match(
					/requires\s*?\:\s*?(\[.*?\])/
				);

			if (module)
			{
				module = module[1];
			}
			if (requires)
			{
				requires = requires[1];
			}
			if (!module)
			{
				return;
			}

			/**
			 * Generate config object for
			 * this module
			 */
			CONFIG[module] = {};
			CONFIG[module].path = this.path + f;
			if (requires)
			{
				CONFIG[module].requires = JSON.parse(requires)
			}
		}.bind(this, this.file)
	);
};

/**
 * Parse CSS file. Get its module name and file path
 */
Fetcher.prototype.parseCSSFile = function()
{
	var module = this.path.match(/([^\/]+)\/assets\/$/),
		isplugin = this.path.match(/^plugins\//);

	if (!module)
	{
		throw 'CSS file unknown path : ' + this.path + this.file;
	}

	module = 'css_'+(isplugin ? 'plugins_':'')+module[1]+'_'+this.file.split(/\./)[0];
	/**
	 * Generate config object for
	 * this module
	 */
	CONFIG[module] = {};
	CONFIG[module].path = this.path + this.file;
	CONFIG[module].type = 'css';
};

/**
 * Parse locales files
 */
Fetcher.prototype.parseLocaleFile = function()
{
	var locale = (locale = this.path.match(/locales\/([^\/]+)/)) ?
			locale[1] : null,
		module = 'l10n_'+locale+'_'+this.file.replace('.l10n', '');

	/**
	 * Generate config object for
	 * this module
	 */
	CONFIG[module] = {};
	CONFIG[module].path = this.path+this.file+'.js';
};

/**
 * On process end, all the file system has been read, write the config file !
 * Write CONFIG file with default values and modules object
 */
process.on(
	'exit',
	function()
	{
		/**
		 * Get the default config file
		 */
		var coreConfig, appConfig, YUI_config;
		
		try
		{
			coreConfig = fs.readFileSync(
				PATH + 'yoshioka.js/core/core_config.js'
			).toString();
		}
		catch (e)
		{
			sys.print("Core config is missing. Please restore the yoshioka.js/core/core_config.js file.\n");
			throw e;
		}
		
		try
		{
			appConfig = fs.readFileSync(
				PATH + 'config/app_config.js'
			).toString();
		}
		catch (e)
		{
			sys.print("App config is missing. Please put a app_config.js file into your config folder.\n");
			throw e
		}
		
		/**
		 * Set YUI_config default values
		 */
		YUI_config = JSON.parse(appConfig);
		YUI_config.app || (YUI_config.app = NS);
		YUI_config.appmainview || (YUI_config.appmainview = 'main');
		YUI_config.groups || (YUI_config.groups = {});
		YUI_config.groups.core = JSON.parse(coreConfig);
		
		/**
		 * APp group config
		 */
		YUI_config.groups[YUI_config.app] || (YUI_config.groups[YUI_config.app] = {});
		YUI_config.groups[YUI_config.app].modules = CONFIG;

		fs.writeFileSync(
			PATH + 'config/config.js',
			'YUI_config=' + JSON.stringify(YUI_config) + ';'
		);
	}
);

/**
 * Start reading the modules folder
 */
['locales', 'plugins', 'views'].forEach(
	function(p)
	{
		(new Fetcher(p)).fetch();
	}
);

