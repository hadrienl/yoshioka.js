(function() {

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

fs = require('fs'),
qs = require('querystring'),

Fixtures = function(config)
{
	this.init(config);
};
Fixtures.prototype = {
	request: null,
	postData: null,
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