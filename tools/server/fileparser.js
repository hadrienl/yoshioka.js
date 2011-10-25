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
				
				this.filecontent = c.parse();
				
				this._callback();
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
					this.filecontent = c.parse();
				
					this._callback();
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
					this.filecontent = c.parse();
				
					this._callback();
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
		
		fs.readFile(
			APP_PATH+this._getFilePath(),
			function(err, data)
			{
				if (err)
				{
					return this._callbackError(err);
				}
				this.filecontent = data;
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
		this.filename = DEFAULT_INDEX;
		
		return this.compileHTML();
	}
};

exports.FileParser = FileParser;

})();