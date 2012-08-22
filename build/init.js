YUI().use(
    'errors',
    'yoshioka',
    'node',
    YUI_config.ys_app+'/views/'+YUI_config.ys_mainview,
    function(Y)
{
    var NS = 'ys',
        html = Y.one('html'),
        body = Y.one('body'),
        viewclass =
            Y.config.ys_mainview.charAt(0).toUpperCase()+
            Y.config.ys_mainview.slice(1)+
            'View',
        main = new Y[Y.config.ys_app][viewclass](),
        waitpanel = body.one('.ys_tmp_wait'),
        c = Y[NS].Router;

    waitpanel && waitpanel.remove();
    
    body.append(
        main.render()
    );
    
    html.addClass('ys_loaded');
    
    if (!c.get('html5') &&
        window.location.pathname !== '/')
    {
        window.location.href = '/#'+c.getPath();
    }
    
    c.dispatch();
});
