/**
 * {viewclass} view
 * @module {module}
 * @requires ys/view
 */
var

NS = '{appname}',
{viewclass}/*

Place your constants here
eg:

MY_CONSTANT = 'foo',
MY_OTHER_CONSTANT = 'bar

*/;

/**
 * {view} view
 * @class {viewclass}
 * @namespace Y.{appname}
 * @constructor
 */
Y.namespace(NS).{viewclass} = {viewclass} = Y.Base.create('{viewclass}', Y.ys.View, [], {
    /*
    
    Place your prototype methods here
    eg:
    
    initializer: function()
    {
        doSomething();
    }
    */
},
{
    ATTRS: {
        template: {
            value: {${view}.tpl}
        },
        compile_params: {
            getter: function()
            {
                return {
                    /*yourparam: "this param's value"*/
                };
            }
        }
        /*
        
        Place your attributes here
        eg:
        
        ,
        my_attribute: {
            value: null
        },
        my_other_attribute: {
            valueFn function()
            {
                return Y.guid();
            },
            getter: function(v)
            {
                return this.get('my_attribute')+v
            }
        }
        */
    }
});
