(function() {

var APP_PATH = __dirname.replace('yoshioka.js', ''),
	
	app_config = APP_PATH+'/config/app_config.js',
	
	http = require('http'),
	httpProxy = require('http-proxy'),
	
	proxy = new httpProxy.RoutingProxy(),
	
	fs = require('fs'),
	
	UnitTests = require('./tools/unittests').UnitTests,
	Cli = require('./tools/server/cli').Cli,
	FileParser = require('./tools/server/fileparser').FileParser;


/**
 * Get app config
 */
app_config = fs.readFileSync(app_config).toString();
app_config || (app_config = '{}');
app_config = JSON.parse(app_config);
app_config.dev || (app_config.dev = {});
app_config.dev.port || (app_config.dev.port = 1636)


/**
 * Create Http Server
 */
http.createServer(function (req, res)
{
	var url = req.url,
		f,
		proxy_path = null;
	
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
		app_config.dev.proxy_path)
	{
		app_config.dev.proxy_path.forEach(
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
	
}).listen(app_config.dev.port);

/**
 * Create Command Line Interface
 */
new Cli({
	app_config: app_config
});

})();