(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
BR = '[[__BR__]]',
BR_REG = /\[\[__BR__\]\]/g,
fs = require('fs'),

CSSCompiler = require('./css').CSSCompiler,

HTMLCompiler = function(config)
{
	this.init(config);
};
HTMLCompiler.prototype =
{
	_file: null,
	_filecontent: '',
	
	init: function(config)
	{
		config || (config = {});
		
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
	
	/**
	 * Parse HTML file :
	 * - replace {$basepath} variable by the environment basepath
	 * - compile {css}{/css} blocks
	 */
	parse: function()
	{
		var css;
		
		/**
		 * Replace some tags
		 */
		this._filecontent = this._filecontent
			.replace(
				/\{\$basepath\}/gi,
				this._getFilePath());
		
		/**
		 * specials tags
		 */
		this._filecontent = this._filecontent
			.replace(/\n/g, BR)
			.replace(
				/\{css\}(.*?)\{\/css\}/gi,
				function(a)
				{
					return this._compileCSSBlock(a);
				}.bind(this)
			)
			.replace(
				BR_REG,
				"\n"
			);
		
		return this._filecontent;
	},
	
	/**
	 * Compile the text between two {css}{/css} block tags
	 */
	_compileCSSBlock: function(block)
	{
		var c = new CSSCompiler({
			filecontent: block.replace(/\{css\}/, '')
							  .replace(/\{\/css\}/, '')
		});
		return c.parse();
	},
	
	/**
	 * Get the file path without filename
	 */
	_getFilePath: function()
	{
		var path = this._file.split(/\//);
		path.pop();
		return path.join('/').replace(APP_PATH, '');
	}
};
exports.HTMLCompiler = HTMLCompiler;
	
})();
