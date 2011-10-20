	/**
	 * App path relative to this file
	 */
var fs = require('fs'),
	sys = require('sys'),
	EventEmitter = require('events').EventEmitter,

	Fetcher = function(path)
	{
		this.init(path);
	};

/**
 * Fetcher prototype
 */
Fetcher.prototype =
{
	_event: null,
	_childs: 0,
	basepath: null,
	path: null,
	file: null,

	/**
	 * init : set the path
	 */
	init: function(config)
	{
		this.basepath = config.basepath;
		this.path = config.path + '/';
		
		this._event = new EventEmitter();
	},

	/**
	 * Fetch the content of directory
	 */
	fetch: function()
	{
		fs.readdir(
			this.basepath + this.path,
			function(err, files)
			{
				if (err)
				{
					this.setChildCount(0);
					return;
				}
				this.parse(files);
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
		if (!files)
		{
			return;
		}
		this.setChildCount(files.length);
		
		files.forEach(
			function(f)
			{
				/**
				 * Check file type
				 */
				fs.stat(
					this.basepath + this.path+f,
					function(f, err, file)
					{
						var cf;
						
						/**
						 * File is a directory ? Read its content !
						 */
						if (file.isDirectory())
						{
							var cf = new Fetcher({
								basepath: this.basepath,
								path: this.path+f
							})
							cf._event.on(
								'end',
								function()
								{
									this.setChildCount(-1);
								}.bind(this)
							);
							cf.fetch();
						}
						/**
						 * File is a javascript, read its content !
						 */
						if (file.isFile())
						{
							if (f.match(/\.l10n\.js?$/))
							{
								this.parseLocaleFile(f);
								return;
							}
							else if (f.match(/\.js$/))
							{
								this.parseJSFile(f);
								return;
							}
							else if (f.match(/\.css$/))
							{
								this.parseCSSFile(f);
								return;
							}
							else
							{
								this.parseFile(f);
							}
						}
					}.bind(this, f)
				);
			}.bind(this)
		);
	},
	setChildCount: function(number)
	{
		this._childs = this._childs+number;
		if (this._childs === 0)
		{
			this._event.emit('end');
		}
	},
	/**
	 * Parse JS File
	 */
	parseJSFile: function(f)
	{
		this.setChildCount(-1);
	},

	/**
	 * Parse CSS file
	 */
	parseCSSFile: function(f)
	{
		this.setChildCount(-1);
	},
	
	/**
	 * Parse other files
	 */
	parseFile: function(f)
	{
		this.setChildCount(-1);	
	},

	/**
	 * Parse locales files
	 */
	parseLocaleFile: function(f)
	{
		this.setChildCount(-1);
	}
};
exports.Fetcher = Fetcher;