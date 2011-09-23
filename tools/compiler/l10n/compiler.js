var fs = require('fs'),

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
	_apppath: null,
	_file: null,
	_filecontent: '',

	init: function(config)
	{
		this._apppath = fs.realpathSync(__dirname.replace('/yoshioka.js/tools/compiler/l10n', ''))+'/';
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
		var pathparts = this._file.match(/([^\/]+)\/([^\/]+)\.l10n/),
			locale = pathparts[1],
			file = pathparts[2],
			module = 'l10n_'+locale+'_'+file,
			lines = {};

		this._filecontent.split(/\n/).forEach(
			function(l)
			{
				var kv = l.match(/^(.*?)\s*=\s*(.*?)$/);
				if (!kv) return;
				lines[kv[1]] = kv[2];
			}
		);

		return JS_TEMPLATE
			.replace('{$module}', module)
			.replace('{$locale}', locale)
			.replace('{$file}', file)
			.replace('{$content}', JSON.stringify(lines));
	}
};
exports.L10nCompiler = L10nCompiler;
