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
		
		if (!this._filecontent)
		{
			this._filecontent = fs.readFileSync(
				APP_PATH+'/'+this._file
			).toString();
		}
	},
	parse: function()
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
		tplpath = this._apppath+'/'+view+'/'+TEMPLATES_PATH+'/'+path+'.html';
		
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