/**
 * @module tools/server/fileparser
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),
DEFAULT_INDEX = '/index.html',

fs = require('fs'),
Maker = require('../make').Maker,
compiler = require('../compiler'),

FileParser = function(config)
{
	this.init(config);
};

/**
 * FileGetter which get a file path and transform
 * its content as its filetype
 * @class FileParser
 * @constructor
 * @param {object} config Config contains this parameters :
 * <dl>
 * 	<dt>url</dt>
 * 	<dd>Url of the file to parse</dd>
 * </dl>
 */
FileParser.prototype = {
	/**
	 * File path as an array of directories
	 * @attribute path
	 * @type Array
	 * @private
	 */
	path: null,
	/**
	 * Filename
	 * @attribute filename
	 * @type string
	 * @private
	 */
	filename: null,
	/**
	 * File extension
	 * @attribute ext
	 * @type string
	 * @private
	 */
	ext: null,
	/**
	 * File content
	 * @attribute filecontent
	 * @type string
	 * @private
	 */
	filecontent: null,
	/**
	 * Content type
	 * @attribute contenttype
	 * @type string
	 * @private
	 */
	contenttype: null,
	/**
	 * Callback to execute after the filecontent as been retreived
	 * @attribute callback
	 * @type Function
	 * @private
	 */
	callback: null,
	
	/**
	 * Init fileparser
	 * @method init
	 * @private
	 */
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
	/**
	 * Compile the file content and execute a callback to send a response
	 * @method getResponse
	 * @param {Function} callback Callback to execute. Take FileParser object
	 * as param
	 * @public
	 */
	getResponse: function(callback)
	{
		this.callback = callback;
		
		this.parseFile();
	},
	/**
	 * Get file path from the path array and filename
	 * @method _getFilePath
	 * @return string
	 * @private
	 */
	_getFilePath: function()
	{
		return (this.path.join('/')+'/'+this.filename).replace(/\/+/, '/');
	},
	/**
	 * Parse the file
	 * @method parseFile
	 * @private
	 */
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
	/**
	 * Compile HTML content
	 * @method compileHTML
	 * @private
	 */
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
	/**
	 * Compile Javascript content
	 * @method compileJS
	 * @private
	 */
	compileJS: function()
	{
		var filepath = this._getFilePath();
		
		this.contenttype = 'text/javascript';
		
		if ('/config/config.js' === filepath)
		{
			return this.makeConfig();
		}
		else if ('/config/routes.js' === filepath)
		{
			return this.makeRoutes();
		}
		else if ('/config/errors.js' === filepath)
		{
			/**
			 * compile class view into yui module
			 */
			c = new compiler.ModuleCompiler({
				file: filepath
			});
			c.parse(function(content) {
				this.filecontent = content;
				this._callback();
			}.bind(this));
		}
		else if (filepath.match(/locales/))
		{
			fs.readFile(
				APP_PATH+filepath,
				function(err, data)
				{
					var c;
				
					if (err)
					{
						return this._callbackError(err);
					}
				
					this.filecontent = data.toString();
				
					c = new compiler.I18nCompiler({
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
		else if (filepath.match(/views/))
		{
			fs.readFile(
				APP_PATH+filepath,
				function(err, data)
				{
					var c;
				
					if (err)
					{
						return this._callbackError(err);
					}
				
					this.filecontent = data.toString();
					
					/**
					 * Insert templates into class view
					 */
					c = new compiler.TemplateCompiler({
						file: this._getFilePath(),
						filecontent: this.filecontent
					});
					
					c.parse(function(content)
					{
						var c;
						
						this.filecontent = content;
						
						/**
						 * compile class view into yui module
						 */
						c = new compiler.ModuleCompiler({
							filecontent: content
						});
						c.parse(function(content) {
							this.filecontent = content;
							this._callback();
						}.bind(this));
					}.bind(this));
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
	/**
	 * Compile CSS content
	 * @method compileCSS
	 * @private
	 */
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
	/**
	 * Read file content
	 * @method readFile
	 * @private
	 */
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
	/**
	 * Make config.js file with Maker
	 * @method makeConfig
	 * @private
	 */
	makeConfig: function()
	{
		var maker = new Maker({
			dirs: ['locales', 'plugins', 'views'],
			files: ['config/errors.js'],
			basepath: '/',
			dev: true
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
	/**
	 * Compile routes
	 * @method makeRoutes
	 * @private
	 */
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
	/**
	 * Set final values and execute the callback
	 * @method _callback
	 * @private
	 */
	_callback: function()
	{
		this.httpcode = 200;
		this.callback(
			this
		);
	},
	/**
	 * Exceute an error callback.
	 * @method _callbackError
	 * @private
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
					console.log("your routes.js file is not a valid JSON.\n");
					return this._callback404();
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
	/**
	 * Execute an error Callback as a 404 not found response sent to the client
	 * @method _callback404
	 * @private
	 */
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