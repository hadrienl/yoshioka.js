(function() {
	var APP_PATH = __dirname.replace('yoshioka.js/tools/build', ''),

		fs = require('fs'),
		sys = require('sys'),
		spawn = require('child_process').spawn,
		fetcher = require('../make/fetcher/fetcher'),

		t_compiler = require('../compiler/templates/compiler'),
		l_compiler = require('../compiler/l10n/compiler'),
		buildname = new Date().getTime(),
		buildpath = APP_PATH+'build/'+buildname+'/',
		Fetcher = fetcher.Fetcher;

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
			fullpath = buildpath;

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
		var file = buildpath+this.path+filename,
			cmd = spawn(
				'java',
				['-jar '+__dirname+'/yuicompressor-2.4.6.jar --type js --charset utf8 '+file+' -o '+file]
			);

		/**
		 * If ok, call callback method
		 */
		cmd.stdout.on('data', function (callback, filename, data) {
			//callback(filename, data);
			console.log('ok '+filename)
		}.bind(this, callback, this.file));

		/**
		 * Error, log it, then do nothing
		 */
		cmd.stderr.on('data', function (file, data) {
			//sys.print("\n\n"+'stderr: '+file+"\n"+data+"\n");
		}.bind(this, file));
	};
	/**
	 * Parse every files
	 */
	Fetcher.prototype.parseJSFile = function()
	{
		var file = this.path+this.file,
			compiler = new t_compiler.TemplateCompiler({
				file: file
			});

		this.createDirs();

		/**
		 * Copy original file into build dir
		 */
		fs.writeFile(
			buildpath+file,
			compiler.parse(),
			function(f, err, data)
			{
				/**
				 * Compress build file with YUICompressor
				 */
				this.compressJS(f, function(filename, content)
				{
					/**
					 * Write compressed file in build dir
					 */
					fs.writeFile(
						buildpath+this.path+f,
						content,
						'bla'
					);
				}.bind(this));
			}.bind(this,this.file)
		);
	};
	Fetcher.prototype.parseCSSFile = function()
	{
		var file = APP_PATH+this.path+this.file;

		this.createDirs();
	};
	Fetcher.prototype.parseLocaleFile = function()
	{
		var file = APP_PATH+this.path+this.file,
			content;

		this.createDirs();
	};

	/**
	 * Finalize build
	 */
	process.on(
		'exit',
		function()
		{
			console.log('presque fini');
		}
	);

	/**
	 * Start reading app's folders
	 */
	['lib', 'locales', 'plugins', 'views'].forEach(
		function(p)
		{
			(new Fetcher(p)).fetch();
		}
	);
})();