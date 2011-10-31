/**
 * @module tools/server/cli
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

rl = require('readline'),
fs = require('fs'),
getconfig = require('../make/getconfig'),
Cli = function(config)
{
	this.init(config);
};

/**
 * Command Line Interface to communicate with the server
 * @class Cli
 */
Cli.prototype = {
	
	/**
	 * Port on which HTTP server listen to
	 * @attribute _port
	 * @private
	 */
	_port: null,
	/**
	 * Fixtures setting
	 * @attribute _fixtures
	 * @private
	 */
	_fixtures: true,
	
	/**
	 * Init CLI with tools/make/getconfig config
	 * @method init
	 * @private
	 */
	init: function(config)
	{
		config || (config = {});
		
		this._appconfig = getconfig.getConfig({
			dev: config.dev
		});
		
		this._port = config.port || 80;
		
		this._fixtures = true;
		
		this.cli = rl.createInterface(
			process.stdin, process.stdout, null);
		
		/**
		 * Write MOTD
		 */
		this.cli.write(
		"\n------------------------------------------\n"+
		"Yoshioka.js development server is running on port "+this._port+".\n"+
		"NEVER run this server on production !\n\n"+
		"Type `help` or `h` to know the availables commands :\n"+
		"------------------------------------------\n\n"
		);
		
		/**
		 * Start a new prompt
		 */
		this.initPrompt();
	},
	/**
	 * Display a prompt and wait for a command
	 * @method initPrompt
	 * @private
	 */
	initPrompt: function()
	{
		this.cli.question(
			'> ',
			this.answerInitPrompt.bind(this)
		);
	},
	/**
	 * Process the user's given command
	 * @method answerInitPrompt
	 * @private
	 */
	answerInitPrompt: function(answer)
	{
		if ('h' === answer ||
			'help' === answer)
		{
			this._showHelp();
		}
		else if ('install' === answer)
		{
			this._showInstall(answer);
		}
		else if ('b' === answer ||
				'build' === answer)
		{
			this._showBuild();
		}
		else if ('q' === answer ||
				'exit' === answer ||
				'quit' === answer)
		{
			this._exitServer();
		}
		else if ('nyancat' === answer)
		{
			this._showNyanCat();
		}
		else if (answer.match(/^set\s(.*?$)/))
		{
			this._showSet(answer);
		}
		else if (answer.match(/^create\s(.*?$)/))
		{
			this._showCreate(answer);
		}
		else
		{
			this.initPrompt();
		}
	},
	/**
	 * Display all the available commands
	 * @method _showHelp
	 * @private
	 */
	_showHelp: function()
	{
		this.cli.write(
"Available commands are :\n"+
" - help (h) : display this help\n"+
" - install : install a new Application\n"+
" - build (b) : build your project\n"+
" - set [OPTION] [PARAM]: Set a configuration :\n"+
"    - fixtures (on|off) : Tell API to use fixtures files or real API proxyfied\n"+
" - exit (q|quit) : exit the server\n"
		);
		this.initPrompt();
	},
	/**
	 * Display install process
	 * @method _showInstall
	 * @private
	 */
	_showInstall: function(answer)
	{
		/**
		 * Check if install has not already be done
		 */
		try
		{
			fs.statSync(
				APP_PATH+'index.html'
			);
			/**
			 * Index.html file already exists, installation has been done
			 */
			this.cli.write("Your application has already been installed.\n");
			this.initPrompt();
		}
		catch(e)
		{
			this._install = {};
			
			this.cli.question(
				"Choose an application namespace (choose a short name, it will be the namespace of all your classes) : ",
				this._installStep2.bind(this)
			);
		}
	},
	/**
	 * Install process step 2
	 * @method _installStep2
	 * @private
	 */
	_installStep2: function(answer)
	{
		var Installer = require('./installer').Installer, i;
		
		if (!answer.match(/^[a-zA-Z0-9]+$/))
		{
			this.cli.write("This namespace is invalid. Only use alphanumerics characters.\n");
			return this._showInstall();
		}
		
		this.cli.write("Installing application\n");
		i = new Installer({
			namespace: answer
		});
		i.on(
			'success',
			function()
			{
				this.cli.write("Installation complete !\nYou can start your browser to http://yourserver:"+this._port+" !\n");
				this.initPrompt();
			}.bind(this)
		);
		i.on(
			'failure',
			function(e)
			{
				this.cli.write(e.message+"\n");
				this.initPrompt();
			}.bind(this)
		)
		i.run();
	},
	/**
	 * Display the different available config set
	 * @method _showSet
	 * @private
	 */
	_showSet: function(answer)
	{
		var args = answer.replace(/^set\s/i, '').split(' ');
		
		/**
		 * Fixtures config :
		 * - on : activate fixtures
		 * - off : deactivate fixtures and set a proxy to the real API
		 */
		if (args[0] === 'fixtures')
		{
			this.useFixtures((args[1] === 'on'));
		}
		
		this.initPrompt();
	},
	/**
	 * Create some kind of files
	 * @method _showCreate
	 * @private
	 */
	_showCreate: function(answer)
	{
		var args = (args = answer.match(/^create\s(.*?$)/))
			&& args[1].split(/\s/),
			path = APP_PATH;
		
		if (!args[1])
		{
			this.cli.write("Third argument is missing\n");
			return this.initPrompt();
		}
		
		if ('view' === args[0])
		{
			/**
			 * Check view name validity
			 */
			if (!args[1].match(/^[a-zA-Z0-9]+$/))
			{
				this.cli.write("View "+args[1]+" is invalid. Must contains only alphanuleric characters.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check if view does not already exists
			 */
			try
			{
				fs.statSync(APP_PATH+'views/' + args[1].toLowerCase());
				this.cli.write("View "+args[1]+" already exists.\n");
				return this.initPrompt();
			}
			catch (e){}
			
			/**
			 * Create folders
			 */
			path+='views/'+args[1].toLowerCase()+'/';
			fs.mkdirSync(path, 0755);
			fs.mkdirSync(path+'assets', 0755);
			fs.mkdirSync(path+'models', 0755);
			fs.mkdirSync(path+'templates', 0755);
			fs.mkdirSync(path+'tests', 0755);
			fs.mkdirSync(path+'subviews', 0755);
			/**
			 * Write view class file
			 */
			fs.writeFileSync(
				path+args[1]+'.view.js',
				this._createViewFile(args[1])
			);
			/**
			 * Write view unit test file
			 */
			fs.writeFileSync(
				path+'/tests/'+args[1]+'.view.test.js',
				this._createViewUTFile(args[1])
			);
			/**
			 * Write view template
			 */
			fs.writeFileSync(
				path+'/templates/'+args[1]+'.tpl.html',
				this._createViewTemplateFile(args[1])
			);
			this.cli.write("View "+args[1]+" created !\n");
			return this.initPrompt();
		}
		else if ('subview' === args[0])
		{
			if ('for' !== args[2])
			{
				this.cli.write("Correct syntax is `create subview subviewname for viewname`.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check view name validity
			 */
			if (args[1].toLowerCase() === args[3].toLowerCase() ||
				!args[1].match(/^[a-zA-Z0-9]+$/))
			{
				this.cli.write("View "+args[1]+" is invalid. Must contains only alphanuleric characters and must be different than view.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check if view already exists
			 */
			try
			{
				fs.statSync(APP_PATH+'views/' + args[3].toLowerCase());
			}
			catch (e){
				this.cli.write("View "+args[3]+" does not exists.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check if subview already exists
			 */
			try
			{
				fs.statSync(
					APP_PATH+'views/' + args[3].toLowerCase()+'/subviews/'+
					args[1].toLowerCase()+'.subview.js'
				);
				this.cli.write("Subview "+args[3]+" already exists.\n");
				return this.initPrompt();
			}
			catch (e){}
			
			/**
			 * Create subview dir if needed
			 */
			try
			{
				fs.mkdirSync(
					APP_PATH+'views/' + args[3].toLowerCase() + '/subviews/',
					0755
				);
			}
			catch (e){}
			
			path+='views/'+args[3].toLowerCase()+'/';
			
			/**
			 * Write view unit test file
			 */
			fs.writeFileSync(
				path+'/subviews/'+args[1].toLowerCase()+'.subview.js',
				this._createSubviewFile(
					args[3].toLowerCase(),
					args[1].toLowerCase()
				)
			);
			fs.writeFileSync(
				path+'/tests/'+args[1].toLowerCase()+'.subview.test.js',
				this._createSubviewUTFile(
					args[3].toLowerCase(),
					args[1].toLowerCase()
				)
			);
			fs.writeFileSync(
				path+'/templates/'+args[1].toLowerCase()+'.tpl.html',
				this._createViewTemplateFile(
					args[1].toLowerCase()
				)
			);
			this.cli.write("Subiew "+args[1]+" created in view "+args[3]+" !\n");
			return this.initPrompt();
		}
		else if ('model' === args[0])
		{
			if ('for' !== args[2])
			{
				this.cli.write("Correct syntax is `create model modelname for viewname`.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check view name validity
			 */
			if (!args[1].match(/^[a-zA-Z0-9]+$/))
			{
				this.cli.write("View "+args[1]+" is invalid. Must contains only alphanuleric characters.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check if view already exists
			 */
			try
			{
				fs.statSync(APP_PATH+'views/' + args[3].toLowerCase());
			}
			catch (e){
				this.cli.write("View "+args[3]+" does not exists.\n");
				return this.initPrompt();
			}
			
			/**
			 * Check if model already exists
			 */
			try
			{
				fs.statSync(
					APP_PATH+'views/' + args[3].toLowerCase()+'/models/'+
					args[1].toLowerCase()+'.model.js'
				);
				this.cli.write("Model "+args[3]+" already exists.\n");
				return this.initPrompt();
			}
			catch (e){}
			
			/**
			 * Create subview dir if needed
			 */
			try
			{
				fs.mkdirSync(
					APP_PATH+'views/' + args[3].toLowerCase() + '/models/'
				);
			}
			catch (e){}
			
			path+='views/'+args[3].toLowerCase()+'/';
			
			/**
			 * Write view unit test file
			 */
			fs.writeFileSync(
				path+'/models/'+args[1].toLowerCase()+'.model.js',
				this._createModelFile(
					args[3].toLowerCase(),
					args[1].toLowerCase()
				)
			);
			fs.writeFileSync(
				path+'/tests/'+args[1].toLowerCase()+'.model.test.js',
				this._createModelUTFile(
					args[3].toLowerCase(),
					args[1].toLowerCase()
				)
			);
			this.cli.write("Model "+args[1]+" created in view "+args[3]+" !\n");
			return this.initPrompt();
		}
		this.initPrompt();
	},
	_createViewFile: function(view)
	{
		var viewclass = view.substring(0,1).toUpperCase()+
				view.substring(1).toLowerCase() + 'View',
			appname = this._appconfig.app,
			module = appname+'/views/'+view.toLowerCase();
		
		return fs.readFileSync(__dirname+'/templates/view.tpl.js').toString()
			.replace(/\{viewclass\}/g, viewclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname)
			.replace(/\{view\}/g, view.toLowerCase());
	},
	_createViewUTFile: function(view)
	{
		var viewclass = view.substring(0,1).toUpperCase()+
				view.substring(1).toLowerCase() + 'View',
			appname = this._appconfig.app,
			requires = appname+'/views/'+view.toLowerCase();
			module = appname+'/views/'+view.toLowerCase()+
				'/tests/'+view.toLowerCase();
		
		return fs.readFileSync(
				__dirname+'/templates/view.test.tpl.js'
			).toString()
			.replace(/\{viewclass\}/g, viewclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname)
			.replace(/\{requires\}/g, requires);
	},
	_createViewTemplateFile: function(view)
	{
		return fs.readFileSync(
				__dirname+'/templates/view.tpl.html'
			).toString()
	},
	_createSubviewFile: function(view, subview)
	{
		var viewclass = subview.substring(0,1).toUpperCase()+
				subview.substring(1).toLowerCase() + 'Subview',
			appname = this._appconfig.app,
			module = appname+'/views/'+view.toLowerCase()+'/subviews/'+subview.toLowerCase();
		
		return fs.readFileSync(__dirname+'/templates/view.tpl.js').toString()
			.replace(/\{viewclass\}/g, viewclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname)
			.replace(/\{view\}/g, subview.toLowerCase());
	},
	_createSubviewUTFile: function(view, subview)
	{
		var viewclass = subview.substring(0,1).toUpperCase()+
				subview.substring(1).toLowerCase() + 'Subview',
			appname = this._appconfig.app,
			requires = appname+'/views/'+view.toLowerCase()+'/subviews/'+subview.toLowerCase(),
			module = appname+'/views/'+view.toLowerCase()+
				'/tests/subviews/'+subview.toLowerCase();
		
		return fs.readFileSync(
				__dirname+'/templates/view.test.tpl.js'
			).toString()
			.replace(/\{viewclass\}/g, viewclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname)
			.replace(/\{requires\}/g, requires);
	},
	_createModelFile: function(view, model)
	{
		var modelclass = model.substring(0,1).toUpperCase()+
				model.substring(1).toLowerCase() + 'Model',
			appname = this._appconfig.app,
			module = appname+'/views/'+view.toLowerCase()+'/models/'+model.toLowerCase();
		
		return fs.readFileSync(__dirname+'/templates/view.model.tpl.js').toString()
			.replace(/\{modelclass\}/g, modelclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname);
	},
	_createModelUTFile: function(view, model)
	{
		var viewclass = model.substring(0,1).toUpperCase()+
				model.substring(1).toLowerCase() + 'Model',
			appname = this._appconfig.app,
			requires = appname+'/views/'+view.toLowerCase()+'/models/'+model.toLowerCase(),
			module = appname+'/views/'+view.toLowerCase()+
				'/tests/models/'+model.toLowerCase();
		
		return fs.readFileSync(
				__dirname+'/templates/view.test.tpl.js'
			).toString()
			.replace(/\{viewclass\}/g, viewclass)
			.replace(/\{module\}/g, module)
			.replace(/\{appname\}/g, appname)
			.replace(/\{requires\}/g, requires)
			.replace(/\{view\}/g, view.toLowerCase());
	},
	/**
	 * Display and launch the build process
	 * @method _showBuild
	 * @private
	 */
	_showBuild: function()
	{
		this.cli.question(
			"Have you run the unit tests before ? (YES or no) ",
			function(answer)
			{
				if (answer.toLowerCase() === 'yes')
				{
					return this.build();
				}
				
				this.initPrompt();
			}.bind(this)
		);
	},
	/**
	 * Display a cat
	 * @method _showNyanCat
	 * @private
	 */
	_showNyanCat: function()
	{
		this.cli.write(
"\n+      o     +              o   \n    +             o     +       +\no          +\n    o  +           +        +\n+        o     o       +        o\n-_-_-_-_-_-_-_,------,      o \n_-_-_-_-_-_-_-|   /\\_/\\  \n-_-_-_-_-_-_-~|__( ^ .^)  +     +  \n_-_-_-_-_-_-_-\"\"  \"\"      \n+      o         o   +       o\n    +         +\no        o         o      o     +\n    o           +\n+      +     o        o      +\n\n"
		);
	},
	
	
	/**
	 * Run the build script
	 * @method build
	 * @private
	 */
	build: function()
	{
		var Builder = require('../build').Builder,
			builder = new Builder();
		
		this.cli.write("Building…\n");
		builder.on(
			'parseEnd',
			function()
			{
				this.cli.write("\nDone !\n");
				this.initPrompt();
			}.bind(this)
		);
		builder.build();
	},
	/**
	 * Set fixtures param
	 * @method useFixtures
	 * @param {boolean} set True to use files fixtures, false to use the real
	 * API accross a proxy
	 * @private
	 */
	useFixtures: function(set)
	{
		if (set === true ||
			set === false)
		{
			this._fixtures = set;
		}
		return this._fixtures;
	},
	/**
	 * Exit server
	 * @method _exitServer
	 * @private
	 */
	_exitServer: function()
	{
		process.exit(0);
	}
};

exports.Cli = Cli;

})();