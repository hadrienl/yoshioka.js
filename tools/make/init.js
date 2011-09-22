	/**
	 * App path relative to this file
	 */
var PATH = __dirname.replace('/yoshioka.js/tools/make', ''),

	/**
	 * Filesystem module
	 */
	fs = require('fs'),

	/**
	 * Configuration of this builder
	 */
	makeconfig = JSON.parse(
		fs.readFileSync(PATH+'config/make_config.js').toString()
	),

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
		var coreConfig = fs.readFileSync(
				PATH + 'lib/core/core_config.js'
			).toString(),
			defaultConfig = fs.readFileSync(
				PATH + 'config/default_config.js'
			).toString(),

			CoreConfig = JSON.parse(coreConfig),
			YUI_config = JSON.parse(defaultConfig);

		YUI_config.groups.core = CoreConfig;
		YUI_config.groups[makeconfig.groupname] || (YUI_config.groups[makeconfig.groupname] = {});
		YUI_config.groups[makeconfig.groupname].modules = CONFIG;

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

