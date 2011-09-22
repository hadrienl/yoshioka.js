	/**
	 * App path relative to this file
	 */
var PATH = __dirname.replace('/yoshioka.js/tools/make/fetcher', '')+'/',

	fs = require('fs'),

	Fetcher = function(path)
	{
		this.init(path);
	};

/**
 * Fetcher prototype
 */
Fetcher.prototype =
{
	path: null,
	file: null,

	/**
	 * init : set the path
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
							return (new Fetcher(this.path+f)).fetch();
						}
						/**
						 * File is a javascript, read its content !
						 */
						if (file.isFile())
						{
							this.file = f;
							if (this.file.match(/\.js$/))
							{
								this.parseJSFile();
								return;
							}
							else if (this.file.match(/\.css$/))
							{
								this.parseCSSFile();
								return;
							}
							else if (this.file.match(/\.l10n$/))
							{
								this.parseLocaleFile();
								return;
							}
						}
					}.bind(this)
				);
			}.bind(this)
		);
	},

	/**
	 * Parse JS File
	 */
	parseJSFile: function(script, f)
	{

	},

	/**
	 * Parse CSS file
	 */
	parseCSSFile: function()
	{

	},

	/**
	 * Parse locales files
	 */
	parseLocaleFile: function()
	{

	}
};
exports.Fetcher = Fetcher;