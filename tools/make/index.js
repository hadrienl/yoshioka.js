(function(){

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

fs = require('fs'),
events = require('events'),

Fetcher = require('../fetcher').Fetcher,

Maker = function(config)
{
	this.init.apply(this, arguments);
};

Maker.prototype = new Fetcher();
Maker.superclass = Fetcher.prototype;
Maker.prototype.dirs = null;
Maker.prototype.files = null;
Maker.prototype.basepath = null;
Maker.prototype._filecounts = null;
Maker.prototype._modules = null;
Maker.prototype.init = function(config)
{
	Maker.superclass.init.apply(this, arguments);
	
	config || (config = {});
	
	this.basepath = config.basepath ? config.basepath : '/';
	this._modules = {};
};
/**
 * Parse a file
 */
Maker.prototype._parseFile = function(path)
{
	/**
	 * Read file content
	 */
	fs.readFile(
		APP_PATH+path,
		function(err, data)
		{
			/**
			 * Check file type
			 */
			if (path.match(/\.i18n\.js$/))
			{
				/**
				 * Locale file
				 */
				this._parseLocaleFile(path);
			}
			else if (path.match(/\.js$/) &&
					!path.match(/test\.js$/))
			{
				/**
				 * Javascript file
				 */
				this._parseJSFile(path);
			}
			else if (path.match(/\.css$/))
			{
				/**
				 * CSS file
				 */
				this._parseCSSFile(path);
			}
			else if (path.match(/\.html$/))
			{
				/**
				 * CSS file
				 */
				this._parseHTMLFile(path);
			}
			else
			{
				this._parseStaticFile(path);
			}
		}.bind(this)
	);
};
Maker.prototype._parseLocaleFile = function(path)
{
	var locale = (locale = path.match(/locales\/([^\/]+)/)) ?
			locale[1] : null,
		file = (file = path.split(/\//)) && file[file.length - 1],
		module = 'i18n_'+locale+'_'+file.replace(/.i18n\.js?/, '');
	
	/**
	 * Generate config object for
	 * this module
	 */
	this._modules[module] = {};
	this._modules[module].path = path;
	
	
	/**
	 * Decrement file count and check
	 */
	this._filecount--;
	this._checkFileCount();
};
Maker.prototype._parseJSFile = function(path)
{
	/**
	 * Read the file content to get the requires
	 */
	fs.readFile(
		APP_PATH+path,
		function(err, data)
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
			this._modules[module] = {};
			this._modules[module].path = path;
			if (requires)
			{
				this._modules[module].requires = JSON.parse(requires)
			}
			
			/**
			 * Decrement file count and check
			 */
			this._filecount--;
			this._checkFileCount();
			
		}.bind(this)
	);
};
Maker.prototype._parseCSSFile = function(path)
{
	var file = (file = path.split(/\//)) && file[file.length - 1],
		module = path.match(/([^\/]+)\/assets\//),
		isplugin = path.match(/^plugins\//);
	
	if (!module)
	{
		throw 'CSS file unknown path : ' + path;
	}

	module = 'css_'+(isplugin ? 'plugins_':'')+module[1]+'_'+file.split(/\./)[0];
	/**
	 * Generate config object for
	 * this module
	 */
	this._modules[module] = {};
	this._modules[module].path = path;
	this._modules[module].type = 'css';
	
	
	/**
	 * Decrement file count and check
	 */
	this._filecount--;
	this._checkFileCount();
};
Maker.prototype._parseStaticFile = function()
{
	this._filecount--;
	this._checkFileCount();
};
Maker.prototype._parseHTMLFile = function()
{
	this._filecount--;
	this._checkFileCount();
};
/**
 * Check the file count. Fire a `end` event if equal to 0.
 */
Maker.prototype._checkFileCount = function()
{
	if (this._filecount === 0)
	{
		this.emit('parseEnd');
	}
};
// Write config file
Maker.prototype.writeConfig = function(path)
{
	/**
	 * Get the default config file
	 */
	var coreConfig, appConfig, YUI_config;
	
	path || (path = APP_PATH);
	
	try
	{
		coreConfig = fs.readFileSync(
			APP_PATH+'yoshioka.js/core/core_config.js'
		).toString();
	}
	catch (e)
	{
		throw new Error("Core config is missing. Please restore the yoshioka.js/core/core_config.js file.\n");
	}

	try
	{
		appConfig = fs.readFileSync(
			APP_PATH+'config/app_config.js'
		).toString();
	}
	catch (e)
	{
		throw new Error("App config is missing. Please put a app_config.js file into your config folder.\n");
	}
	
	/**
	 * Set YUI_config default values
	 */
	YUI_config = JSON.parse(appConfig);
	YUI_config.app || (YUI_config.app = 'ys');
	YUI_config.appmainview || (YUI_config.appmainview = 'main');
	YUI_config.groups || (YUI_config.groups = {});
	YUI_config.groups.core = JSON.parse(coreConfig);
	YUI_config.groups.core.base = this.basepath;

	/**
	 * App group config
	 */
	YUI_config.groups[YUI_config.app] ||
		(YUI_config.groups[YUI_config.app] = {});
	YUI_config.groups[YUI_config.app].modules = this._modules;
	YUI_config.groups[YUI_config.app].base = this.basepath;

	fs.writeFile(
		path+'config/config.js',
		'YUI_config=' + JSON.stringify(YUI_config) + ';',
		function(err)
		{
			this.emit('writeEnd');
		}.bind(this)
	);
};

exports.Maker = Maker;

})();