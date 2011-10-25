(function() {

var

CSSCompiler = function(config)
{
	this.init(config);
};
CSSCompiler.prototype = {
	
	_file: null,
	_filecontent: '',
	
	init: function(config)
	{
		config || (config = {});
		
		this._file = config.file;
		
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
		return this._filecontent;
	}
}

exports.CSSCompiler = CSSCompiler;

})();