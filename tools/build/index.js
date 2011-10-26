(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),
BUILD_DIR = 'build/',

fs = require('fs'),
events = require('events'),
exec = require('child_process').exec,
util = require('util'),
compiler = require('../compiler'),
Maker = require('../make').Maker,

Builder = function(config)
{
	Builder.superclass.constructor.apply(this, arguments);
	this.init(config);
};

Builder.prototype = new Maker();
Builder.superclass = Maker.prototype;
Builder.prototype._buildname = null;
Builder.prototype._buildpath = null;
Builder.prototype._ignore = ['config/config.js', 'config/app_config.js', 'yoshioka.js/core/core_config.js'];
Builder.prototype.init = function(config)
{
	events.EventEmitter.call(this);
	
	this.dirs = ['yoshioka.js/core', 'locales', 'plugins', 'views', 'config'];
	this._filecount = 0;
	this._buildname = new Date().getTime();
	this._buildpath = BUILD_DIR+this._buildname+'/';
};
Builder.prototype.build = function()
{
	/**
	 * Create build main dir
	 */
	fs.stat(
		APP_PATH+BUILD_DIR,
		function(err, stats)
		{
			if (err)
			{
				fs.mkdirSync(APP_PATH+BUILD_DIR, 0755);
			}
			
			/**
			 * Create build subdir
			 */
			fs.stat(
				APP_PATH+this._buildpath,
				function(err, stats)
				{
					if (err)
					{
						fs.mkdirSync(APP_PATH+this._buildpath, 0755);
					}
					
					this.fetch();
				}.bind(this)
			);
		}.bind(this)
	);
	
	/**
	 * index.html
	 */
	this._filecount++;
	this._parseHTMLFile('index.html', '../index.html');
	
	/**
	 * Make config
	 */
	this._makeConfig();
};
Builder.prototype._makeConfig = function()
{
	var Maker = require('../make/').Maker,
		maker = new Maker({
			dirs: ['locales', 'plugins', 'views'],
			apppath: this._buildpath,
			basepath: this._buildname+'/'
		});
	maker.on(
		'parseEnd',
		function(maker)
		{
			try
			{
				maker.writeConfig(
					this._buildpath
				);
			}
			catch (e)
			{
				util.log(e);
			}
		}.bind(this, maker)
	);
	try
	{
		maker.fetch();
	}
	catch (e)
	{
		util.log(e);
	}
};
Builder.prototype._parseJSFile = function(path)
{
	var ignore = false,
		c;
	
	this._ignore.forEach(
		function(file)
		{
			if (path.match(file))
			{
				ignore = true;
			}
		}
	);
	
	if (ignore)
	{
		this._filecount--;
		this._checkFileCount();
		return;
	}
	
	if (path.match(/routes.js$/))
	{
		c = new compiler.RoutesCompiler();
	}
	else
	{
		c = new compiler.TemplateCompiler({
			file: path
		});
	}
	
	this._mkdir(path, BUILD_DIR+this._buildname+'/');
	
	c.parse(function(path, content)
	{
		fs.writeFile(
			this._buildpath+path,
			content,
			'utf-8',
			function(path, err, data)
			{
				/**
				 * Compress build file with YUICompressor
				 */
				this.compressJS(
					path,
					function(err, stdout, stderr)
					{
						this._filecount--;
						this._checkFileCount();
					}.bind(this)
				);
			}.bind(this, path)
		);
	}.bind(this, path));
};
Builder.prototype._parseLocaleFile = function(path)
{
	var c = new compiler.L10nCompiler({
		file: path
	});
	
	this._mkdir(path, BUILD_DIR+this._buildname+'/');
	
	c.parse(function(path, content)
	{
		fs.writeFile(
			this._buildpath+path,
			content,
			'utf-8',
			function(path, err, data)
			{
				/**
				 * Compress build file with YUICompressor
				 */
				this.compressJS(
					path,
					function(err, stdout, stderr)
					{
						this._filecount--;
						this._checkFileCount();
					}.bind(this)
				);
			}.bind(this, path)
		);
	}.bind(this, path))
};
Builder.prototype._parseCSSFile = function(path)
{
	var c = new compiler.CSSCompiler({
		file: path
	});
	
	this._mkdir(path, BUILD_DIR+this._buildname+'/');
	
	c.parse(function(path, content)
	{
		fs.writeFile(
			this._buildpath+path,
			content,
			function(path, err, data)
			{
				/**
				 * Compress build file with YUICompressor
				 */
				this.compressCSS(
					path,
					function()
					{
						this._filecount--;
						this._checkFileCount();
					}.bind(this)
				);

			}.bind(this, path)
		);
	}.bind(this, path));
	
	//console.log(path);
	this._filecount--;
	this._checkFileCount();
};
Builder.prototype._parseStaticFile = function(path)
{
	var content;
	
	if (path.match(/test\.js$/) ||
		path.match(/tpl\.html/))
	{
		this._filecount--;
		this._checkFileCount();
		return;
	}
	
	this._mkdir(path, BUILD_DIR+this._buildname+'/');
	
	/**
	 * Simple copy file in build folder
	 */
	content = fs.readFileSync(
		APP_PATH+path
	);
	
	fs.writeFileSync(
		this._buildpath+path,
		content
	);
	
	this._filecount--;
	this._checkFileCount();
};
Builder.prototype._parseHTMLFile = function(path, writepath)
{
	var c = new compiler.HTMLCompiler({
		file: path,
		basepath: '/'+this._buildname
	});
	c.parse(function(path, content)
	{
		fs.writeFile(
			this._buildpath+path,
			content
		);
		this._filecount--;
		this._checkFileCount();
	}.bind(this, writepath || path));
};
Builder.prototype.compressJS = function(path, callback)
{
	var cmd = exec(
			'java -jar '+__dirname+'/yuicompressor-2.4.6.jar --type js --charset utf8 '+this._buildpath+path+' -o '+this._buildpath+path,
			function(callback, path, err, stdout, stderr)
			{
				if (err)
				{
					util.print('YUICompressor detects errors in '+path+" :\n");
					util.print(stderr);
				}
				callback && callback(err, stdout, stderr);
			}.bind(this, callback, path)
		);
};
Builder.prototype.compressCSS = function(path, callback)
{
	var cmd = exec(
			'java -jar '+__dirname+'/yuicompressor-2.4.6.jar --type css --charset utf8 '+this._buildpath+path+' -o '+this._buildpath+path,
			function(callback, path, err, stdout, stderr)
			{
				if (err)
				{
					util.print('YUICompressor detects errors in '+path+" :\n");
					util.print(stderr);
				}
				callback && callback(err, stdout, stderr);
			}.bind(this, callback, path)
		);
};

exports.Builder = Builder;

})();