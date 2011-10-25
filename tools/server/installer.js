(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),
YS_PATH = '/yoshioka.js/',

fs = require('fs'),

Fetcher = require('../fetcher').Fetcher,

Installer = function(config)
{
	this.init(config);
};

Installer.prototype = new Fetcher();
Installer.superclass = Fetcher.prototype;
Installer.prototype._namespace = null;
Installer.prototype.init = function(config)
{
	Installer.superclass.init.apply(this, arguments);
	
	config || (config = {});
	
	this._namespace = config.namespace || 'yourapp';
	
	this.dirs = [YS_PATH+'dist'];
	
	this.on(
		'parseEnd',
		function()
		{
			this.emit('success');
		}.bind(this)
	);
};
Installer.prototype.run = function()
{
	try
	{
		this._copyFiles();
	}
	catch (e)
	{
		this.emit('failure', e);
	}
};
Installer.prototype._copyFiles = function()
{
	this.fetch();
};
Installer.prototype._parseFile = function(path)
{
	var newpath = APP_PATH+path.replace(YS_PATH+'dist/', '');
	
	this._mkdir(newpath);
	
	fs.readFile(
		APP_PATH+path,
		function(err, data)
		{
			if (err) throw err;
			
			fs.writeFile(
				newpath,
				this._compileFile(data.toString()),
				function(err)
				{
					if (err) throw err;
					
					this._filecount--;
					this._checkFileCount();
				}.bind(this)
			);
		}.bind(this)
	);
};
Installer.prototype._compileFile = function(content)
{
	return content.replace(
		/yourapp/g,
		this._namespace
	);
};

exports.Installer = Installer;

})();
