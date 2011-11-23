/**
 * @module tools/server/fixtures
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

fs = require('fs'),
qs = require('querystring'),

Fixtures = function(req, res, config)
{
	this.init(req, res, config);
};
/**
 * Fixtures class process fixtures files and send the correct data to the client
 * @class Fixtures
 * @constructor
 * @param {object} config Config with these parameters :
 * <dl>
 * 	<dt>request</dt>
 * 	<dd>Request object from HTTP server</dd>
 * 	<dt>postData</dt>
 * 	<dd>POST data from HTTP server</dd>
 * </dl>
 */
Fixtures.prototype = {
	/**
	 * Client request
	 * @attribute request
	 * @private
	 */
	req: null,
	/**
	 * Client response
	 * @attribute res
	 * @private
	 */
	res: null,
	/**
	 * Path config
	 */
	config: null,
	/**
	 * POST data sent by the client
	 * @attribute postData
	 * @private
	 */
	postData: '',
	
	/**
	 * Compile Javascript content
	 * @attribute request
	 * @private
	 */
	init: function(req, res, config)
	{
		this.req = req;
		this.res = res;
		this.config = config;
		
		if (req.method == 'POST')
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
					return this.getReponse();
				}.bind(this)
			);
		}
		else
		{
			return this.getReponse();
		}
	},
	getReponse: function()
	{
		try
		{
			this.res.writeHead(
				200,
				{'Content-Type': 'text/plain'}
			);
			this.res.end(
				this.getData()
			);
		}
		catch (e)
		{
			this.res.writeHead(
				500,
				{'Content-Type': 'text/plain'}
			);
			this.res.end(
				e.message
			);
		}
	},
	/**
	 * Get data from a fixtures file
	 * @method getData
	 * @return JSON
	 * @throws {Error} If fixture file does not exist
	 * @throws {Error} If fixtures files is not a valid JSON
	 * @public
	 */
	getData: function()
	{
		var path = this.req.url.replace(new RegExp(this.config.path), ''),
			method, fixtures, data;
		
		try
		{
			this.postData = JSON.parse(this.postData);
			path = this.postData.method + '_' + path;
		}
		catch (e)
		{
			this.postData = {};
		}
		
		try
		{
			fixtures = fs.readFileSync(
				APP_PATH+'/fixtures/'+path+'.js'
			).toString()
		}
		catch (e)
		{
			throw new Error(
				"File "+APP_PATH+'/fixtures/'+path+'.js'+" does not exist"
			);
		}
		try
		{
			fixtures = JSON.parse(
				fixtures
			);
		}
		catch (e)
		{
			throw new Error(
				"Syntax error in file "+APP_PATH+'/fixtures/'+path+'.js'
			);
		}
		
		if (!this.postData.params)
		{
			throw new Error("No data found");
		}
		
		fixtures.forEach(
			function(f)
			{
				var matchall = true,
					i;
				
				for (i in this.postData.params)
				{
					if (i === 'method')
					{
						continue;
					}
					if (f['match'][i] !== '*' &&
						f['match'][i] != this.postData.params[i])
					{
						matchall = false;
					}
				}
				
				for (i in f['match'])
				{
					if (f['match'][i] !== '*' &&
						f['match'][i] != this.postData.params[i])
					{
						matchall = false;
					}
				}
				
				if (matchall)
				{
					data = f.data;
				}
			}.bind(this)
		);
		
		if (data === undefined)
		{
			throw new Error("No data found");
		}
		
		return JSON.stringify(data);
	}
};

exports.Fixtures = Fixtures;

})();