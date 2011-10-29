var
APP_PATH = __dirname.replace(/yoshioka.js.*?$/, ''),
VIEWS_DIR = 'views/',
TEST_DIR = 'tests/',

fs = require('fs'),

UnitTests = function(config)
{
	this.init();
}
UnitTests.prototype = {
	
	_srcs: null,
	_modules: null,
	
	init: function()
	{
		/**
		 * Look for each tests files in views folder
		 */
		try
		{
			var views = fs.readdirSync(
				APP_PATH+VIEWS_DIR
			);
		}
		catch (e)
		{
			/**
			 * No views folder : application has not been installed
			 */
			throw new Error("Folder views not found. Please reinstall your application.");
		}
		
		this._srcs = [];
		this._modules = [];
		
		views.forEach(
			function(v)
			{
				try
				{
					var testpath = VIEWS_DIR+v+'/'+TEST_DIR,
						testfolder = fs.readdirSync(
						APP_PATH+testpath
					);
					testfolder.forEach(
						function(f)
						{
							var ctn = fs.readFileSync(
									APP_PATH+testpath+f
								),
								module = (module = ctn.toString().match(
										/\@module ([a-zA-Z0-9\/\-\_]+)/
									)) && module[1];
							
							this._srcs[this._srcs.length] = '<script src="/'+testpath+f+'"></script>';
							this._modules[this._modules.length] = '"'+module+'"';
						}.bind(this)
					);
				}
				catch (e)
				{
					console.log(
						'No tests in '+testpath+' :('
					)
				}
			}.bind(this)
		)
	},
	
	getHTML: function()
	{
		var html = fs.readFileSync(__dirname+'/lib/index.html').toString();
		
		html = html
			.replace(
				/\{\$testssrc\}/,
				this._srcs.join('')
			)
			.replace(
				/\{\$testsmodules\}/,
				this._modules.join(',')
			);
		
		return html;
	}
};

exports.UnitTests = UnitTests;
