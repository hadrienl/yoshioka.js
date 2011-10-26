(function() {

var fs = require('fs'),

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',	
VIEWS_PATH = 'views',
TEMPLATES_PATH = 'templates',
	
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
	
	init: function(config)
	{
		this._file = config.file;
		if (!this._file)
		{
			throw 'file is invalid';
		}
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
		var tplinc = this._filecontent.match(/\{\$(.*?)\}/gi);
		
		if (tplinc)
		{
			tplinc.forEach(
				function(t)
				{
					this._filecontent = this._filecontent.replace(
						t,
						this.getTpl(
							t.match(/\{\$(.*?)\}/)[1]
						)
					);
				}.bind(this)
			);
		}
		
		if (callback)
		{
			return callback(this._filecontent)
		}
		return this._filecontent;
	},
	getTpl: function(path)
	{
		var view = this._file.match(
				new RegExp(
					'^(/?'+VIEWS_PATH+'/[^/]+)/'
				)
			),
			tplpath, tplcontent, locales;
		if (!view)
		{
			return '';
		}
		
		view = view[1];
		tplpath = APP_PATH+'/'+view+'/'+TEMPLATES_PATH+'/'+path+'.html';
		
		tplcontent = fs.readFileSync(tplpath).toString();
		/**
		 * Compile the template content into an array of strings with a join()
		 */
		compiled = "'"+
			tplcontent
				.replace(/'/gi,"\\\'")
				.split(/\n/).join("'+\n'")+"'";
		
		return compiled;
	}
};
exports.TemplateCompiler = TemplateCompiler;


})();