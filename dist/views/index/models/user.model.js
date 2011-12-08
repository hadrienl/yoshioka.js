/**
 * @module yourapp/views/index/models/user
 * @requires model
 */
var

NS = 'yourapp',

User = function(config)
{
    User.superclass.constructor.apply(this, arguments);
};

Y.namespace(NS).User = Y.extend(User, Y.Model, {
    
},
{
    ATTRS: {
        name: {
            value: 'Anonymous'
        }
    }
});
