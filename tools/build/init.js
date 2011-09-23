(function() {
	var APP_PATH = __dirname.replace('/yoshioka.js/tools/build', '')+'/',

		fs = require('fs'),
		sys = require('sys'),
		exec = require('child_process').exec,
		fetcher = require('../make/fetcher/fetcher'),

		TemplateCompiler = require('../compiler/templates/compiler').TemplateCompiler,
		L10nCompiler = require('../compiler/l10n/compiler').L10nCompiler,
		buildname = new Date().getTime(),
		buildpath = 'build/'+buildname+'/',
		Fetcher = fetcher.Fetcher,
		dontcompress = ['app_config.js','core_config.js', 'config.js'],
		tofetch = ['yoshioka.js/core', 'locales', 'plugins', 'views', 'config'],
		waiting = tofetch.length;

	/**
	 * mkdir new build directory
	 */
	try
	{
		fs.mkdirSync(APP_PATH+'build/', 0755);
	}
	catch(e){}
	try
	{
		fs.mkdirSync(APP_PATH+'build/'+buildname, 0755);
	}
	catch(e){}


	Fetcher.prototype.createDirs= function()
	{
		var path = this.path.split('/'),
			fullpath = APP_PATH+buildpath;

		path.forEach(
			function(p)
			{
				if (p === '')
				{
					return;
				}
				fullpath+=p+'/';

				try
				{
					fs.mkdirSync(fullpath, 0755);
				}
				catch(e){}
			}
		);
	};
	/**
	 * Compress JS with YUICompressor
	 */
	Fetcher.prototype.compressJS = function(filename, callback)
	{
		var file = APP_PATH+buildpath+this.path+filename,
			cmd = exec(
				'java -jar '+__dirname+'/yuicompressor-2.4.6.jar --nomunge --type js --charset utf8 '+file+' -o '+file,
				function(callback, filename, err, stdout, stderr)
				{
					if (err)
					{
						sys.print('YUICompressor detects errors in '+this.path+filename+" :\n");
						sys.print(stderr);
					}
					this.setChildCount(-1);
				}.bind(this, callback, filename)
			);
	};
	
	/**
	 * Compress CSS with YUICompressor
	 */
	Fetcher.prototype.compressCSS = function(filename, callback)
	{
		var file = APP_PATH+buildpath+this.path+filename,
			cmd = exec(
				'java -jar '+__dirname+'/yuicompressor-2.4.6.jar --type css --charset utf8 '+file+' -o '+file,
				function(callback, filename, err, stdout, stderr)
				{
					if (err)
					{
						sys.print('YUICompressor detects errors in '+this.path+filename+" :\n");
						sys.print(stderr);
					}
					this.setChildCount(-1);
				}.bind(this, callback, filename)
			);
	};
	/**
	 * Parse every files
	 */
	Fetcher.prototype.parseJSFile = function(f)
	{
		var file = this.path+f,
			compiler = new TemplateCompiler({
				file: file
			});
		
		this.createDirs();

		/**
		 * Copy original file into build dir
		 */
		fs.writeFile(
			APP_PATH+buildpath+file,
			compiler.parse(),
			function(f, err, data)
			{
				var tocompress = true;
				dontcompress.forEach(
					function(name)
					{
						if (name === f)
						{
							tocompress = false;
						}
					}
				);
				/**
				 * Compress build file with YUICompressor
				 */
				if (tocompress)
				{
					this.compressJS(f);
				}
				else
				{
					this.setChildCount(-1);
				}
			}.bind(this,f)
		);
	};
	Fetcher.prototype.parseCSSFile = function(f)
	{
		var file = this.path+f;

		this.createDirs();
		
		fs.readFile(
			APP_PATH+file,
			function(file, err, data)
			{
				if (err)
				{
					sys.print(err);
					this.setChildCount(-1);
					return;
				}
				/**
				 * Copy original file into build dir
				 */
				fs.writeFile(
					APP_PATH+buildpath+this.path+file,
					data.toString(),
					function(f, err, data)
					{
						/**
						 * Compress build file with YUICompressor
						 */
						this.compressCSS(f);
					}.bind(this,file)
				);
			}.bind(this, f)
		);
	};
	Fetcher.prototype.parseLocaleFile = function(f)
	{
		var file = this.path+f,
			compiler = new L10nCompiler({
				file: file
			});
		
		this.createDirs();

		/**
		 * Copy original file into build dir
		 */
		fs.writeFile(
			APP_PATH+buildpath+file+'.js',
			compiler.parse(),
			function(f, err, data)
			{
				/**
				 * Compress build file with YUICompressor
				 */
				this.compressJS(f);
				this.setChildCount(-1);
			}.bind(this,f+'.js')
		);
	};

	/**
	 * Start reading app's folders
	 */
	tofetch.forEach(
		function(p)
		{
			var f = new Fetcher({
				basepath: APP_PATH,
				path: p
			})
			f._event.on(
				'end',
				function()
				{
					waiting--;
					if (waiting === 0)
					{
						/**
						 * Finalize build
						 */
						(function()
						{
							var content = fs.readFileSync(
									APP_PATH+'index.html'
								).toString()
									.replace(/\{\$basepath\}/gi, '/'+buildname),
								Maker = require('../make/make').Maker,
								make = new Maker({
									dirs: ['locales', 'plugins', 'views'],
									apppath: APP_PATH+buildpath,
									basepath: buildname+'/'
								});
							
							fs.writeFileSync(
								APP_PATH+'build/index.html',
								content
							);
						})();
					}
				}
			);
			f.fetch();
		}
	);
})();