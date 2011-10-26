(function() {

var fs = require('fs'),

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
L10N_PATH = 'locales',
JS_TEMPLATE = "YUI().add('{$module}', function(Y) {"+
"	Y.namespace('ys.L10n.{$locale}').{$file} = {$content};"+
"});\n",

L10nCompiler = function(config)
{
	/**
	 * variable description
	 * @type type
	 */
	this.init(config);
};
L10nCompiler.prototype =
{
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
		var pathparts = this._file.match(/([^\/]+)\/([^\/]+)\.l10n/),
			locale = pathparts[1],
			file = pathparts[2],
			module = 'l10n_'+locale+'_'+file,
			lines = {};
		
		/**
		 * Remove \n in line ending with \
		 */
		this._filecontent = this._filecontent.replace(/\\\n/g, ' ');
		
		/**
		 * Transform each line in a kv object
		 */
		this._filecontent.split(/\n/).forEach(
			function(l)
			{
				var kv = l.match(/^(.*?)\s*=\s*(.*?)$/);
				if (!kv) return;
				lines[kv[1]] = kv[2];
			}
		);

		this._filecontent = JS_TEMPLATE
			.replace('{$module}', module)
			.replace('{$locale}', locale)
			.replace('{$file}', file)
			.replace('{$content}', JSON.stringify(lines));
		
		if (callback)
		{
			return callback(this._filecontent);
		}
		return this._filecontent;
	}
};
exports.L10nCompiler = L10nCompiler;

})();