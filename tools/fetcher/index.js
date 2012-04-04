/**
 * Fetch a filesystem recursively and call some method according to the filetype
 * @module tools/fetcher
 */
(function(){

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

fs = require('fs'),
events = require('events'),

Fetcher = function(config)
{
    this.init.apply(this, arguments);
};
/**
 * Fetch a filesystem recursively and call some method according to the filetype
 * from a list of directories
 * @class Fetcher
 * @extends EventEmitter
 */
Fetcher.prototype = new events.EventEmitter();
Fetcher.prototype.dirs = null;
Fetcher.prototype.files = null;
Fetcher.prototype._filecounts = null;
Fetcher.prototype.init = function(config)
{
    events.EventEmitter.call(this);
    
    config || (config = {});
    this._filecount = 0;
    this.dirs = config.dirs ? config.dirs : [];
    this.files = config.files ? config.files : [];
};
/**
 * Fetch application files
 */
Fetcher.prototype.fetch = function()
{
    /**
     * Parse the root directories
     */
    this.dirs.forEach(
        function(path)
        {
            this._filecount++;
            this._parseDir(path)
        }.bind(this)
    );
    
    this.files.forEach(
        function(path)
        {
            this._filecount++;
            this._parseFile(path)
        }.bind(this)
    );
};
/**
 * Parse a directory
 */
Fetcher.prototype._parseDir = function(path)
{
    /**
     * Read the directory
     */
    fs.readdir(
        APP_PATH+path,
        function(err, dir)
        {
            if (dir)
            {
                /**
                 * Stat each path to know if it's a dir or a file
                 */
                dir.forEach(
                    function(d)
                    {
                        if (d.match(/^\./))
                        {
                            // Ignoring .files
                            return;
                        }
                        this._filecount++;
                        /**
                         * Stat on the path
                         */
                        fs.stat(
                            APP_PATH+path+'/'+d,
                            function(err, stat)
                            {
                                var file = path+'/'+d;
                                /**
                                 * Path is a directory, parse it !
                                 */
                                if (stat.isDirectory())
                                {
                                    this._parseDir(
                                        file
                                    );
                                }
                                /**
                                 * Path is a file, parse it !
                                 */
                                else if (stat.isFile())
                                {
                                    this._parseFile(
                                        file
                                    );
                                }
                            }.bind(this)
                        );
                    }.bind(this)
                );
            }
            
            this._filecount--;
            this._checkFileCount();
            
        }.bind(this)
    );
};
/**
 * Parse a file
 */
Fetcher.prototype._parseFile = function(path)
{
    this._filecount--;
    this._checkFileCount();
};
/**
 * Check the file count. Fire a `end` event if equal to 0.
 */
Fetcher.prototype._checkFileCount = function()
{
    if (this._filecount === 0)
    {
        this.emit('parseEnd');
    }
};
/**
 * Create dirs recursively from a path
 */
Fetcher.prototype._mkdir = function(path, basepath)
{
    var file = (file = path.split(/\//)) && file[file.length - 1],
        dir = path.replace(file, ''),
        parts = basepath || '';
    
    dir.split(/\//).forEach(
        function(part)
        {
            parts+=part+'/';
            try
            {
                fs.statSync(parts);
            }
            catch (e)
            {
                fs.mkdirSync(parts, 0755)
            }
        }
    );
};

exports.Fetcher = Fetcher;

})();