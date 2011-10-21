var APP_PATH = __dirname.replace('yoshioka.js', ''),
	DEFAULT_INDEX = '/index.html',
	
	app_config = APP_PATH+'/config/app_config.js',
	
	http = require('http'),
	httpProxy = require('http-proxy'),
	
	proxy = new httpProxy.RoutingProxy(),
	
	fs = require('fs'),
	
	TemplateCompiler = require('./tools/compiler/templates/compiler').TemplateCompiler,
	L10nCompiler = require('./tools/compiler/l10n/compiler').L10nCompiler,
	Maker = require('./tools/make/make').Maker,
	
	/**
	 * Controller which get a file path and transform
	 * its content as its filetype
	 */
	Controller = function(config)
	{
		this.init(config);
	};

Controller.prototype = {
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
		return this.path.join('/')+'/'+this.filename;
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
				if (err)
				{
					return this._callbackError(err);
				}
				this.filecontent = data.toString();
				
				/**
				 * Replace some tags
				 */
				this.filecontent = this.filecontent
					.replace(
						/\{\$basepath\}/gi,
						this.path.join('/').replace(APP_PATH, ''));
				
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
				
					c = new L10nCompiler({
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
				
					c = new TemplateCompiler({
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
		var m = new Maker({
			dirs: ['locales', 'plugins', 'views'],
			apppath: APP_PATH,
			basepath: ''
		});
		m._event.on(
			'end',
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
		)
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

/**
 * Get app config
 */
app_config = fs.readFileSync(app_config).toString();
app_config || (app_config = '{}');
app_config = JSON.parse(app_config);

http.createServer(function (req, res)
{
	var url = req.url,
		c,
		proxy_path = null;
	
	if (url === '/')
	{
		url = DEFAULT_INDEX;
	}
	
	/**
	 * Proxy request to apache webserver (for API)
	 */
	if (app_config.proxy_path)
	{
		app_config.proxy_path.forEach(
			function(p)
			{
				if (url.match(p.path))
				{
					proxy_path = p;
				}
			}
		);
		if (proxy_path)
		{
			if (proxy_path.replace_url)
			{
				url = url.match(proxy_path.replace_url);
				url = url ? url[1]: '/';
				req.url = url;
			}
			proxy.proxyRequest(req, res, {
				host: proxy_path.host || '127.0.0.1',
				port: proxy_path.port || '80'
			});
			return;
		}
	}
	
	c = new Controller({
		url: url
	});
	
	c.getResponse(function(c)
	{
		this.writeHead(c.httpcode, {'Content-Type': c.contenttype});
		this.end(
			c.filecontent
		);
	}.bind(res))
	
	delete c;
	
}).listen(1636,
"192.168.16.36");
//"127.0.0.1");
