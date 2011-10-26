(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),
DEFAULT_INDEX = '/index.html',

fs = require('fs'),
Maker = require('../make').Maker,
compiler = require('../compiler'),

/**
 * FileGetter which get a file path and transform
 * its content as its filetype
 */
FileParser = function(config)
{
	this.init(config);
};

/**
 * FileGetter is a helper to parse a file by its type
 */
FileParser.prototype = {
	path: null,
	filename: null,
	ext: null,
	filecontent: null,
	contenttype: null,
	callback: null,
	
	init: function(config)
	{
		var url = config.url,
			path = url.split(/\//),
			filename = path[path.length -1],
			filenameparts = filename.split(/\./),
			ext = filenameparts[filenameparts.length - 1];
		
		path.pop();
		
		this.path = path;
		this.filename = filename;
		this.ext = ext;
	},
	getResponse: function(callback)
	{
		this.callback = callback;
		
		this.parseFile();
	},
	
	_getFilePath: function()
	{
		return (this.path.join('/')+'/'+this.filename).replace(/\/+/, '/');
	},
	
	parseFile: function()
	{
		switch (this.ext)
		{
			case 'html':
				return this.compileHTML();
			case 'js':
				return this.compileJS();
			case 'css':
				return this.compileCSS();
			default:
				return this.readFile();
		}
	},
	
	compileHTML: function()
	{
		this.contenttype = 'text/html';
		
		fs.readFile(
			APP_PATH+this._getFilePath(),
			function(err, data)
			{
				var c;
				
				if (err)
				{
					return this._callbackError(err);
				}
				
				c = new compiler.HTMLCompiler({
					file: this._getFilePath(),
					filecontent: data.toString()
				});
				
				c.parse(
					function(content)
					{
						this.filecontent = content;

						this._callback();
					}.bind(this)
				);
			}.bind(this)
		);
	},
	compileJS: function()
	{
		this.contenttype = 'text/javascript';
		
		if (this._getFilePath() === '/config/config.js')
		{
			return this.makeConfig();
		}
		if (this._getFilePath() === '/config/routes.js')
		{
			return this.makeRoutes();
		}
		else if (this._getFilePath().match(/locales/))
		{
			fs.readFile(
				APP_PATH+this._getFilePath(),
				function(err, data)
				{
					var c;
				
					if (err)
					{
						return this._callbackError(err);
					}
				
					this.filecontent = data.toString();
				
					c = new compiler.L10nCompiler({
						file: this._getFilePath(),
						filecontent: this.filecontent
					});
					
					c.parse(
						function(content)
						{
							this.filecontent = content;

							this._callback();
						}.bind(this)
					);
				}.bind(this)
			);
		}
		else if (this._getFilePath().match(/views/))
		{
			fs.readFile(
				APP_PATH+this._getFilePath(),
				function(err, data)
				{
					var c;
				
					if (err)
					{
						return this._callbackError(err);
					}
				
					this.filecontent = data.toString();
				
					c = new compiler.TemplateCompiler({
						file: this._getFilePath(),
						filecontent: this.filecontent
					});
					
					c.parse(
						function(content)
						{
							this.filecontent = content;

							this._callback();
						}.bind(this)
					);
				}.bind(this)
			);
		}
		else
		{
			fs.readFile(
				APP_PATH+this._getFilePath(),
				function(err, data)
				{
					if (err)
					{
						return this._callbackError(err);
					}
					this.filecontent = data.toString();

					this._callback();
				}.bind(this)
			);
		}
	},
	compileCSS: function()
	{
		this.contenttype = 'text/css';
		
		c = new compiler.CSSCompiler({
			file: this._getFilePath()
		});
		
		c.parse(
			function(content)
			{
				this.filecontent = content;

				this._callback();
			}.bind(this)
		);
	},
	
	readFile: function()
	{
		switch (this.ext)
		{
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'gif':
				this.contenttype = 'image/'+this.ext;
				break;
		}
		
		fs.readFile(
			APP_PATH+this._getFilePath(),
			function(err, data)
			{
				if (err)
				{
					this._callbackError(err);
					return;
				}
				this.filecontent = data;
				this._callback();
			}.bind(this)
		);
	},
	
	makeConfig: function()
	{
		var maker = new Maker({
			dirs: ['locales', 'plugins', 'views'],
			files: ['config/errors.js'],
			basepath: '/'
		});

		maker.on(
			'writeEnd',
			function()
			{
				fs.readFile(
					APP_PATH+this._getFilePath(),
					function(err, data)
					{
						if (err)
						{
							this._callbackError(err);
							return;
						}
						this.filecontent = data;
						this._callback();
					}.bind(this)
				);
			}.bind(this)
		);
		maker.on(
			'parseEnd',
			function()
			{
				this.writeConfig();
			}
		);
		maker.fetch();
	},
	
	makeRoutes: function()
	{
		var c = new compiler.RoutesCompiler();
		
		try
		{
			c.parse(
				function(content)
				{
					this.filecontent = content;

					this._callback();
				}.bind(this)
			);
		}
		catch (e)
		{
			this._callbackError(e);
		}
	},
	
	_callback: function()
	{
		this.httpcode = 200;
		this.callback(
			this
		);
	},
	/**
	 * File not found, return index.html
	 */
	_callbackError: function(err)
	{
		/**
		 * Load routes files to search if path must return the DEFAULT_INDEX
		 */
		fs.readFile(
			APP_PATH+'config/routes.js',
			function(err, data)
			{
				var isValid = false;
				
				if (err)
				{
					return this._callback404();
				}
				
				try
				{
					data = JSON.parse(data.toString());
				}
				catch (e)
				{
					throw new Error("routes.js file is not a valid JSON.\n");
				}
				
				data.forEach(
					function(p)
					{
						var regexp = (function(path)
						{
							if (path instanceof RegExp) {
								return path;
							}

							path = path.replace(
								/([:*])([\w-]+)/g,
								function (match, operator, key)
								{
									keys.push(key);
									return operator === '*' ? '(.*?)' : '([^/]*)';
								});

							return new RegExp('^' + path + '$');
						})(p.path);
						
						if (regexp.exec(this._getFilePath()))
						{
							isValid = true;
						}
					}.bind(this)
				);
				
				if (!isValid)
				{
					return this._callback404();
				}
				
				this.init({
					url: DEFAULT_INDEX
				});
				this.parseFile();
			}.bind(this)
		);
	},
	_callback404: function()
	{
		var filepath = this._getFilePath();

		if (filepath === '/' ||
			filepath === DEFAULT_INDEX)
		{
			/**
			 * Application doesn't have been installed
			 */
			this.httpcode = 404;
			this.filecontent = 'Application does not have been installed. Please go to your console and type the `install` command.';
		}
		else
		{
			this.httpcode = 404;
			this.filecontent = 'Not Found';
		}
		this.callback(
			this
		);
	}
};

exports.FileParser = FileParser;

})();