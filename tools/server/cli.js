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
	app_config: null,
	init: function(config)
	{
		this.app_config = config.app_config
		this.cli = rl.createInterface(
			process.stdin, process.stdout, null);
		
		/**
		 * Write MOTD
		 */
		this.cli.write(
		"\n------------------------------------------\n"+
		"Yoshioka.js development server is running on port "+this.app_config.dev.port+".\n"+
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
		switch (answer)
		{
			/**
			 * Display help
			 */
			case 'help':
			case 'h':
				this.cli.write(
"Available commands are :\n"+
" - help (h) : display this help\n"+
" - build (b) : build your project\n"
				);
				this.initPrompt();
				break;
			/**
			 * Start a new build
			 */
			case 'build':
			case 'b':
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
				)
				break;
			/**
			 * nyan nyan nyan nyan nyan nyan nyan nyan nyan nyan nyan nyan nyan 
			 */
			case 'nyancat':
				this.cli.write(
"\n+      o     +              o   \n    +             o     +       +\no          +\n    o  +           +        +\n+        o     o       +        o\n-_-_-_-_-_-_-_,------,      o \n_-_-_-_-_-_-_-|   /\\_/\\  \n-_-_-_-_-_-_-~|__( ^ .^)  +     +  \n_-_-_-_-_-_-_-\"\"  \"\"      \n+      o         o   +       o\n    +         +\no        o         o      o     +\n    o           +\n+      +     o        o      +\n\n"
				);
			/**
			 * Display a new prompt
			 */
			default:
				this.initPrompt();
		}
	},
	/**
	 * Run the build script
	 */
	build: function()
	{
		this.cli.write("Building…");
	}
};

exports.Cli = Cli;

})();