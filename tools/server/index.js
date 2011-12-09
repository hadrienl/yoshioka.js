/**
 * Server yoshioka.js. It compile and serve all the files for the developpement
 * phase. Then it can build an autonome static version of the application.
 * @module tools/server
 */

(function(){

var

APP_PATH = __dirname.replace(/yoshioka.\js.*$/, ''),

http = require('http'),

util = require('util'),
fs = require('fs'),

getconfig = require('../make/getconfig'),
UnitTests = require('../unittests').UnitTests,
Cli = require('./cli').Cli,
FileParser = require('./fileparser').FileParser,
Coverage = require('../coverage').Coverage,
Fixtures,

Server = function(config)
{
    this.init(config);
};

try
{
    /**
     * Try to load your own fixture class
     */
    Fixtures = require(APP_PATH+'fixtures').Fixtures;
}
catch (e) {
    /**
     * Load the bundled one
     */
    Fixtures = require('./fixtures').Fixtures;
}


/**
 * Server
 * @class Server
 * @constructor
 */
Server.prototype = {
    /**
     * Server init config
     * @property _config
     * @private
     */
    _config: null,
    /**
     * Cli object
     * @property _cli
     * @private
     */
    _cli: null,
    /**
     * HTTP server object
     * @property _http
     * @private
     */
    _http: null,
    /**
     * Port number for HTTP server
     * @property _port
     * @private
     */
    _port: null,
    
    /**
     * Init Server with config from add_config.js and dev_config.js.
     * Start a HTTP server and wait for client request. Call _control method
     * on request.
     * @method init
     * @private
     */
    init: function(config)
    {
        this._config = config || {};
        
        this._config.app = getconfig.getConfig({
            dev: true
        });
        
        if (this._config.build)
        {
            // Build the app !!
            var Builder = require('../build').Builder,
                builder = new Builder({
                    path: this._config.build
                });

            builder.on(
                'parseEnd',
                function()
                {
                    // Compress
                    var Compressor = require('../build/compressor').Compressor,
                        compressor = new Compressor({
                            path: APP_PATH+this._buildpath
                        });
                    console.log("Compressing…");
                    compressor.compress(function()
                    {
                        console.log('Done !');
                    });
                }
            );
            console.log("Building…");
            builder.build();
            return;
        }
        
        this._cli = new Cli({
            dev: true
        });
        
        this._port = this._config.app.port || 1636;
        
        this._http = http.createServer(
            function(req, res)
            {
                this._control(req, res);
            }.bind(this)
        );
        
        this._http.listen(this._port);
    },
    /**
     * Dispatch the request by calling the correct callback according to the
     * request
     * @method _control
     * @param {Request} req Reques
     * @param {Response} res Response
     * @private
     */
    _control :function (req, res)
    {
        var url = req.url,
            f,
            fixtures_path = null,
            config = getconfig.getConfig({
                dev: true
            });
        
        if (url.match(/^\/$/))
        {
            url+='index.html';
        }
        
        if (url.match(/^\/yoshioka.js\/unittests\/$/))
        {
            url+='index.html';
        }
        
        /**
         * If url is __unittests, then, display unit tests
         */
        if (url.match(/^\/__unittests/))
        {
            try
            {
                f = new UnitTests({
                    test: url.match(/^\/__unittests(\/(.*?)$)?/)[2]
                });
            }
            catch (e)
            {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(
                    e.message
                );
                return;
            }
            /**
             * Start unit tests
             */
            f.getHTML(function(content)
            {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(
                    content
                );
            });
            return;
        }
        
        /**
         * If url starts with /__coverage, start the code coverage process
         */
        if (url.match(/^\/__coverage\//))
        {
            f = new Coverage({
                req: req,
                res: res
            });
            return f.process();
        }
        if (url.match(/^\/coverage\//))
        {
            if (url.match(/html$/))
            {
                res.writeHead(200, {'Content-Type': 'text/html'});
            }
            else if (url.match(/css$/))
            {
                res.writeHead(200, {'Content-Type': 'text/stylesheet'});
            }
            else if (url.match(/js$/))
            {
                res.writeHead(200, {'Content-Type': 'text/javascript'});
            }
            try
            {
                res.end(
                    fs.readFileSync(APP_PATH+url)
                );
            }
            catch (e)
            {
                res.end(
                    ''
                );
            }
            return;
        }
        
        if (url.match(/^\/logerror\?/))
        {
            try
            {
                util.log("Uncaught exception received from client :")
                console.log(
                    JSON.parse(
                        decodeURIComponent(
                            url.replace(/^\/logerror\?/, '')
                        )
                    )
                );
            }
            catch (e)
            {
                util.log(e);
            }
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(
                ''
            );
            return;
        }

        /**
         * Check if url is a fixtures path (the API for example)
         */
        if (config &&
            config.fixtures)
        {
            config.fixtures.forEach(
                function(p)
                {
                    if (url.match(new RegExp(p.path)))
                    {
                        fixtures_path = p;
                    }
                }
            );
            
            if (fixtures_path)
            {
                /**
                 * Call the fixture handler
                 */
                new Fixtures(req, res, fixtures_path);
                return;
            }
        }
        
        /**
         * In all other case, construct a new FileParser object
         */
        f = new FileParser({
            url: url
        });

        /**
         * When the FileParser gets the file content, return it in the client
         * response
         */
        f.getResponse(function(f)
        {
            this.writeHead(f.httpcode, {'Content-Type': f.contenttype});
            this.end(
                f.filecontent
            );
        }.bind(res))
    }
};

exports.Server = Server;
    
})();
