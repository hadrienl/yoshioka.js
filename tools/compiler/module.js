/**
 * YUI module compiler
 * @module tools/compiler/module
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',

fs = require('fs'),

ModuleCompiler = function(config)
{
	this.init(config);
};

ModuleCompiler.prototype = {
	
	_file: null,
	_filecontent: '',
	
	init: function(config)
	{
		config || (config = {});
		
		this._file = config.file;
		
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
		try
		{
			return callback(this._compile());
		}
		catch (e)
		{
			console.log(e)
			if (callback)
			{
				return callback(this._filecontent);
			}
			return this._filecontent;
		}
	},
	
	_compile: function()
	{
			/**
			 * Get the module name in the comment `module`
			 */
		var module = (module = this._filecontent.match(
				/\@module ([a-zA-Z0-9\/\-\_]+)/
			)) && module[1],
			/**
			 * Get requires modules in the comment `@requires`
			 */
			requires = (requires = this._filecontent.match(
					/\@requires ([a-zA-Z0-9\/\-\_\,\s\*]+)(\@|(\*\/))/
				)) && requires[1]
				.replace(/\n/g, ' ')
				.replace(/\s/g, '')
				.replace(/\*/g, '')
				.split(/,/);
		
		this._filecontent =
"YUI().add('"+module+"', function(Y) {\n"+
this._filecontent+"\n"+
"}, '1.234', {requires: "+JSON.stringify(requires)+"})";

		return this._filecontent;
	}
}

exports.ModuleCompiler = ModuleCompiler;

})();