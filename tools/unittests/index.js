var
APP_PATH = __dirname.replace(/yoshioka.js.*?$/, ''),
VIEWS_DIR = 'views/',
PLUGINS_DIR = 'plugins/',
TEST_DIR = 'tests/',

fs = require('fs'),

compiler = require('../compiler'),

UnitTests = function(config)
{
    this.init(config);
}
UnitTests.prototype = {
    
    _srcs: null,
    _modules: null,
    _auto: false,
    _framework: false,
    
    init: function(config)
    {
        var test = config.test || null;
        
        this._auto = false;
        this._framework = false;
        if (test === 'auto')
        {
            this._auto = true;
        }
        if (test === 'framework')
        {
            this._framework = true;
        }
        if (test === 'framework/auto')
        {
            this._auto = true;
            this._framework = true;
        }
        
        if (this._framework)
        {
            return this._prepareFrameworkTests();
        }
        else
        {
            return this._prepareAppTests();
        }
    },
    _prepareAppTests: function()
    {
        var viewpaths = [],
            pluginpaths = []
        
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
                            this._readTestFileDetails(
                                testpath,
                                f
                            );
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
        );
    },
    
    _prepareFrameworkTests: function()
    {
        var fwk_path = 'yoshioka.js/tests/';
        
        this._srcs = [];
        this._modules = [];
        
        tests = fs.readdirSync(
            APP_PATH+fwk_path
        );
        
        tests.forEach(
            function(p)
            {
                this._readTestFileDetails(
                    fwk_path,
                    p
                );
            }.bind(this)
        );
    },
    
    _readTestFileDetails: function(testpath, file)
    {
        var ctn = fs.readFileSync(
                APP_PATH+testpath+file
            ),
            module = (module = ctn.toString().match(
                /\@module ([a-zA-Z0-9\/\-\_]+)/
            )) && module[1];
        
        this._srcs.push(
            '<script src="/'+testpath+file+'"></script>'
        );
        this._modules.push(
            '"'+module+'"'
        );
    },
    
    getHTML: function(callback)
    {
        var c = new compiler.HTMLCompiler({
            file: 'yoshioka.js/tools/unittests/lib/index.html',
            type: 'tests'
        });
        c.parse(function(callback, content)
        {
            html = content
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
                )
                .replace(
                    /\{\$auto\}/,
                    this._auto ? true : false
                );
            
            callback(html);
        }.bind(this, callback));
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
