/**
 * Index view
 * @module yourapp/views/index
 * @requires ys/view, yourapp/views/index/models/user, io, json,
 * yourapp/views/index/assets/skin
 */
var NS = 'yourapp',

CLASS_USER = 'user',

IndexView = function(config)
{
    IndexView.superclass.constructor.apply(this, arguments);
};

/**
 * Index view
 * @class IndexView
 * @namespace Y.test
 */
Y.namespace(NS).IndexView = Y.extend(IndexView, Y.ys.View, {
    template: {$index.tpl},
    
    renderUI: function()
    {
        this.container.append(
            this.compileTpl({
                class_user: CLASS_USER
            })
        );
        
        this.get('user').load(Y.bind(
            function(err, data)
            {
                this.syncUI();
            },
            this
        ))
    },
    syncUI: function()
    {
        var user = this.get('user');
        
        this.container.one('.'+CLASS_USER).set(
            'innerHTML',
            user.get('name')
        );
    }
},
{
    NAME: 'IndexView',
    ATTRS: {
        user: {
            valueFn: function()
            {
                return new Y.yourapp.User();
            }
        }
    }
});
