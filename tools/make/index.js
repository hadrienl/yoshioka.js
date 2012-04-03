/**
 * Make the YUI_config file from all the application files and config
 * @module tools/make
 */
(function(){

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

fs = require('fs'),
events = require('events'),

getconfig = require('./getconfig'),

Fetcher = require('../fetcher').Fetcher,

/**
 * Make the YUI_config file from all the application files and config
 * @class Maker
 */
Maker = function(config)
{
    this.init.apply(this, arguments);
};

Maker.prototype = new Fetcher();
Maker.superclass = Fetcher.prototype;
Maker.prototype.dirs = null;
Maker.prototype.files = null;
Maker.prototype.basepath = null;
Maker.prototype._filecounts = null;
Maker.prototype._modules = null;
Maker.prototype._dev = null;
Maker.prototype.init = function(config)
{
    Maker.superclass.init.apply(this, arguments);
    
    config || (config = {});
    
    this.basepath = config.basepath || '/';
    this._modules = {};
    this._dev = config.dev;
    this._tests = config.tests;
    
    this._appConfig = getconfig.getConfig({
        dev: this._dev,
        tests: this._tests,
        buildname: config.buildname || ''
    });
};
/**
 * Parse a file
 */
Maker.prototype._parseFile = function(path)
{
    /**
     * Read file content
     */
    fs.readFile(
        APP_PATH+path,
        function(err, data)
        {
            /**
             * Check file type
             */
            if (path.match(/\.i18n\.js$/))
            {
                /**
                 * Locale file
                 */
                this._parseLocaleFile(path);
            }
            else if (path.match(/\.js$/) &&
                    !path.match(/test\.js$/))
            {
                /**
                 * Javascript file
                 */
                this._parseJSFile(path);
            }
            else if (path.match(/\.css$/))
            {
                /**
                 * CSS file
                 */
                this._parseCSSFile(path);
            }
            else if (path.match(/\.html$/))
            {
                /**
                 * CSS file
                 */
                this._parseHTMLFile(path);
            }
            else
            {
                this._parseStaticFile(path);
            }
        }.bind(this)
    );
};
Maker.prototype._parseLocaleFile = function(path)
{
    var locale = (locale = path.match(/locales\/([^\/]+)/)) ?
            locale[1] : null,
        file = (file = path.split(/\//)) && file[file.length - 1],
        module = 'i18n/'+locale+'/'+file.replace(/.i18n\.js?/, '');
    
    /**
     * Generate config object for
     * this module
     */
    this._modules[module] = {};
    this._modules[module].path = path;
    
    
    /**
     * Decrement file count and check
     */
    this._filecount--;
    this._checkFileCount();
};
Maker.prototype._parseJSFile = function(path)
{
    /**
     * Read the file content to get the requires
     */
    fs.readFile(
        APP_PATH+path,
        function(err, data)
        {
            if (err)
            {
                throw err;
            }
            var script = data.toString(),
                /**
                 * get module name from
                 * YUI().add call
                 */
                module = (module = script.match(
                        /\@module ([a-zA-Z0-9\/\-\_]+)/
                    )) && module[1],
                /**
                 * Get the requires array
                 */
                requires = script.replace(/\n/g, '')
                    .match(/\/\*.*?\*\//);
            
            if (!module)
            {
                this._filecount--;
                this._checkFileCount();
                return;
            }
            
            if (requires &&
                (requires = requires[0].match(
                    /\@requires ([a-zA-Z0-9\/\-\_\,\.\s\*]+)\s\*(\/|\s@)/
                )))
            {
                requires = requires[1]
                    .replace(/\s\*/g, '')
                    .replace(/,$/, '')
                    .replace(/\s/g, '')
                    .replace(/\*/g, '')
                    .split(/,/);
            }
            
            /**
             * Generate config object for
             * this module
             */
            this._modules[module] = {};
            this._modules[module].path = path;
            if (requires)
            {
                this._modules[module].requires = requires
            }
            
            /**
             * Decrement file count and check
             */
            this._filecount--;
            this._checkFileCount();
            
        }.bind(this)
    );
};
Maker.prototype._parseCSSFile = function(path)
{
    var file = (file = path.split(/\//)) &&
        (file = file[file.length - 1].split(/\./)) &&
        file.pop() &&
        file.join('.'),
        
        module = (module = path.match(/([^\/]+)\/assets\//)) && module[1],
        
        isplugin = path.match(/^plugins\//);
    
    if (!module)
    {
        throw 'CSS file unknown path : ' + path;
    }
    
    module = this._appConfig.ys_app +
        (isplugin ? '/plugins/' : '/views/')+module+'/assets/'+file;
    
    /**
     * Generate config object for
     * this module
     */
    this._modules[module] = {};
    this._modules[module].path = path;
    this._modules[module].type = 'css';
    
    
    /**
     * Decrement file count and check
     */
    this._filecount--;
    this._checkFileCount();
};
Maker.prototype._parseStaticFile = function()
{
    this._filecount--;
    this._checkFileCount();
};
Maker.prototype._parseHTMLFile = function()
{
    this._filecount--;
    this._checkFileCount();
};
/**
 * Check the file count. Fire a `end` event if equal to 0.
 */
Maker.prototype._checkFileCount = function()
{
    if (this._filecount === 0)
    {
        this.emit('parseEnd');
    }
};
// Write config file
Maker.prototype.writeConfig = function(config)
{
    /**
     * Get the default config file
     */
    var coreConfig, YUI_config, filename;
    
    config || (config = {});
    
    config.path || (config.path = APP_PATH);
    
    filename = (true === config.tests) ? 'tconfig.js' : 'config.js'
    
    try
    {
        coreConfig = fs.readFileSync(
            APP_PATH+'yoshioka.js/core/core_config.js'
        ).toString();
    }
    catch (e)
    {
        throw new Error("Core config is missing. Please restore the yoshioka.js/core/core_config.js file.\n");
    }
    
    /**
     * Set YUI_config default values
     */
    YUI_config = this._appConfig;
    YUI_config.ys_app || (YUI_config.ys_app = 'ys');
    YUI_config.ys_mainview || (YUI_config.ys_mainview = 'main');
    YUI_config.groups || (YUI_config.groups = {});
    YUI_config.groups.core = JSON.parse(coreConfig);
    YUI_config.groups.core.base = this.basepath;

    /**
     * App group config
     */
    YUI_config.groups[YUI_config.ys_app] ||
        (YUI_config.groups[YUI_config.ys_app] = {});
    YUI_config.groups[YUI_config.ys_app].modules = this._modules;
    YUI_config.groups[YUI_config.ys_app].base = this.basepath;
    
    fs.writeFile(
        config.path+'config/'+filename,
        'YUI_config=' + JSON.stringify(YUI_config) + ';',
        function(err)
        {
            this.emit('writeEnd');
        }.bind(this)
    );
};

exports.Maker = Maker;

})();