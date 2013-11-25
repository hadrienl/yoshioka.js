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

    _events: null,

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

        this.__destruct(data);

        this.unbind();

        this._parent().destroy.apply(
            this, arguments);
    },

    __destruct: function(o)
    {
        Y.each(
            o,
            function(d)
            {
                if (Y.Lang.isArray(d))
                {
                    return this.__destruct(d);
                }

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
            },
            this
        );
    },

    /*
     * Store an event to not forget to clean it in the destroy process
     * @method storeEvent
     * @param {Y.Event} e Event to store
     * @return Y.Event
     * @public
     */
    storeEvent: function(events)
    {
        this._events = this._events || [];

        if (!Y.Lang.isArray(events))
        {
            events = [events];
        }
        Y.Array.each(
            events,
            function(e)
            {
                this._events.push(e);
            },
            this
        );
        return events;
    },
    unbind: function()
    {
        Y.each(
            this._events,
            function(e)
            {
                e.detach();
            }
        );
        this._events = [];
        
        this._isBinded = false;
    }
});
