var APP_PATH = __dirname.replace('/yoshioka.js/tools/make', '')+'/',
	Maker = require('./make').Maker;


/**
 * Check path param
 */
process.argv.forEach(
	function(k, i)
	{
		if (k === '--path')
		{
			APP_PATH = APP_PATH+process.argv[i+1]+'/';
		}
	}
);

new Maker({
	dirs: ['locales', 'plugins', 'views'],
	apppath: APP_PATH,
	basepath: ''
});
