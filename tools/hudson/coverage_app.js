(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

fs = require('fs'),
exec = require('child_process').exec,

Server = require('../server').Server,
Json2Clover = require('../coverage/lib/json2clover').Json2Clover,

browser = 'chromium-browser',
port = 1636,

server;

Server.prototype.__control = Server.prototype._control;
Server.prototype._control = function(req, res)
{
	var m;

	this.postData = '';
	
	if (m = req.url.match(/^\/__coverage\/report\/(.*?)$/))
	{
		req.on(
			'data',
			function (data)
			{
				this.postData += data;
			}.bind(this)
		);
		req.on(
			'end',
			function()
			{
				return this._getCoverageReport(m[1]);
			}.bind(this)
		);
	}
	else
	{
		return Server.prototype.__control.apply(this, arguments);
	}
};
Server.prototype._getCoverageReport = function(guid)
{
	var j2c = new Json2Clover(this.postData);
	
	// Stop browser
	this.browser.kill('SIGSTOP');
	
	// Write coverage json file
	fs.writeFileSync(
		APP_PATH+'coverage/'+guid+'/clover.xml',
		j2c.toClover()
	);
	
	process.exit(0);
};

server = new Server();

/**
 * Launch browser on unit tests page
 */
server.browser = exec(
	browser+' localhost:'+port+'/__coverage/',
	function(err)
	{
		if (err)
		{
			console.log(err);
			this.browser.kill('SIGSTOP');

			process.exit(1);
		}
	}.bind(server)
);
// Set a timer to kill the browser if it doesn't respond after some time
setTimeout(
	function()
	{
		server.browser.kill('SIGSTOP');
		process.exit(1);
	},
	10*60*1000,
	server
);




})();
