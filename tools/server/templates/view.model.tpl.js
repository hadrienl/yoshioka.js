/**
 * {modelclass}
 * @module {module}
 * @requires model
 */
var

NS = '{appname}',

{modelclass} = function(config)
{
    {modelclass}.superclass.constructor.apply(this, arguments);
};

/**
 * {modelclass}
 * @class {modelclass}
 * @namespace Y.{appname}
 */
Y.namespace(NS).{modelclass} = Y.extend({modelclass}, Y.Model, {
    /**
     * Load data from data storage of your choice. You can use ajax request,
     * localstorage, jsonp, or whatever you want to get a JSON of data that will
     * be mapped with the parse() method
     * @method load
     * @param {object} options Options to use in method set in sync method
     * @param {function} callback Callback to execute after retreiving data
     */
    
    /**
     * Save data to data storage of your choice. You can use ajax request,
     * localstorage, jsonp, or whatever you want to send a JSON of your model's
     * attributes's values.
     * @method save
     * @param {object} options Options to use in method set in sync method
     * @param {function} callback Callback to execute after saving data
     */
    
    /**
     * Delete data from data storage of your choice. You can use ajax request,
     * localstorage, jsonp, or whatever you want to send the id of your model.
     * @method destroy
     * @param {object} options Options to use in method set in sync method
     * @param {function} callback Callback to execute after deleting data
     */
    
    /**
     * Sync model with data storage. This method will be called when you'll call
     * load(), save() or destroy() method on your object.
     * @method sync
     * @param {string} action
     * <dl>
     * <dt>create</dt>Create a new object. Called when model had no ID</dd>
     * <dt>read</dt><dd>Read object data on datastorage</dd>
     * <dt>update</dt><dd>Update object data on datastorage</dd>
     * <dt>delete</dt><dd>Delete object data on datastorage</dd>
     * @param {object} options Options to use in your data retreive actions
     * @param {function} callback Callback to execute after retreiving data
     * @protected
     */
    sync: function(action, options, callback)
    {
        switch (action)
        {
            case 'create':
                break;
            case 'read':
                break;
            case 'update':
                break;
            case 'delete':
                break;
        }
    }
},
{
    NAME: '{modelclass}',
    ATTRS: {
        /**
         * Set your model's attributes
         * @attribute your_attribute
         */
        your_attribute: {
            value: null
        }
    }
});
