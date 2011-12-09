(function() {

var

exec = require('child_process').exec,

Server = require('../server').Server,

browser = 'chromium-browser',
port = 1636,

url = '/__unittests',

server,

argv = process.argv,
args = {};

// Get arguments
argv.forEach(
    function(a, k)
    {
        var arg = (arg = a.match(/^\-{2}(.*)$/)) && arg[1],
            next = argv[k+1];
        
        if (arg)
        {
            args[arg] =
                (next &&
                (next = next.match(/^[^\-]+/)) && next[0])
                ||
                true;
        }
    }
);

if (args['browser'])
{
    if (args['browser'] === 'chromium')
    {
        browser = 'chromium-browser';
    }
    else if (args['browser'] === 'iceweasel')
    {
        browser = 'iceweasel';
    }
};

if (args['framework'])
{
    url = '/yoshioka.js/unittests/';
}

Server.prototype.__control = Server.prototype._control;
Server.prototype._control = function(req, res)
{
    this.postData = '';
    
    if (req.url === '/__unittests/report/')
    {
        req.on(
            'data',
            function (data)
            {
                this.postData += data;
            }.bind(this)
        );
        req.on(
            'end',
            function()
            {
                return this._getUTReport();
            }.bind(this)
        );
    }
    else
    {
        return Server.prototype.__control.apply(this, arguments);
    }
};
Server.prototype._getUTReport = function()
{
    var data = JSON.parse(this.postData);
    
    this.browser.kill('SIGSTOP');
    
    process.exit(
        parseInt(data.failed) === 0 ? 0 : 1
    );
};

server = new Server();

/**
 * Launch browser on unit tests page
 */
server.browser = exec(
    browser+' localhost:'+port+url,
    function(err)
    {
        if (err)
        {
            this.browser.kill('SIGSTOP');

            process.exit(1);
        }
    }.bind(server)
);
// Set a timer to kill the browser if it doesn't respond after some time
setTimeout(
    function()
    {
        server.browser.kill('SIGSTOP');
        process.exit(1);
    },
    10*60*1000,
    server
);


})();
