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
        switch (action)
        {
            case 'read':
                Y.io(
                    Y.config.api+'user',
                    {
                        method: 'post',
                        data: JSON.stringify({
                            method: 'read',
                            params: {
                                id: 1
                            },
                            id: Y.guid()
                        }),
                        on: {
                            success: function(id, data, callback)
                            {
                                var json = Y.JSON.parse(data.responseText);

                                callback(json.error, json.results);
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
    }
},
{
    ATTRS: {
        name: {
            value: 'Anonymous'
        }
    }
});
