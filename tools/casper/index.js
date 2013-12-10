var
/**
 * Instanciate Casper with logging
 */
casper = require('casper').create({
	verbose: true,
	logLevel: 'warning'
}),
/**
 * Retrieve options from CLI
 */
/**
 * Option to set the log level
 */
option_logLevel = casper.cli.options.logLevel || 'all',
/**
 * Option to launch a single test by its module pathname
 */
option_only = casper.cli.options.only || false,

success = 0,
failed = 0;

/**
 * Host option is mandatory
 */
if (!casper.cli.options.host)
{
	casper.die('Please set a host with --host option');
}

/**
 * Intercept each console message from client and write them in CLI
 */
casper.on('remote.message', function(message) {

	if (option_logLevel === 'error')
	{
		if (message.match(/TestRunner: \w+: failed./))
		{
			console.error(message);
		}
	}
	var res = message.match(/Passed:([0-9]+) Failed:([0-9]+) Total:([0-9]+) \(([0-9]+) ignored\)/);
	if (res)
	{
		if (option_logLevel !== 'none')
		{
			console.log(message);
		}
		if (res[1])
		{
			success += +res[1];
		}
		if (res[2])
		{
			failed += +res[2];
		}
	}
	else
	if (option_logLevel === 'debug')
	{
	    console.log(message);
	}
});

/**
 * If option_only is set, launch a single test
 */
if (option_only)
{
	var id = option_only.replace(/\//g, '-');

	/**
	 * Go to unit tests page
	 */
	casper.start(casper.cli.options.host+'/__unittests/', function()
	{
		/**
		 * Then try to find the run test button and click it
		 */
		var button = this.evaluate(function launch(id) {
			var button = document.querySelector(
				'#'+id+' button');

			button.click();

			return button;
		}, id);

		/**
		 * If no button found, exit with an error message
		 */
		if (!button)
		{
			this.echo('This test does not exist');
			this.exit(0);
		}
	});

	/**
	 * Test is running, just wait for test element to get a classname
	 * which could be `success`, `failed`, or `ignored`
	 */
	casper.waitFor(function check() {

	    return this.evaluate(function(id) {
	    	var done = true,
	    		test = document.querySelector('#'+id);

	    	if (!test.className)
    		{
    			done = false;
    		}

	        return done;
	    }, id);

	}, function then() {    // step to execute when check() is ok
		this.echo("End of tests : "+success+" success, "+failed+" failed.")
			.exit(failed) // Will return 0 if no failed tests occured
	}, function timeout() { // step to execute if check has failed
	    this.echo("Timeout").exit();
	}, 10*60*1000);
}
else
{
	/**
	 * All the tests run
	 */
	casper.start(casper.cli.options.host+'/__unittests/auto');

	/**
	 * Just wait for every tests to have a classname
	 */
	casper.waitFor(function check() {

	    return this.evaluate(function() {
	    	var done = true,
	    		tests = document.querySelectorAll('.test');

	    	success = true;

	    	Array.prototype.forEach.call(tests, function(t)
	    	{
	    		if (!t.parentNode.className)
	    		{
	    			done = false;
	    		}
	    		if (t.parentNode.className.indexOf('success') === -1)
	    		{
	    			success = false;
	    		}
	    	});

	        return done;
	    });
	}, function then() {    // step to execute when check() is ok
		this.echo("End of tests : "+success+" success, "+failed+" failed.")
			.exit(failed)
	}, function timeout() { // step to execute if check has failed
	    this.echo("Timeout").exit();
	}, 10*60*1000);
}

casper.run();