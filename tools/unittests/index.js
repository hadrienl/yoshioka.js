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
    
    _seed: false,
    _modules: null,
    
    _srcs: null,
    _auto: false,
    _framework: false,
    
    init: function(config)
    {
        var test = config.test || null;
        
        if (test === 'auto')
        {
            test = null;
            this._auto = true;
        }
        
        if (test && test.match(/^framework|ys\//))
        {
            this._framework = true;
            
            if (test.match(/^framework/))
            {
                if (test === 'framework/auto')
                {
                    this._auto = true;
                }
                
                test = null;
            }
        }
        
        if (!test)
        {
            // Load the init page
            this._seed = true;
            return this._framework ?
                this._getFrameworkModules() : this._getModules();
        }
        else
        {
            // Load a unit test page
            return this._getModule(test);
        }
    },
    _getModules: function(config)
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
            if (config.plugins &&
                config.plugins+'/' !== PLUGINS_DIR)
            {
                pluginpaths = config.plugins;
            }
            else
            {
                pluginpaths = fs.readdirSync(
                    APP_PATH+PLUGINS_DIR
                );
            }
            
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
                catch (e){}
            }.bind(this)
        );
    },
    
    _getFrameworkModules: function()
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
    
    _getModule: function(module)
    {
        var found = false;
        
        if (this._framework)
        {
            this._getFrameworkModules();
        }
        else
        {
            this._getModules();
        }
        
        this._modules.forEach(
            function(m)
            {
                if (m.module === module)
                {
                    this._modules = [m];
                    found = true;
                    return;
                }
            }.bind(this)
        );
        
        if (!found)
        {
            throw new Error(module+' not found');
        }
    },
    
    _readTestFileDetails: function(testpath, file)
    {
        var ctn = fs.readFileSync(
                APP_PATH+testpath+file
            ),
            module = (module = ctn.toString().match(
                /\@module ([a-zA-Z0-9\/\-\_]+)/
            )) && module[1];
        
        this._modules.push({
            module: module,
            src: testpath+file
        });
    },
    
    getHTML: function(callback)
    {
        var file = 'index.html',
            c, modules = [], scripts = '';
        
        if (!this._seed)
        {
            file = 'test.html';
        }
        
        c = new compiler.HTMLCompiler({
            file: 'yoshioka.js/tools/unittests/lib/'+file,
            type: 'tests'
        });
        
        this._modules.forEach(
            function(m)
            {
                modules.push(m.module);
                
                if (!this._seed)
                {
                    scripts += '<script src="/'+m.src+'"></script>';
                }
            }
        );
        
        c.parse(function(callback, content)
        {
            html = content
                .replace(
                    /\{\$modules\}/,
                    '"'+modules.join('","')+'"'
                )
                .replace(
                    /\{\$auto\}/,
                    this._auto ? true : false
                )
                .replace(
                    /\{\$scripts\}/,
                    scripts
                );
            
            callback(html);
        }.bind(this, callback));
    }
};

exports.UnitTests = UnitTests;
