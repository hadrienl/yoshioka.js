var
APP_PATH = __dirname.replace(/yoshioka.js.*?$/, ''),
VIEWS_DIR = 'views/',
PLUGINS_DIR = 'plugins/',
TEST_DIR = 'tests/',

fs = require('fs'),

UnitTests = function(config)
{
	this.init(config);
}
UnitTests.prototype = {
	
	_srcs: null,
	_modules: null,
	
	init: function(config)
	{
		var test = config.test || null,
			viewpaths = [], pluginpaths = [];
		
		if (test)
		{
			test = test.match(/^(.*?)\/(.*?)$/);
		}
		console.log(test)
		/**
		 * Look for each tests files in views folder
		 */
		try
		{
			viewpaths = fs.readdirSync(
				APP_PATH+VIEWS_DIR
			);
			
			viewpaths.forEach(
				function(p, k)
				{
					viewpaths[k] = VIEWS_DIR+p;
				}
			);
		}
		catch (e)
		{
			/**
			 * No views folder : application has not been installed
			 */
			throw new Error(
				"Folder views not found. Please reinstall your application."
			);
		}
		
		try
		{
			pluginpaths = fs.readdirSync(
				APP_PATH+PLUGINS_DIR
			);
			
			pluginpaths.forEach(
				function(p, k)
				{
					pluginpaths[k] = PLUGINS_DIR+p;
				}
			);
		}
		catch (e)
		{
			
		}
		
		this._srcs = [];
		this._modules = [];
		
		viewpaths.concat(pluginpaths).forEach(
			function(v)
			{
				if (test && v !== VIEWS_DIR+test[1] && v !== PLUGINS_DIR+test[1])
				{
					return;
				}
				try
				{
					var testpath = v+'/'+TEST_DIR,
						testfolder = fs.readdirSync(
						APP_PATH+testpath
					);
					
					testfolder.forEach(
						function(f)
						{
							if (test && f !== test[2]+'.test.js')
							{
								return;
							}
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
