(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
JS_TEMPLATE = "YUI().add('ys_routes', function(Y) {Y.namespace('ys').routes={$routes};});",

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
		this._filecontent = fs.readFileSync(
			APP_PATH+this._file
		).toString();
	},
	parse: function()
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
		
		return JS_TEMPLATE.replace(/\{\$routes\}/, JSON.stringify(routes));
	}
};

exports.RoutesCompiler = RoutesCompiler;

})();