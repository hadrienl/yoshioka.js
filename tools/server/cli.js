/**
 * @module tools/server/cli
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

rl = require('readline'),
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
		if (answer === 'h' ||
			answer === 'help')
		{
			this._showHelp();
		}
		else if (answer === 'install')
		{
			this._showInstall(answer);
		}
		else if (answer.match(/^set\s(.*?$)/))
		{
			this._showSet(answer);
		}
		else if (answer === 'b' ||
				answer === 'build')
		{
			this._showBuild();
		}
		else if ('q' === answer ||
				'exit' === answer ||
				'quit' === answer)
		{
			this._exitServer();
		}
		else if (answer === 'nyancat')
		{
			this._showNyanCat();
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
		var fs = require('fs');
		
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