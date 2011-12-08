/**
 * Synchronous Compressor
 * @module tools/build
 */
(function() {

var

APP_PATH = __dirname.replace(/yoshioka\.js.*$/, ''),

fs = require('fs'),
exec = require('child_process').exec,

Compressor = function(config)
{
    this.init(config);
};

Compressor.prototype = {
    _buildpath: null,
    _files: null,
    init: function(config)
    {
        this._buildpath = config && config.path;
        
        if (!this._buildpath)
        {
            throw new Error("No path given");
        }
        
        this._files = [];
    },
    /**
     * Fetch all the build folder synchronous and compress any css and js files
     * found
     * @method compress
     * @public
     */
    compress: function(callback)
    {
        this._callback = callback;
        this.readDir(this._buildpath);
        this._files[0] && this.processFile(0);
    },
    readDir: function(path)
    {
        var dir = fs.readdirSync(path);
        
        dir.forEach(
            function(f)
            {
                var s = fs.statSync(
                    path+'/'+f
                );
                
                if (s.isDirectory())
                {
                    return this.readDir(path+'/'+f);
                }
                else
                {
                    this.addFile(path+'/'+f);
                }

            }.bind(this)
        );
    },
    addFile: function(path)
    {
        if (path.match(/(j|cs)s$/))
        {
            this._files.push(path);
        }
    },
    processFile: function(i)
    {
        var path = this._files[i];
        
        if (!path)
        {
            this._callback && this._callback();
            return;
        }
        if (path.match(/js$/))
        {
            // JS File !! Compress !
            var cmd = exec(
                'java -jar '+__dirname+
                '/yuicompressor-2.4.6.jar --type js --charset utf8 '+
                path+' -o '+
                path,
                function(i, err, stdout, stderr)
                {
                    if (err)
                    {
                        console.log(
                            'YUICompressor detects errors in '+path+" :\n"
                        );
                        console.log(stderr);
                    }
                    //this.insertCopyright(path);
                    return this.processFile(i+1);
                }.bind(this, i)
            );
        }
        else if (path.match(/css$/))
        {
            // CSS File !! Compress !
            var cmd = exec(
                'java -jar '+__dirname+
                '/yuicompressor-2.4.6.jar --type css --charset utf8 '+path+
                ' -o '+path,
                function(i, err, stdout, stderr)
                {
                    if (err)
                    {
                        console.log(
                            'YUICompressor detects errors in '+path+" :\n"
                        );
                        console.log(stderr);
                    }
                    //this.insertCopyright(path);
                    return this.processFile(i+1);
                }.bind(this, i)
            );
        }
        else
        {
            return this.processFile(i+1);
        }
    }
};

exports.Compressor = Compressor;

})();