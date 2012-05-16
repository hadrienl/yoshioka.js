/**
 * CSS compiler
 * @module tools/compiler/css
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',

fs = require('fs'),
less,

CSSCompiler = function(config)
{
    this.init(config);
};

CSSCompiler.prototype = {
    
    _file: null,
    _filecontent: '',
    
    init: function(config)
    {
        config || (config = {});
        
        this._file = config.file;
        
        this._filecontent = config.filecontent;
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
                        return callback('');
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
    
    _parse: function(callback)
    {
        try
        {
            less = require('less');
            less.render(
                this._filecontent,
                {
                    paths: [APP_PATH+'less/']
                },
                function (callback, e, css)
                {
                    if (e)
                    {
                        console.log("Less render error in "+this._file);
                        css = this._filecontent;
                    }
                    if (callback)
                    {
                        return callback(css);
                    }
                }.bind(this, callback)
            );
        }
        catch (e)
        {
            console.error(
                'Less '+e.type+' error : "'+e.message+'" in file '+this._file
            );
            if (callback)
            {
                return callback(this._filecontent);
            }
            return this._filecontent;
        }
    }
}

exports.CSSCompiler = CSSCompiler;

})();