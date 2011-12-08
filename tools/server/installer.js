/**
 * @module tools/server/installer
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),
YS_PATH = '/yoshioka.js/',

fs = require('fs'),

Fetcher = require('../fetcher').Fetcher,

Installer = function(config)
{
    this.init(config);
};

/**
 * Installer tool. It install the first application by copying dist folder.
 * @class Installer
 * @extends Fetcher
 * @constructor
 * @param {object} config Config with these parameters :
 * <dl>
 *     <dt>namespace</dt>
 *     <dd>Application namespace</dd>
 * </dl>
 */
Installer.prototype = new Fetcher();
Installer.superclass = Fetcher.prototype;
/**
 * New application namespace
 * @attribute _namespace
 * @type string
 * @private
 */
Installer.prototype._namespace = null;
/**
 * Init the installer
 * @method init
 * @private
 */
Installer.prototype.init = function(config)
{
    Installer.superclass.init.apply(this, arguments);
    
    config || (config = {});
    
    this._namespace = config.namespace || 'yourapp';
    
    this.dirs = [YS_PATH+'dist'];
    
    this.on(
        'parseEnd',
        function()
        {
            this.emit('success');
        }.bind(this)
    );
};
/**
 * Run the installer process
 * @method run
 * @public
 */
Installer.prototype.run = function()
{
    try
    {
        this._copyFiles();
    }
    catch (e)
    {
        this.emit('failure', e);
    }
};
/**
 * Copy all files in the `dist` folder
 * @method _copyFiles
 * @private
 */
Installer.prototype._copyFiles = function()
{
    this.fetch();
};
/**
 * Parse a file, create its pathname in the app dir, and write the compiled new
 * one
 * @method _parseFile
 * @private
 */
Installer.prototype._parseFile = function(path)
{
    var newpath = APP_PATH+path.replace(YS_PATH+'dist/', '');
    
    this._mkdir(newpath);
    
    fs.readFile(
        APP_PATH+path,
        function(err, data)
        {
            if (err) throw err;
            
            fs.writeFile(
                newpath,
                this._compileFile(data.toString()),
                function(err)
                {
                    if (err) throw err;
                    
                    this._filecount--;
                    this._checkFileCount();
                }.bind(this)
            );
        }.bind(this)
    );
};
/**
 * Compile file
 * @method _compileFile
 * @private
 */
Installer.prototype._compileFile = function(content)
{
    return content.replace(
        /yourapp/g,
        this._namespace
    );
};

exports.Installer = Installer;

})();
