/**
 * Routes compiler
 * @module tools/compiler/routes
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
JS_TEMPLATE = "YUI().add('ys/routes', function(Y) {Y.namespace('ys').routes={$routes};});",

fs = require('fs'),

RoutesCompiler = function(config)
{
	this.init(config);
};
RoutesCompiler.prototype = {
	_file: 'config/routes.js',
	_filecontent: '',
	init: function(config)
	{
		config || (config = {});
		this._filecontent = config.filecontent;
	},
	parse: function(callback)
	{
		if (!this._filecontent)
		{
			this._filecontent = fs.readFile(
				APP_PATH+'/'+this._file,
				function(callback, err, data)
				{
					this._filecontent = data.toString();
					this._parse(callback);
				}.bind(this, callback)
			);
		}
		else
		{
			this._parse(callback);
		}
	},
	_parse: function(callback)
	{
		var routes;
		
		try
		{
			routes = JSON.parse(this._filecontent)
		}
		catch (e)
		{
			console.log(e)
			throw new Error("routes.js file is not a valid JSON.\n");
		}
		
		this._filecontent = JS_TEMPLATE.replace(
			/\{\$routes\}/,
			JSON.stringify(routes)
		);
		
		if (callback)
		{
			return callback(this._filecontent)
		}
		return this._filecontent;
	}
};

exports.RoutesCompiler = RoutesCompiler;

})();