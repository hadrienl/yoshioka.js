(function() {

var

Server = require('./tools/server').Server,

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

new Server(args);

})();
