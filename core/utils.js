/**
 * Utils mixins
 * @module ys/utils
 * @requires base
 */
var

NS = 'ys';

/**
 * Utils to help use some redondant processes. To use as a mixin :
 * <pre>MyClass = Y.Base.create('MyClass', MyParentClass, [Y.ys.utils], {
 *    // prototype
 * }, {
 *    ATTRS: {}
 });</pre>
 * @class utils
 * @namespace Y.ys
 * @extends Y.Base
 * @constructor
 */
Y.namespace(NS).utils = Y.Base.create('YSUtils', Y.Base, [], {

    /**
     * Get the parent class
     * @method _parent
     * @protected
     */
    _parent: function ()
    {
        return this.constructor.superclass;
    },

    /**
     * Destructor util
     * @method _destruct
     * @param {Array} data Array of data to destroy
     * @protected
     */
    _destruct: function(data)
    {
        if (!Y.Lang.isArray(data))
        {
            data = [data];
        }

        Y.each(
            data,
            function(d)
            {
                try
                {
                    if (d)
                    {
                        if (d.destroy)
                        {
                            d.destroy();
                        }

                        delete d;
                    }
                }
                catch (e)
                {
                    console.error(e);
                }
            }
        );

        this._parent().destructor.apply(
            this, arguments);
    }
});
