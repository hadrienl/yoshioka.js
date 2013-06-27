/**
 * Build engine
 * @module tools/build
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),
BUILD_DIR = 'build/',

fs = require('fs'),
events = require('events'),
exec = require('child_process').exec,
util = require('util'),
rimraf = require('../../lib/rimraf'),

compiler = require('../compiler'),
Maker = require('../make').Maker,
getconfig = require('../make/getconfig'),

Builder = function(config)
{
    Builder.superclass.constructor.apply(this, arguments);
    this.init(config);
};

Builder.prototype = new Maker();
Builder.superclass = Maker.prototype;
Builder.prototype.debug = false;
Builder.prototype._buildname = null;
Builder.prototype._buildpath = null;
Builder.prototype._coreconfig = null;
Builder.prototype._appconfig = null;
Builder.prototype._ignore = ['config/config.js', 'config/app_config.js', 'config/dev_config.js', 'config/tests_config.js', 'config/tconfig.js', 'yoshioka.js/core/core_config.js'];
Builder.prototype.init = function(config)
{
    config = config || {};
    
    var buildname = config.buildname || new Date().getTime(),
        buildpath = config.buildpath || BUILD_DIR+buildname+'/',
        files;

    this.debug = config.debug;
    
    this._configtype = config && config.type
    config || (config = {});
    
    this._buildname = buildname;
    this._buildpath = buildpath;
    
    events.EventEmitter.call(this);
    
    this._appconfig = getconfig.getConfig({
        dev: (this._configtype === 'dev'),
        tests: (this._configtype === 'tests')
    });
    
    this.dirs = ['config'];
    this._appconfig &&
    this._appconfig.yoshioka &&
    this._appconfig.yoshioka.bundles.forEach(
        function(b)
        {
            this.dirs.push(b.path);
        }.bind(this)
    );

    this._filecount = 0;
    
    this._coreconfig = JSON.parse(
        fs.readFileSync(
            APP_PATH+'yoshioka.js/core/core_config.js'
        ).toString()
    );
    
    if (config.type === 'tests')
    {
        configtype = 'tests_config';
    }
    
    /**
     * Add all html files in root
     */
    fs.readdirSync(APP_PATH).forEach(
        function(f)
        {
            if (f.match(/\.html$/))
            {
                this.files.push(f);
            }
        }.bind(this)
    );
};
Builder.prototype.build = function()
{
    /**
     * Create build main dir
     */
    fs.stat(
        APP_PATH+BUILD_DIR,
        function(err, stats)
        {
            if (err)
            {
                fs.mkdirSync(APP_PATH+BUILD_DIR, 0755);
            }
            
            /**
             * Clean all previous builds
             */
            fs.readdirSync(
                APP_PATH+BUILD_DIR
            ).forEach(function(f)
            {
                var path = APP_PATH+BUILD_DIR+f;
                
                if (this.files.indexOf(f) > -1 ||
                    f.match(/^[0-9]+$/))
                {
                    rimraf.sync(path);
                }
            }.bind(this));
            
            /**
             * Create build subdir
             */
            fs.stat(
                APP_PATH+this._buildpath,
                function(err, stats)
                {
                    if (err)
                    {
                        fs.mkdirSync(APP_PATH+this._buildpath, 0755);
                    }
                    
                    this.fetch();
                }.bind(this)
            );
            
            
        }.bind(this)
    );
    
    /**
     * Make config
     */
    this._makeConfig();
    
    this.on(
        'parseEnd',
        function()
        {
            /**
             * Compile locales
             */
            this._compileLocales();
            
            /**
             * Copy yoshioka
             */
            fs.mkdirSync(
                APP_PATH+this._buildpath+'yoshioka.js/'
            );
            fs.mkdirSync(
                APP_PATH+this._buildpath+'yoshioka.js/build/'
            );
            fs.writeFileSync(
                APP_PATH+this._buildpath+'yoshioka.js/build/yoshioka.js',
                fs.readFileSync(
                    APP_PATH+'yoshioka.js/build/yoshioka.js'
                )
            );
            fs.writeFileSync(
                APP_PATH+this._buildpath+'yoshioka.js/build/init.js',
                fs.readFileSync(
                    APP_PATH+'yoshioka.js/build/init.js'
                )
            );
        }.bind(this)
    );
};
Builder.prototype._makeConfig = function()
{
    var Maker = require('../make/').Maker,
        maker = new Maker({
            dirs: ['locales', 'plugins', 'views', 'config'],
            apppath: this._buildpath,
            basepath: (this._appconfig.basepath || '')+'/'+this._buildname+'/',
            buildname: this._buildname,
            dev: (this._configtype === 'dev'),
            tests: (this._configtype === 'tests')
        });
    maker.on(
        'parseEnd',
        function(maker)
        {
            try
            {
                maker.writeConfig({
                    path: APP_PATH+this._buildpath
                });
            }
            catch (e)
            {
                util.log(e);
            }
        }.bind(this, maker)
    );
    try
    {
        maker.fetch();
    }
    catch (e)
    {
        util.log(e);
    }
};
Builder.prototype._parseJSFile = function(path)
{
    var ignore = false,
        c,
        basepath = this._getDestinationPath(path);
    
    this._ignore.forEach(
        function(file)
        {
            if (path.match(file))
            {
                ignore = true;
            }
        }
    );
    
    if (ignore)
    {
        this._filecount--;
        this._checkFileCount();
        return;
    }
    this._mkdir(path, basepath+'/');
    
    if (path.match(/routes.js$/))
    {
        c = new compiler.RoutesCompiler();
        c.parse(function(path, content)
        {
            fs.writeFile(
                basepath+path,
                content,
                'utf-8',
                function(path, err, data)
                {
                    this._filecount--;
                    this._checkFileCount();
                    return;
                }.bind(this, path)
            );
        }.bind(this, path));
        return;
    }
    else
    {
        c = new compiler.TemplateCompiler({
            file: path,
            basepath: (this._appconfig.basepath || '')+'/'+this._buildname
        });
        
        c.parse(function(path, content)
        {
            var c = new compiler.ModuleCompiler({
                filecontent: content,
                debug: this.debug
            });
            c.parse(function(path, content)
            {
                fs.writeFile(
                    basepath+path,
                    content,
                    'utf-8',
                    function(path, err, data)
                    {
                        this._filecount--;
                        this._checkFileCount();
                        return;
                    }.bind(this, path)
                );
            }.bind(this, path));
        }.bind(this, path));
    }
};
Builder.prototype._parseCSSFile = function(path)
{
    var c = new compiler.CSSCompiler({
            file: path
        }),
        basepath = this._getDestinationPath(path);
    
    this._mkdir(path, basepath+'/');
    
    c.parse(function(path, content)
    {
        fs.writeFile(
            basepath+path,
            content,
            function(path, err, data)
            {
                
                this._filecount--;
                this._checkFileCount();
                return;

            }.bind(this, path)
        );
    }.bind(this, path));
    
    this._filecount--;
    this._checkFileCount();
};
Builder.prototype._parseStaticFile = function(path)
{
    var content,
        basepath = this._getDestinationPath(path);
    
    if (path.match(/test\.js$/) ||
        path.match(/tpl\.html/))
    {
        this._filecount--;
        this._checkFileCount();
        return;
    }
    
    this._mkdir(path, basepath+'/');
    
    /**
     * Simple copy file in build folder
     */
    content = fs.readFileSync(
        APP_PATH+path
    );
    
    fs.writeFileSync(
        basepath+path,
        content
    );
    
    this._filecount--;
    this._checkFileCount();
};
Builder.prototype._parseHTMLFile = function(path, writepath)
{
    var c = new compiler.HTMLCompiler({
            file: path,
            basepath: (this._appconfig.basepath || '')+'/'+this._buildname,
            type: 'app'
        }),
        basepath = this._getDestinationPath(path);

    c.parse(function(path, content)
    {
        /**
         * If html file is on root level, move them
         */
        if (path.split(/\//).length === 1)
        {
            path = '../'+path;
        }
        
        fs.writeFile(
            basepath+path,
            content
        );
        this._filecount--;
        this._checkFileCount();
    }.bind(this, writepath || path));
};
Builder.prototype.insertCopyright = function(path)
{
    var copyright = "/*\n{name} {version}\n{text}\n*/\n",
        data,
        filecontent = fs.readFileSync(APP_PATH+this._buildpath+path).toString(),
        basepath = this._getDestinationPath(path);
    
    if (path.match(/yoshioka\.js/))
    {
        data = this._coreconfig.copyright;
    }
    else
    {
        data = this._appconfig.copyright;
    }
    
    if (data)
    {
        filecontent = copyright
            .replace(/\{name\}/, data.name)
            .replace(/\{version\}/, data.version)
            .replace(/\{text\}/, data.text)
            + filecontent;
    }
    fs.writeFileSync(
        basepath+path,
        filecontent
    );
};

Builder.prototype._compileLocales = function()
{
    var lpath = APP_PATH+this._buildpath+'locales/',
        c;
    
    try
    {
        fs.mkdirSync(
            lpath
        );
    }
    catch(e){}
    
    this._appconfig.locales.forEach(
        function(l)
        {
            c = new compiler.I18nCompiler({
                locale: l.locale
            });
            c.parse(
                function(locale, content)
                {
                    fs.writeFileSync(
                        lpath+locale+'.js',
                        content
                    );
                }.bind(this, l.locale)
            );
        }.bind(this)
    );
};

Builder.prototype._checkFileCount = function()
{
    if (this._filecount === 0)
    {
        this.emit('parseEnd', {
            buildname: this._buildname
        });
    }
};

Builder.prototype._getDestinationPath = function(path)
{
    var basepath = APP_PATH+this._buildpath;

    /**
     * If no bundle setting, just create the askde basepath
     */
    if (!path ||
        !this._appconfig ||
        !this._appconfig.yoshioka ||
        !this._appconfig.yoshioka.bundles)
    {
        return basepath;
    }

    var destination,
        pathparts = path.split(/\//),
        destinationparts;

    /**
     * Search into bundles setting if a `destination` basepath has been set
     */
    this._appconfig.yoshioka.bundles.forEach(
        function(b)
        {
            if (!b.destination) return;

            destinationparts = b.path.split(/\//);

            if (pathparts.slice(0, destinationparts.length).join('/') ===
                b.path)
            {
                basepath = APP_PATH+BUILD_DIR+b.destination;
            }
        }.bind(this)
    );

    return basepath;
}

exports.Builder = Builder;

})();