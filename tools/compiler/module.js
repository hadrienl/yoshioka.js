/**
 * YUI module compiler
 * @module tools/compiler/module
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',

fs = require('fs'),

ModuleCompiler = function(config)
{
    this.init(config);
};

ModuleCompiler.prototype = {

    _file: null,
    _filecontent: '',
    _debug: false,

    init: function(config)
    {
        config || (config = {});

        this._file = config.file;

        this._filecontent = config.filecontent;
        
        this._debug = config.debug;
    },
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
                        if(err.code =="ENOENT")
                        {
                            console.log("File content seems to be missing or is not valid. "+err);
                        }
                        else
                        {
                            console.log(err);
                        }

                        return this._parse(callback);
                    }
                    this._filecontent = data.toString();
                    this._parse(callback);
                }.bind(this, callback)
            );
        }
        else
        {
            this._parse(callback);
        }
    },

    parseSync: function()
    {
        if (!this._filecontent)
        {
            this._filecontent = fs.readFileSync(APP_PATH+'/'+this._file).toString();
        }
        return this._compile();
    },

    _parse: function(callback)
    {
        try
        {
            return callback(this._compile());
        }
        catch (e)
        {
            if (callback)
            {
                return callback(this._filecontent);
            }
            return this._filecontent;
        }
    },

    _compile: function()
    {
            /**
             * Get the module name in the comment `module`
             */
        var module = (module = this._filecontent.match(
                /\@module ([a-zA-Z0-9\/\-\_]+)/
            )) && module[1],
            /**
             * Get requires modules in the comment `@requires`
             */
            requires = (requires = this._filecontent.replace(/\n|\r/g, '')
                .match(/\/\*.*?\*\//)[0]
                .match(
                    /\@requires ([a-zA-Z0-9\/\-\_\,\.\s\*]+)\s\*(\/|\s@)/
                )) && requires[1]
                .replace(/\s\*/g, '')
                .replace(/,$/, '')
                .replace(/\s/g, '')
                .replace(/\*/g, '')
                .split(/,/),
            classnameprefix = module.replace(/\W/g, '-')+'-$1';
        
        if (this._debug)
        {
            this._addDebugFunctionNames(module);
        }
        
        if (module)
        {
            this._filecontent =
"YUI.add('"+module+"', function(Y) {\n"+
this._filecontent+"\n"+
"}, '1.234', {requires: "+JSON.stringify(requires)+"})";
        }

        /**
         * Replace classnames
         */
        this._filecontent = this._filecontent.replace(
            /\{\$classname\:['"](.+)['"]\}/g,
            '\''+classnameprefix+'\''
        );

        return this._filecontent;
    },
    
    _addDebugFunctionNames: function(module)
    {
        var lines = this._filecontent.split(/\n/),
            content = '';
        
        module = module.replace(/[^a-zA-Z0-9\_]/g, '_');
        
        lines.forEach(
            function(l, i)
            {
                l = l.replace(
                        /([a-zA-Z0-9\_]+)(\s?:\s?function)\(/,
                            '$1$2 $1_'+module+'('
                    ).replace(
                        /function\s*\(/,
                            'function _'+module+'_l_'+i+'('
                    );
                
                content += l+'\n';
            }
        );
        
        this._filecontent = content;
    }
}

exports.ModuleCompiler = ModuleCompiler;

})();
