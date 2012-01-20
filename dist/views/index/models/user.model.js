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
    sync: function(action, options, callback)
    {
        case 'read':
            Y.io(
                '/api',
                {
                    method: 'post',
                    data: JSON.stringify({
                        method: 'getUser',
                        id: 1
                    }),
                    on: {
                        success: function(id, data, callback)
                        {
                            var json = Y.JSON.parse(data.responseText);

                            args.callback(json.error, json.results);
                        }
                    },
                    context: this,
                    arguments: callback
                }
            );
            break;
        case 'create':
        case 'update':
        case 'delete':
            break;
    }
},
{
    ATTRS: {
        name: {
            value: 'Anonymous'
        }
    }
});
