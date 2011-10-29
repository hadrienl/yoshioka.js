/**
 * Templates compiler
 * @module tools/compiler/template
 */
(function() {

var fs = require('fs'),

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',	
VIEWS_PATH = 'views',
TEMPLATES_PATH = 'templates',
HTMLCompiler = require('./html').HTMLCompiler;
	
TemplateCompiler = function(config)
{
	/**
	 * variable description
	 * @type type
	 */
	this.init(config);
};
TemplateCompiler.prototype =
{
	_apppath: null,
	_file: null,
	_filecontent: '',
	_filecount: 0,
	
	init: function(config)
	{
		this._file = config.file;
		if (!this._file)
		{
			throw 'file is invalid';
		}
		this._filecontent = config.filecontent;
		this._filecount = 0;
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
		var tplinc = this._filecontent.match(/\{\$(.*?)\}/gi);
		
		if (tplinc)
		{
			tplinc.forEach(
				function(t)
				{
					this._filecount++;
					this.getTpl(
						t.match(/\{\$(.*?)\}/)[1],
						function(t, callback, compiled)
						{
							this._filecontent = this._filecontent.replace(
								t,
								compiled
							);
							this._filecount--;
							
							if (0 === this._filecount)
							{
								callback(this._filecontent);
							}
						}.bind(this, t, callback)
					);
				}.bind(this)
			);
		}
		else
		{
			if (callback)
			{
				return callback(this._filecontent)
			}
			return this._filecontent;
		}
	},
	getTpl: function(path, callback)
	{
		var view = this._file.match(
				new RegExp(
					'^(/?'+VIEWS_PATH+'/[^/]+)/'
				)
			),
			tplpath, tplcontent, locales, c;
		
		if (!view)
		{
			return '';
		}
		
		view = view[1];
		
		tplpath = '/'+view+'/'+TEMPLATES_PATH+'/'+path+'.html';
		
		c = new HTMLCompiler({
			file: tplpath,
			basepath: '/'
		});
		c.parse(
			function(callback, content)
			{
				/**
				 * Compile the template content into an array of strings with a join()
				 */
				var compiled = "'"+
					content
						.replace(/'/gi,"\\\'")
						.split(/\n/).join("'+\n'")+"'";

				if (callback)
				{
					return callback(compiled)
				}
			}.bind(this, callback)
		);
	}
};
exports.TemplateCompiler = TemplateCompiler;


})();