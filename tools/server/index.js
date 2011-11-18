/**
 * Server yoshioka.js. It compile and serve all the files for the developpement
 * phase. Then it can build an autonome static version of the application.
 * @module tools/server
 */

(function(){

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

http = require('http'),
httpProxy = require('http-proxy'),

util = require('util'),
fs = require('fs'),

getconfig = require('../make/getconfig'),
UnitTests = require('../unittests').UnitTests,
Cli = require('./cli').Cli,
FileParser = require('./fileparser').FileParser,
Fixtures,

Server = function(config)
{
	this.init(config);
};

try
{
	/**
	 * Try to load your own fixture class
	 */
	Fixtures = require(APP_PATH+'fixtures').Fixtures;
}
catch (e) {
	/**
	 * Load the bundled one
	 */
	Fixtures = require('./fixtures').Fixtures;
}


/**
 * Server
 * @class Server
 * @constructor
 */
Server.prototype = {
	/**
	 * Proxy object for API request proxy pass
	 * @attribute _proxy
	 * @private
	 */
	_proxy: null,
	/**
	 * Cli object
	 * @attribute _cli
	 * @private
	 */
	_cli: null,
	/**
	 * HTTP server object
	 * @attribute _http
	 * @private
	 */
	_http: null,
	/**
	 * Port number for HTTP server
	 * @attribute _port
	 * @private
	 */
	_port: null,
	
	/**
	 * Init Server with config from add_config.js and dev_config.js.
	 * Start a HTTP server and wait for client request. Call _control method
	 * on request.
	 * @method init
	 * @private
	 */
	init: function()
	{
		var config = getconfig.getConfig({
			dev: true
		});
		
		this._cli = new Cli({
			dev: true
		});
		
		this._proxy = new httpProxy.RoutingProxy();
		
		this._port = config.port || 1636;
		
		this._http = http.createServer(
			function(req, res)
			{
				this._control(req, res);
			}.bind(this)
		);
		
		this._http.listen(this._port);
	},
	/**
	 * Dispatch the request by calling the correct callback according to the
	 * request
	 * @method _control
	 * @param {Request} req Reques
	 * @param {Response} res Response
	 * @private
	 */
	_control :function (req, res)
	{
		var url = req.url,
			f,
			fixtures_path = null,
			config = getconfig.getConfig({
				dev: true
			});
		
		if (url.match(/^\/$/))
		{
			url+='index.html';
		}
		
		/**
		 * If url is __unittests, then, display unit tests
		 */
		if (url.match(/^\/__unittests/))
		{
			try
			{
				f = new UnitTests({
					test: url.match(/^\/__unittests(\/(.*?)$)?/)[2]
				});
			}
			catch (e)
			{
				res.writeHead(500, {'Content-Type': 'text/plain'});
				res.end(
					e.message
				);
				return;
			}
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
		if (config &&
			config.fixtures)
		{
			config.fixtures.forEach(
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
					req.postData = '';

					if (req.method == 'POST')
					{
						req.on(
							'data',
							function (data)
							{
								req.postData += data;
							}
						);
						req.on(
							'end',
							function()
							{
								var f = new Fixtures({
									request: req,
									postData: req.postData
								});
								try
								{
									res.writeHead(
										200,
										{'Content-Type': 'text/plain'}
									);
									res.end(
										f.getData()
									);
								}
								catch (e)
								{
									res.writeHead(
										500,
										{'Content-Type': 'text/plain'}
									);
									res.end(
										e.message
									);
								}
							}.bind(this)
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
						host: fixtures_path.proxy.host || '127.0.0.1',
						port: fixtures_path.proxy.port || '80'
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
