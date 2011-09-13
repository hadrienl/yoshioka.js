var PATH = __dirname + '/../',

	fs = require('fs'),
	
	fetchdir,writeConfigFile,
	CONFIG = {};

/**
 * DirFecther class
 * @constructor
 * @author Hadrien Lanneau
 */
var DirFetcher = function(path)
{
	this.init(path);
};
DirFetcher.prototype =
{
	path: null,
	file: null,
	
	/**
	 * init
	 */
	init: function(path)
	{
		this.path = path + '/';
	},
	/**
	 * Fetch the content of directory
	 */
	fetch: function()
	{
		fs.readdir(
			PATH + this.path,
			function(err, files)
			{
				if (!err)
				{
					this.parse(files);
				}
			}.bind(this)
		);
	},
	/**
	 * Parse each files and apply a process for each type :
	 * - Directories are read,
	 * - JS files are parsed,
	 * - CSS files are parsed
	 */
	parse: function(files)
	{
		files.forEach(
			function(f)
			{
				/**
				 * Check file type
				 */
				fs.stat(
					PATH + this.path+f,
					function(err, file)
					{
						/**
						 * File is a directory ? Read its content !
						 */
						if (file.isDirectory())
						{
							return (new DirFetcher(this.path+f)).fetch();
						}
						/**
						 * File is a javascript, read its content !
						 */
						if (file.isFile())
						{
							this.file = f;
							if (this.file.match(/\.js$/))
							{
								fs.readFile(
									PATH + this.path+f,
									function(err, data)
									{
										this.parseJSFile(data.toString());
									}.bind(this)
								);
								return;
							}
							else if (this.file.match(/\.css$/))
							{
								this.parseCSSFile();
								return;
							}
						}
					}.bind(this)
				);
			}.bind(this)
		);
	},
	/**
	 * Parse JS File. Get its module name, filepath and requires modules
	 */
	parseJSFile: function(script)
	{
			/**
			 * get module name from
			 * YUI().add call
			 */
		var module = script.match(
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
		CONFIG[module].path = this.path + this.file;
		if (requires)
		{
			CONFIG[module].requires = JSON.parse(requires)
		}
	},
	/**
	 * Parse CSS file. Get its module name and file path
	 */
	parseCSSFile: function()
	{
		var module = this.path.match(/([^\/]+)\/assets\/$/);
		
		if (!module)
		{
			throw 'CSS file unknown path : ' + this.path + this.file;
		}
		
		module = module[1] + '_' + this.file.split(/\./)[0];
		
		/**
		 * Generate config object for
		 * this module
		 */
		CONFIG[module] = {};
		CONFIG[module].path = this.path + this.file;
		CONFIG[module].type = 'css';
	}
};

/**
 * Start reading the root folder
 */
(new DirFetcher('modules/')).fetch();

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
				PATH + 'core/core_config.js'
			).toString(),
			defaultConfig = fs.readFileSync(
				PATH + 'config/default_config.js'
			).toString(),
			
			CoreConfig = JSON.parse(coreConfig),
			YUI_config = JSON.parse(defaultConfig);
		
		YUI_config.groups.core = CoreConfig;
		YUI_config.groups.ob.modules = CONFIG;
		
		fs.writeFileSync(
			PATH + 'config/config.js',
			'YUI_config=' + JSON.stringify(YUI_config) + ';'
		);
	}
);