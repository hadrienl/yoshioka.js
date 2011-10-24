(function() {

var

rl = require('readline'),
Cli = function(config)
{
	this.init(config);
};

/**
 * Command Line Interface
 */
Cli.prototype = {
	
	_port: null,
	_fixtures: true,
	
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
	 */
	answerInitPrompt: function(answer)
	{
		if (answer === 'h' ||
			answer === 'help')
		{
			this._showHelp();
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
	 */
	_showHelp: function()
	{
		this.cli.write(
"Available commands are :\n"+
" - help (h) : display this help\n"+
" - build (b) : build your project\n"
		);
		this.initPrompt();
	},
	/**
	 * Display the different available config set
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
	 */
	_showNyanCat: function()
	{
		this.cli.write(
"\n+      o     +              o   \n    +             o     +       +\no          +\n    o  +           +        +\n+        o     o       +        o\n-_-_-_-_-_-_-_,------,      o \n_-_-_-_-_-_-_-|   /\\_/\\  \n-_-_-_-_-_-_-~|__( ^ .^)  +     +  \n_-_-_-_-_-_-_-\"\"  \"\"      \n+      o         o   +       o\n    +         +\no        o         o      o     +\n    o           +\n+      +     o        o      +\n\n"
		);
	},
	
	
	/**
	 * Run the build script
	 */
	build: function()
	{
		var Builder = require('../build').Builder,
			builder = new Builder();
		
		this.cli.write("Building…");
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
	useFixtures: function(set)
	{
		if (set === true ||
			set === false)
		{
			this._fixtures = set;
		}
		return this._fixtures;
	}
};

exports.Cli = Cli;

})();