	/**
	 * App path relative to this file
	 */
var BASE_PATH = '',

	NS = 'ys',
	
	/**
	 * Filesystem module
	 */
	fs = require('fs'),
	sys = require('sys'),
	EventEmitter = require('events').EventEmitter,

	/**
	 * modules configuration object
	 */
	CONFIG = {},

	Fetcher = require('./fetcher/fetcher').Fetcher,
	
	Maker = function(config)
	{
		this.init(config);
	};

Fetcher.prototype.parseJSFile = function(f)
{
	fs.readFile(
		this.basepath+this.path+f,
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
			
			this.setChildCount(-1);
		}.bind(this, f)
	);
};

/**
 * Parse CSS file. Get its module name and file path
 */
Fetcher.prototype.parseCSSFile = function(f)
{
	var module = this.path.match(/([^\/]+)\/assets\/$/),
		isplugin = this.path.match(/^plugins\//);

	if (!module)
	{
		throw 'CSS file unknown path : ' + this.path + f;
	}

	module = 'css_'+(isplugin ? 'plugins_':'')+module[1]+'_'+f.split(/\./)[0];
	/**
	 * Generate config object for
	 * this module
	 */
	CONFIG[module] = {};
	CONFIG[module].path = this.path + f;
	CONFIG[module].type = 'css';
	
	this.setChildCount(-1);
};

/**
 * Parse locales files
 */
Fetcher.prototype.parseLocaleFile = function(f)
{
	var locale = (locale = this.path.match(/locales\/([^\/]+)/)) ?
			locale[1] : null,
		module = 'l10n_'+locale+'_'+f.replace(/.l10n\.js?/, '');

	/**
	 * Generate config object for
	 * this module
	 */
	CONFIG[module] = {};
	CONFIG[module].path = this.path+f;
	
	this.setChildCount(-1);
};


Maker.prototype = {
	_event: null,
	dirs: null,
	basepath: null,
	init: function(config)
	{
		var count;

		this.dirs = config.dirs ? config.dirs : [];
		
		this.basepath = BASE_PATH = (config.basepath ? config.basepath : BASE_PATH);
		
		count = this.dirs.length;
		
		this._event = new EventEmitter();
		
		/**
		 * Start reading the modules folder
		 */
		this.dirs.forEach(
			function(p)
			{
				var f =new Fetcher({
					basepath: this.basepath,
					path: p
				});
				f._event.on(
					'end',
					function()
					{
						count--;
						if (count === 0)
						{
							this.end();
						}
					}.bind(this)
				);
				f.fetch();
			}.bind(this)
		);
	},
	/**
	 * On process end, all the file system has been read,
	 * write the config file !
	 * Write CONFIG file with default values
	 * and modules object
	 */
	end: function()
	{
		/**
		 * Get the default config file
		 */
		var coreConfig, appConfig, YUI_config;

		try
		{
			coreConfig = fs.readFileSync(
				BASE_PATH+'yoshioka.js/core/core_config.js'
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
				BASE_PATH+'config/app_config.js'
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
		 * App group config
		 */
		YUI_config.groups[YUI_config.app] || (YUI_config.groups[YUI_config.app] = {});
		YUI_config.groups[YUI_config.app].modules = CONFIG;

		fs.writeFileSync(
			BASE_PATH+'config/config.js',
			'YUI_config=' + JSON.stringify(YUI_config) + ';'
		);
		
		this._event.emit('end');
	}
};
exports.Maker = Maker;