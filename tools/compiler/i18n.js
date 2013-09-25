/**
 * Internationalisation compiler
 * @module tools/compiler/i18n
 */
(function() {

var fs = require('fs'),

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, '')+'/',
I18N_PATH = APP_PATH+'locales',

I18nCompiler = function(config)
{
    /**
     * variable description
     * @type type
     */
    this.init(config);
};
I18nCompiler.prototype =
{
    _locale: null,
    _filecontent: '',

    init: function(config)
    {
        this._locale = config.locale;
        
        if (!this._locale)
        {
            throw 'locale is invalid';
        }

        this._filecontent = '';
    },
    parse: function(callback)
    {
        var localespath = I18N_PATH+'/'+this._locale,
            files, content;
        
        try
        {
            files = fs.readdirSync(
                localespath
            );
        }
        catch(e)
        {
            console.log(this._locale+' is not a valid locale');
            return callback();
        }
        
        files.forEach(
            function(f)
            {
                var content = fs.readFileSync(
                        localespath+'/'+f
                    ).toString(),
                    group = f.match(/(.*?)\.i18n\.js/)[1];
                
                content = content.replace(
                    /(^|\n)(\w)/g,
                    '$1'+group+'.$2'
                );
                
                this._filecontent += content+'\n';
            }.bind(this)
        );
        
        this._parse(callback);
    },
    _parse: function(callback)
    {
        var lines = {};
        
        /**
         * Remove \n in line ending with \
         */
        this._filecontent = this._filecontent.replace(/\\\n/g, ' ');
        
        /**
         * Transform each line in a kv object
         */
        this._filecontent.split(/\n/).forEach(
            function(l)
            {
                var kv = l.match(/^(.*?)\s*=\s*(.*?)$/);
                if (!kv) return;
                lines[kv[1]] = kv[2];
            }
        );
        
        this._filecontent = JSON.stringify(lines);
        
        if (callback)
        {
            return callback(this._filecontent);
        }
        return this._filecontent;
    }
};
exports.I18nCompiler = I18nCompiler;

})();