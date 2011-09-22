var fs = require('fs'),
	
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
		this._apppath = fs.realpathSync(__dirname.replace('/lib/tools/compiler/templates', '')+'/');
		this._file = config.file;
		if (!this._file)
		{
			throw 'file is invalid';
		}
		this._filecontent = fs.readFileSync(
			this._apppath+'/'+this._file
		).toString();
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
					'^('+VIEWS_PATH+'/[^/]+)/'
				)
			),
			tplpath, tplcontent, locales;
		
		if (!view)
		{
			return this._filecontent;
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
		
		/**
		 * Replace locales by the correct
		 */
		locales = compiled.match(
			/\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/gi
		);
		
		if (locales)
		{
			locales.forEach(
				function(l)
				{
					var l = l.match(/\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/),
						toreplace = l[0],
						key = l[1],
						params = (params = l[2]) ? params.replace(/'/,"\\\'") : 'null';
					
					compiled = compiled.replace(
						toreplace,
						"'+__('"+key+"', "+params+", true)+'"
					);
				}.bind(this)
			);
		}
		return compiled;
	}
};
exports.TemplateCompiler = TemplateCompiler;
