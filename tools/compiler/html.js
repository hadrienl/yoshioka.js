/**
 * HTML compiler
 * @module tools/compiler/html
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
BR = '[[__BR__]]',
BR_REG = /\[\[__BR__\]\]/g,
CSS_BLOCK_REG = /\{css\}(.*?)\{\/css\}/gi,
fs = require('fs'),
getconfig = require('../make/getconfig'),

CSSCompiler = require('./css').CSSCompiler,

HTMLCompiler = function(config)
{
    this.init(config);
};
HTMLCompiler.prototype =
{
    _file: null,
    _filecontent: '',
    _configtype: null,
    
    init: function(config)
    {
        config || (config = {});
        
        this._file = config.file;
        
        this._basepath =
            (config.basepath ||
            this._getFilePath()
                .replace(/\/+/gi, '/')
                .replace(/\/$/, ''));
        
        this._filecontent = config.filecontent;
        
        this._configtype = (config.type || 'dev');
    },
    
    /**
     * Parse HTML file :
     * - replace {$basepath} variable by the environment basepath
     * - compile {css}{/css} blocks
     */
    parse: function(callback)
    {
        if (!this._filecontent)
        {
            this._filecontent = fs.readFile(
                APP_PATH+'/'+this._file,
                function(callback, err, data)
                {
                    if (err)
                    {
                        console.error(err);
                        this._filecontent = '';
                    }
                    else
                    {
                        this._filecontent = data.toString();
                    }
                    this._parse(callback);
                }.bind(this, callback)
            );
        }
        else
        {
            this._parse(callback);
        }
    },
    _parse: function(callback)
    {
        var config = getconfig.getConfig({
            dev: (this._configtype === 'dev'),
            tests: (this._configtype === 'tests')
        });
        /**
         * Replace some tags
         */
        this._filecontent = this._filecontent
            .replace(
                /\{\$basepath\}/gi,
                this._basepath)
            .replace(
                /\{\$core_config\}/gi,
                this._getCoreConfig())
            .replace(
                /\{\$yuipath\}/gi,
                config.yuipath || 'http://yui.yahooapis.com/3.4.1/build'
            );
        
        // Read and replace config properties
        for (var i in config)
        {
            this._filecontent = this._filecontent.replace(
                new RegExp('\\{\\$'+i+'\\}'),
                config[i]
            );
        }
        
        /**
         * specials tags
         */
        this._filecontent = this._filecontent.replace(/\n/g, BR);
        
        this._parseCSSBlock(callback);
    },
    _parseCSSBlock: function(callback)
    {
        var block = this._filecontent.match(CSS_BLOCK_REG);
        
        if (block)
        {
            return this._compileCSSBlock(
                block[0].replace(
                    BR_REG,
                    "\n"
                ),
                callback
            );
        }
        
        this._finishParsing(callback);
    },
    _finishParsing: function(callback)
    {
        this._filecontent = this._filecontent.replace(
            BR_REG,
            "\n"
        );
        if (callback)
        {
            return callback(this._filecontent);
        }
        return this._filecontent;
    },
    
    /**
     * Compile the text between two {css}{/css} block tags
     */
    _compileCSSBlock: function(block, callback)
    {
        var c = new CSSCompiler({
            filecontent: block.replace(/\{css\}/, '')
                              .replace(/\{\/css\}/, '')
        });
        c.parse(function(block, callback, content)
        {
            this._filecontent = this._filecontent
                .replace(/\n/g, BR)
                .replace(
                    block.replace(/\n/g, BR),
                    content.replace(/\n/g, BR)
                )
                .replace(BR_REG, "\n");
            
            this._parseCSSBlock(callback);
        }.bind(this, block, callback));
    },
    
    /**
     * Get the file path without filename
     */
    _getFilePath: function()
    {
        var path;
        if (!this._file)
        {
            return '/';
        }
        path = this._file.split(/\//);
        path.pop();
        return path.join('/').replace(APP_PATH, '');
    },
    /**
     * Get core config json for unittests
     */
    _getCoreConfig: function()
    {
        return fs.readFileSync(
            APP_PATH+'yoshioka.js/core/core_config.js'
        ).toString();
    }
};
exports.HTMLCompiler = HTMLCompiler;
    
})();
