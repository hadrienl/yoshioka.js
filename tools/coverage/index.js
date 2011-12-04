(function(){

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

fs = require('fs'),
exec = require('child_process').exec,
rimraf = require('../../lib/rimraf'),

Builder = require('../build').Builder,
Compiler = require('../compiler'),

STATE_IN_PROGRESS = 'in progress',
STATE_FINISHED = 'finished',
STATE_ABORTED = 'aborted',

Coverage = function(config)
{
	this.init(config);
};

Coverage.prototype = {
	
	_req: null,
	_res: null,
	
	_processes: [],
	
	init: function(config)
	{
		config || (config =  {});
		
		this._req = config.req;
		this._res = config.res;
	},
	/**
	 * Start a process by reading the req.url
	 */
	process: function()
	{
		var guid;
		
		if (this._req.url === '/__coverage/')
		{
			return this._start();
		}
		else if (guid = this._req.url.match(/^\/__coverage\/check\/(.*?)$/))
		{
			return this._check(guid[1]);
		}
		else if (guid = this._req.url.match(/^\/__coverage\/report\/(.*?)$/))
		{
			return this._retreiveReportData(guid[1]);
		}
		else
		{
			console.log(this._req.url);
		}
	},
	
	_getProcess: function(guid)
	{
		var process = null;
		
		this._processes.forEach(
			function(p)
			{
				if (p.guid == guid)
				{
					process = p;
				}
			}
		);
		
		return process;
	},
	
	_check: function(guid)
	{
		var status,
			process = this._getProcess(guid);
		
		this._res.writeHead(200, {'Content-Type': 'text/json'});
		this._res.end(
			JSON.stringify({
				guid: guid,
				status: process ? process.status : STATE_ABORTED
			})
		);
	},
	
	_start: function()
	{
		var guid = parseInt((new Date()).getTime()),
			compiler = new Compiler.HTMLCompiler({
				file: 'yoshioka.js/tools/coverage/lib/index.html'
			});
		
		this._processes.push({
			guid: guid,
			status: STATE_IN_PROGRESS
		});
		
		compiler.parse(function(guid, content)
		{
			this._res.writeHead(200, {'Content-Type': 'text/html'});
			this._res.end(
				content
					.replace(/\{\$guid\}/g, guid)
			);
			this._build(guid);
		}.bind(this, guid));
		
		return;
	},
	
	_build: function(guid)
	{
		var builder = new Builder({
			buildpath: '/coverage/tmp/'+guid+'/',
			buildname: guid
		});
		
		/**
		 * Build app in tmp folder
		 */
		try
		{
			fs.mkdirSync(APP_PATH+'/coverage', 0777);
		}
		catch (e){}
		try
		{
			fs.mkdirSync(APP_PATH+'/coverage/tmp', 0777);
		}
		catch (e){}
		try
		{
			fs.mkdirSync(APP_PATH+'/coverage/'+guid, 0777);
			fs.mkdirSync(APP_PATH+'/coverage/tmp/'+guid, 0777);
		}
		catch (e){}
		
		builder.on(
			'parseEnd',
			function(guid)
			{
				this._processYuitestCoverage(guid);
			}.bind(this, guid) 
		);
		builder.build();
	},
	
	_processYuitestCoverage: function(guid)
	{
		var cmd = exec(
			'java -jar '+__dirname+
			'/lib/yuitest-coverage.jar -d -o '+
				APP_PATH+'coverage/'+guid+' '+
				APP_PATH+'coverage/tmp/'+guid,
			function(i, err, stdout, stderr)
			{
				if (stderr)
				{
					console.log(
						"yuitest-coverage detects errors :\n"
					);
					console.log('std',stderr);
				}
				return this._processTests(guid);
			}.bind(this)
		);
	},
	
	_processTests: function(guid)
	{
		// Alter config file to change base path
		var configpath = APP_PATH+'coverage/'+guid+'/config/config.js',
			process = this._getProcess(guid),
			readDir;
		
		fs.writeFileSync(
			configpath,
			fs.readFileSync(configpath).toString()
				.replace(
					new RegExp('\\"/'+guid+'/\\"', 'g'),
					'\"/coverage/'+guid+'/\"'
				)
		);
		
		// mkdir tests
		fs.mkdirSync(APP_PATH+'coverage/'+guid+'/tests');
		
		// cp all tests files in this folder
		this._readDir(guid, APP_PATH+'views');
		this._readDir(guid, APP_PATH+'plugins');
		
		// Return the tests.html file to browser
		return this._makeTestsFile(guid);
	},
	_readDir: function(guid, path)
	{
		fs.readdirSync(path).forEach(
			function(f)
			{
				var s = fs.statSync(
						path+'/'+f
					),
					fpath,
					content;

				if (s.isDirectory())
				{
					this._readDir(guid, path+'/'+f);
				}
				else
				{
					if (f.match(/test\.js$/))
					{
						this._writeJSFile(guid, path, f);
					}
				}
			}.bind(this)
		);
	},
	_writeJSFile: function(guid, path, f)
	{
		var compiler = new Compiler.ModuleCompiler({
				file: path.replace(APP_PATH, '')+'/'+f
			}),
			fpath = '/coverage/'+guid+'/tests/'+
				(path+f).replace(APP_PATH, '').replace(/\//g, '-'),
			content = compiler.parseSync(),
			process = this._getProcess(guid);
			
		process.tests || (process.tests = []);
		
		process.tests.push({
			path: fpath,
			module: content.match(
				/@module\s([a-zA-Z0-9\-\.–_\/]+)/
			)[1]
		});

		fs.writeFileSync(
			APP_PATH+fpath,
			content
		);
	},
	_makeTestsFile: function(guid)
	{
		var process = this._getProcess(guid),
			compiler = new Compiler.HTMLCompiler({
				file: 'yoshioka.js/tools/coverage/lib/tests.html'
			}),
			testssrc = '',
			testsmodules = '';
			
		process.tests.forEach(
			function(t)
			{
				testssrc += '<script src="'+t.path+'" type="text/javascript"></script>';
				testsmodules += ', "'+t.module+'"';
			}
		);
		
		compiler.parse(function(guid, content)
		{
			/*
				TODO add all tests sources
			*/
			fs.writeFileSync(
				APP_PATH+'coverage/'+guid+'/tests.html',
				content
					.replace(/\{\$guid\}/g, guid)
					.replace(/\{\$testssrc\}/g, testssrc)
					.replace(/\{\$testsmodules\}/g, testsmodules)
			);
			
			// Compilation finished !
			process.status = STATE_FINISHED;
		}.bind(this, guid));
	},
	
	_retreiveReportData: function(guid)
	{
		var postData = '';
		// Get post data
		this._req.on(
			'data',
			function (data)
			{
				postData += data;
			}.bind(this)
		);
		this._req.on(
			'end',
			function()
			{
				return this._reportData(guid, postData);
			}.bind(this)
		);
	},
	_reportData: function(guid, data)
	{
		// Clean all the coverage folder
		rimraf(
			APP_PATH+'coverage/'+guid+'/',
			null,
			function(guid, data)
			{
				// Clean tmp files too
				rimraf(
					APP_PATH+'coverage/tmp/'+guid+'/',
					null,
					function(guid, data)
					{
						var cmd;
						
						// Write coverage file
						try
						{
							fs.mkdirSync(APP_PATH+'coverage/'+guid+'/');
						}catch(e){}
						
						fs.writeFileSync(
							APP_PATH+'coverage/'+guid+'/coverage.json',
							data
						);
						
						// Build report !
						cmd = exec(
							'java -jar '+__dirname+
							'/lib/yuitest-coverage-report.jar -o '+
							APP_PATH+'coverage/'+guid+' '+
							APP_PATH+'coverage/'+guid+'/coverage.json',
							function(i, err, stdout, stderr)
							{
								if (stderr)
								{
									console.log(
										"yuitest-coverage-report detects errors :\n"
									);
									console.log('std',stderr);
								}
								
								this._res.writeHead(
									200, {'Content-Type': 'text/json'}
								);
								this._res.end(
									JSON.stringify({
										report: 'ok',
										url: '/coverage/'+guid+'/index.html'
									})
								);
								
							}.bind(this)
						);
						
					}.bind(this, guid, data)
				);
				
			}.bind(this, guid, data)
		);
	}
}

exports.Coverage = Coverage;

})();