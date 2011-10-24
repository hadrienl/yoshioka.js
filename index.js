(function() {

var APP_PATH = __dirname.replace('yoshioka.js', ''),
	
	app_config = APP_PATH+'/config/app_config.js',
	
	http = require('http'),
	httpProxy = require('http-proxy'),
	
	fs = require('fs'),
	
	UnitTests = require('./tools/unittests').UnitTests,
	Cli = require('./tools/server/cli').Cli,
	FileParser = require('./tools/server/fileparser').FileParser,
	Fixtures = require('./tools/server/fixtures').Fixtures,
	
	Server = function(config)
	{
		this.init(config);
	};

Server.prototype = {
	_proxy: null,
	_cli: null,
	_http: null,
	_port: null,
	
	init: function(config)
	{
		config || (config = {});
		
		this._cli = new Cli(config);
		
		this._proxy = new httpProxy.RoutingProxy(),
		
		this._port = config.port || 80;
		
		this._http = http.createServer(
			function(req, res)
			{
				var d = '';
				
				if (req.method == 'POST')
				{
					req.on(
						'data',
						function (data)
						{
							d += data;
						}
					);
					req.on(
						'end',
						function()
						{
							this._control(req, res, d);
						}.bind(this)
					);
				}
				else
				{
					this._control(req, res);
				}
			}.bind(this)
		);
		
		this._http.listen(this._port);
	},
	
	_control :function (req, res, postData)
	{
		var url = req.url,
			f,
			fixtures_path = null;
		
		/**
		 * If url is __unittests, then, display unit tests
		 */
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
		 * Check if url is a proxy path which need to be proxyfied
		 * (the API for example)
		 */
		if (app_config.dev &&
			app_config.dev.fixtures)
		{
			app_config.dev.fixtures.forEach(
				function(p)
				{
					if (url.match(p.path))
					{
						fixtures_path = p;
					}
				}
			);

			if (fixtures_path)
			{
				if (this._cli.useFixtures())
				{
					f = new Fixtures({
						request: req,
						postData: postData
					});
					try
					{
						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.end(
							f.getData()
						);
					}
					catch (e)
					{
						res.writeHead(500, {'Content-Type': 'text/plain'});
						res.end(
							e.message
						);
					}
					return;
				}
				else
				{
					if (fixtures_path.replace_url)
					{
						url = url.match(fixtures_path.replace_url);
						url = url ? url[1]: '/';
						req.url = url;
					}
					proxy.proxyRequest(req, res, {
						host: fixtures_path.host || '127.0.0.1',
						port: fixtures_path.port || '80'
					});
					return;
				}
			}
		}

		/**
		 * In all other case, construct a new FileParser object
		 */
		f = new FileParser({
			url: url
		});

		/**
		 * When the FileParser gets the file content, return it in the client
		 * response
		 */
		f.getResponse(function(f)
		{
			this.writeHead(f.httpcode, {'Content-Type': f.contenttype});
			this.end(
				f.filecontent
			);
		}.bind(res))

		/**
		 * Delete the FileParser
		 */
		delete f;
	}
}



/**
 * Get app config
 */
app_config = fs.readFileSync(app_config).toString();
app_config || (app_config = '{}');
app_config = JSON.parse(app_config);
app_config.dev || (app_config.dev = {});
app_config.dev.port || (app_config.dev.port = 1636);

new Server(app_config.dev);

})();