/**
 * @module tools/server/fixtures
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

fs = require('fs'),
qs = require('querystring'),

Fixtures = function(config)
{
	this.init(config);
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
	request: null,
	/**
	 * POST data sent by the client
	 * @attribute postData
	 * @private
	 */
	postData: null,
	
	/**
	 * Compile Javascript content
	 * @attribute request
	 * @private
	 */
	init: function(config)
	{
		config || (config = {});
		
		this._request = config.request;
		
		try
		{
			this._postData = JSON.parse(config.postData);
		}
		catch (e)
		{
			this._postData = qs.parse(config.postData);
		}
	},
	/**
	 * Get data from a fixtures file
	 * @method getData
	 * @return JSON
	 * @throws {Error} If fixture file does not exists
	 * @throws {Error} If fixtures files is not a valid JSON
	 * @public
	 */
	getData: function()
	{
		var method = this._postData.method,
			fixtures, data;
			
		try
		{
			fixtures = fs.readFileSync(
				APP_PATH+'/fixtures/'+method+'.js'
			).toString()
		}
		catch (e)
		{
			throw new Error(
				"File "+APP_PATH+'/fixtures/'+method+'.js'+" does not exists"
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
				"Syntax error in file "+APP_PATH+'/fixtures/'+method+'.js'
			);
		}
		
		fixtures.forEach(
			function(f)
			{
				var matchall = true,
					i;
				for (i in this._postData)
				{
					if (i === 'method')
					{
						continue;
					}
					if (f['match'][i] !== this._postData[i])
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
		
		return JSON.stringify(data);
	}
};

exports.Fixtures = Fixtures;

})();