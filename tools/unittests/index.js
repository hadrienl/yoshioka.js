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
				try
				{
					var testpath = v+'/'+TEST_DIR,
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
							if (test && module !== test)
							{
								return;
							}
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
			)
			.replace(
				/\{\$testslinks\}/,
				this._createTestsLinks()
			);
		
		return html;
	},
	
	_createTestsLinks: function()
	{
		var list = '';
		
		this._modules.forEach(
			function(m)
			{
				list += '<li><a href="/__unittests/'+m.replace(/"/g, '')+'">'+m.replace(/"/g, '')+'</a></li>';
			}
		);
		
		return list;
	}
};

exports.UnitTests = UnitTests;
