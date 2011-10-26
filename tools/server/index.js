(function(){

var

http = require('http'),
httpProxy = require('http-proxy'),

util = require('util'),
fs = require('fs'),

UnitTests = require('../unittests').UnitTests,
Cli = require('./cli').Cli,
FileParser = require('./fileparser').FileParser,
Fixtures = require('./fixtures').Fixtures,

Server = function(config)
{
	this.init(config);
};

Server.prototype = {
	_proxy: null,
	_cli: null,
	_http: null,
	_port: null,
	_config: null,
	
	init: function(config)
	{
		config || (config = {});
		
		this._cli = new Cli(config);
		
		this._proxy = new httpProxy.RoutingProxy(),
		
		this._port = config.port || 80;
		this._config = config || {};
		
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
		
		if (url.match(/^\/logerror\?/))
		{
			try
			{
				util.log("Uncaught exception received from client :")
				console.log(
					JSON.parse(
						decodeURIComponent(
							url.replace(/^\/logerror\?/, '')
						)
					)
				);
			}
			catch (e)
			{
				util.log(e);
			}
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.end(
				''
			);
			return;
		}

		/**
		 * Check if url is a proxy path which need to be proxyfied
		 * (the API for example)
		 */
		if (this._config &&
			this._config.fixtures)
		{
			this._config.fixtures.forEach(
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
					this._proxy.proxyRequest(req, res, {
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
};

exports.Server = Server;
	
})();
