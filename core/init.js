YUI().use(
    'errors',
    'ys/core',
    'node',
    YUI_config.app+'/views/'+YUI_config.mainview,
    function(Y)
{
    var NS = 'ys',
        html = Y.one(document).one('html'),
        body = Y.one(document.body),
        viewclass =
            Y.config.mainview.charAt(0).toUpperCase()+
            Y.config.mainview.slice(1)+
            'View',
        main = new Y[Y.config.app][viewclass](),
        waitpanel = body.one('.ys_tmp_wait'),
        c = Y[NS].Controller;

    waitpanel && waitpanel.remove();
    
    body.append(
        main.render()
    );
    
    html.addClass('ys_loaded');
    
    if (!c.html5 &&
        window.location.pathname !== '/')
    {
        window.location.href = '/#'+c.getPath();
    }
    
    c.dispatch();
});
