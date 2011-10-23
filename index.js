var APP_PATH = __dirname.replace('yoshioka.js', ''),
	DEFAULT_INDEX = '/index.html',
	
	app_config = APP_PATH+'/config/app_config.js',
	
	http = require('http'),
	httpProxy = require('http-proxy'),
	rl = require('readline'),
	
	proxy = new httpProxy.RoutingProxy(),
	
	fs = require('fs'),
	
	TemplateCompiler = require('./tools/compiler/templates/compiler').TemplateCompiler,
	L10nCompiler = require('./tools/compiler/l10n/compiler').L10nCompiler,
	Maker = require('./tools/make/make').Maker,
	UnitTests = require('./tools/unittests').UnitTests,
	
	/**
	 * Command Line Interface
	 */
	Cli = function(config)
	{
		this.init(config);
	},
	/**
	 * FileGetter which get a file path and transform
	 * its content as its filetype
	 */
	FileGetter = function(config)
	{
		this.init(config);
	};


/**
 * FileGetter is a helper to parse a file by its type
 */
FileGetter.prototype = {
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
 * Command Line Interface
 */
Cli.prototype = {
	init: function(config)
	{
		this.cli = rl.createInterface(
			process.stdin, process.stdout, null);
		
		this.cli.write(
		"\n------------------------------------------\n"+
		"Welcome to Yoshioka.js development server.\n"+
		"NEVER run this server on production !\n\n"+
		"Type `help` or `h` to know the availables commands :\n"+
		"------------------------------------------\n\n"
		);
		
		this.initPrompt();
	},
	initPrompt: function()
	{
		this.cli.question(
			'> ',
			this.answerInitPrompt.bind(this)
		);
	},
	answerInitPrompt: function(answer)
	{
		switch (answer)
		{
			case 'help':
			case 'h':
				this.cli.write(
"Available commands are :\n"+
" - help (h) : display this help\n"+
" - build (b) : build your project\n"
				);
				this.initPrompt();
				break;
			case 'build':
			case 'b':
				this.cli.question(
					"Have you run the unit tests before ? (YES or no) ",
					function(answer)
					{
						if (answer.toLowerCase() === 'yes')
						{
							return this.build();
						}
						
						this.initPrompt();
					}.bind(this)
				)
				break;
			
			case 'nyancat':
				this.cli.write(
"\n+      o     +              o   \n    +             o     +       +\no          +\n    o  +           +        +\n+        o     o       +        o\n-_-_-_-_-_-_-_,------,      o \n_-_-_-_-_-_-_-|   /\\_/\\  \n-_-_-_-_-_-_-~|__( ^ .^)  +     +  \n_-_-_-_-_-_-_-\"\"  \"\"      \n+      o         o   +       o\n    +         +\no        o         o      o     +\n    o           +\n+      +     o        o      +\n\n"
				);
			default:
				this.initPrompt();
		}
	},
	build: function()
	{
		this.cli.write("Building…");
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
		f,
		proxy_path = null;
	
	if (url === '/')
	{
		url = DEFAULT_INDEX;
	}
	
	if (url === '/__unittests')
	{
		f = new UnitTests();
		/**
		 * Start unit tests
		 */
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(
			f.getHTML()
		);
		return;
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
	
	/**
	 * Construct a new FileGetter object
	 */
	f = new FileGetter({
		url: url
	});
	
	f.getResponse(function(f)
	{
		this.writeHead(f.httpcode, {'Content-Type': f.contenttype});
		this.end(
			f.filecontent
		);
	}.bind(res))
	
	delete f;
	
}).listen(1636);

new Cli();