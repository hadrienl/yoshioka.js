var fs = require('fs'),
    corepath = __dirname+'/../../core',
    files = ['i18n.js', 'view.js', 'core.js', 'utils.js'],
    content = '';

content += 'YUI.add("yoshioka", function(Y) {';

files.forEach(
    function(f)
    {
        var file = fs.readFileSync(corepath+'/'+f).toString();
        
        content += '(function() {'+file+'})();';
    }
);

content += '});';

fs.writeFileSync(
    corepath+'/../build/yoshioka.js',
    content
);
