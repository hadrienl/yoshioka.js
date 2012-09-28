YUI.add("yoshioka", function(Y) {(function() {/**
 * Internationalisation tools
 * @module ys/i18n
 * @requires base, cache, get
 */

var

NS = 'ys',

DEFAULT_LOCALE = 'en_US',

CACHE_LOCALE = 'loc',

locale_cache = new Y.CacheOffline({
    sandbox: (Y.config.cacheprefix || '')+'locale'
}),

/**
 * I18n object for an unique translation
 */
I18n = function(config)
{
    I18n.superclass.constructor.apply(this, arguments);
},
/**
 * Manager of all translation in the app
 */
I18nManager = function(config)
{
    I18nManager.superclass.constructor.apply(this, arguments);
};

/**
 * Whitelisting the DOMNodeRemovedFromDocument event to use it on
 * I18n's node destruction
 */
Y.mix(Y.Node.DOM_EVENTS, {
    DOMNodeRemovedFromDocument: true
});

/**
 * I18n object helps to get a live translation of text.
 * @class I18nManager.I18n
 * @namespace Y.ys
 * @extends Y.Base
 * @constructor
 * @param {Object} config Object with configuration property name/value
 * pairs. The object can be used to provide default values for the objects
 * published attributes.
 *
 * <p>
 * The config object can also contain the following non-attribute
 * properties, providing a convenient way to configure events listeners and
 * plugins for the instance, as part of the constructor call:
 * </p>
 *
 * <dl>
 *     <dt>params</dt>
 *     <dd>Object of name/value text to replace @@name@@ into
 * translation</dd>
 *        <dt></dt>
 * </dl>
 */
Y.extend(I18n, Y.Base, {
    
    /**
     * Autokill flag. Set to false if you don't want your I18n object to be
     * destroyed when Node is not present in DOM.
     * @property _autokill
     * @private
     */
    _autokill: true,
    
    /**
     * Initialize a i18n object
     * @method initializer
     * @protected
     */
    initializer: function(config)
    {
        /**
         * Add new attrs for each params in the params attr
         * and call insertTranslation method on one of them change
         */
        if (config.params)
        {
            Y.Object.each(
                config.params,
                function(v, k)
                {
                    this.addAttr(k, {broadcast: 1});
                    this.after(
                        k+'Change',
                        function()
                        {
                            this._insertTranslation();
                        },
                        this
                    );
                },
                this
            );

            this.setAttrs(config.params);
        }

        /**
         * After locale change, call the changeLanguage method to update the
         * node
         */
        this.after(
            'localeChange',
            function(e)
            {
                this.getLocalizedString();
            }
        );

        /**
         * Set translation in node asynchronously
         */
        this.after(
            'translationChange',
            function(e)
            {
                this._insertTranslation();
            }
        );
        
        this._checklife = Y.later(
            5000,
            this,
            function()
            {
                if (this._autokill &&
                    !Y.one('#'+this.get('id')))
                {
                    this.destroy();
                    
                    // IE <= 8 seems to have problems with this delete
                    try
                    {
                        delete this;
                    }
                    catch(e)
                    {}
                   
                }
            },
            null,
            true
        );
    },
    
    destructor: function()
    {
        this._checklife.cancel();
    },

    /**
     * Load the translations file, and get the localized string from the key
     * Call is asynchronized, so it will update `translation` attr when
     * it'll be load, and so, fire `translationChange` event.
     * @method getLocalizedString
     * @public
     */
    getLocalizedString: function()
    {
        Y.namespace(NS).I18nManager.getLocalizedString({
            key: this.get('key'),
            locale: this.get('locale'),
            callback: Y.bind(
                function(text)
                {
                    this.set(
                        'translation',
                        text
                    );
                
                },
                this
            )
        });
    },

    /**
     * Get a localized string from key
     * key has the form : 'module~key'
     * @method localize
     * @param {boolean} tostring Set to true if you want a node as a string
     * to set as innerHTML of a parent node. Default is Y.Node object to
     * be append in a parent node. You can set a
     * callback function to do whatever you want with the translation when it's
     * loaded. The callback will be called everytime the translation change.
     * @return Y.Node|string
     * @public
     */
    localize: function(tostring)
    {
        var node, t;

        /**
         * Load the locale
         */
        this.getLocalizedString();

        t = this._insertTranslation();

        /**
         * Create the string node
         */
        node = '<span id="'+this.get('id')+'">'+
            t+
            '</span>';

        /**
         * Create a node from the string
         */
        if (tostring !== true)
        {
            node = Y.Node.create(node);
            node.i18n = this;
            this.set('node', node);
        }
        /**
         * A callback has been given. This callback will be called everytime the
         * translation change. The callback take the translation as first param.
         */
        if (typeof tostring === 'function')
        {
            this._autokill = false;
            
            this.after(
                'translationChange',
                function(e, fn)
                {
                    fn(this._insertTranslation());
                },
                this,
                tostring
            );
            tostring(t);
        }
        /**
         * If tostring is true, a string will returned instead of a Node
         * object. It's usefull for templates not already instancied.
         */

        return node;
    },


    /**
     * Get node from attr or from dom
     * @method getNode
     * @return Y.Node
     * @public
     */
    getNode: function()
    {
        var node = this.get('node');

        if (!node)
        {
            /**
             * No node set, try to get it in DOM from the ID given to the
             * string node
             */
            node = Y.one('#'+this.get('id'));
            this.set('node', node);
        }

        return node;
    },
    /**
     * Replace translation string with uptodate params in the node span
     * container
     * @method _insertTranslation
     * @return string
     * @protected
     */
    _insertTranslation: function()
    {
        var node = this.getNode()
            t = this.get('translation');

        t = t && t.replace(
            /@@(.[^(@@)]*?)@@/gi,
            Y.bind(
                function(a, b)
                {
                    var v = this.get(b);
                    return v ? v : '';
                },
                this
            ),
            t
        );

        if (node)
        {
            try
            {
                node.set(
                    'innerHTML',
                    t
                );
            }
            catch(e)
            {
                node.set(
                    'innerText',
                    t
                );
            }
            

            node.fire('i18n:change', {translation: t});
        }

        return t;
    },
    /**
     * Destruct the node and purge all its events listeners
     * @method destructor
     * @protected
     */
    destructor: function()
    {
        var node = this.get('node');
        if (node)
        {
            Y.Event.purgeElement(node, true);
            node.remove();
        }
    }
},
{
    NAME: 'I18n',
    ATTRS: {
        /**
         * A random GUID generated at the instanciation
         * @attribute id
         * @private
         */
        id: {
            valueFn: function()
            {
                return Y.guid();
            }
        },
        /**
         * Language code for the translation
         * @attribute locale
         * @public
         */
        locale: {
            value: null,
            /**
             * Fired when locale code has changed
             * @event localeChange
             */
            broadcast: 1
        },
        /**
         * Translation key
         * @attribute key
         * @public
         */
        key: {
            value: null
        },
        /**
         * Container node
         * @attribute node
         * @private
         */
        node: {
            setter: function(n)
            {
                if (n)
                {
                    n.on(
                        'DOMNodeRemovedFromDocument',
                        function()
                        {
                            this.set('node', null);
                            this.destroy();
                        },
                        this
                    );
                    
                    n.destroy = Y.bind(
                        function()
                        {
                            this.destroy();
                        },
                        this
                    );
                }
                return n;
            }
        },
        /**
         * Translation text
         * @attribute translation
         * @public
         */
        translation: {
            value: '&nbsp;', /* fix a bug with chrome when sometime an empty
                              * span filled later doesn't change its content
                              * size
                              */
            /**
             * Fired when translated text has changed
             * @event translationChange
             */
            broadcast: 1
        }
    }
});

/**
 * I18nManager helps to create new translations and globally set locale code
 * @class I18nManager
 * @namespace Y.ys
 * @extends Y.Base
 * @constructor
 */
Y.extend(I18nManager, Y.Base, {
    
    _locales: null,
    _loading: null,
    
    /**
     * Initialize the manager and set the default locale code : from the
     * browser or from the app_config
     * @method initializer
     * @protected
     */
    initializer: function()
    {
        this._locales = {};
        this._loading = {};
        
        /**
         * Bind locale change event to set all the instancied I18n locale
         */
        this.after(
            'localeChange',
            function()
            {
                var keys = this.get('keys'),
                    locale = this.get('locale');

                Y.Object.each(
                    keys,
                    function(I18n)
                    {
                        if (I18n)
                        {
                            I18n.set('locale', locale);
                        }
                    }
                );
            }
        );
    },

    /**
     * Get a localized string from key
     * key has the form : 'module~key'
     * @method localize
     * @param {string} key The key of the locale to translate. Must have the
     * form `file~key`. `key` can have /[a-zA-Z0-9\.\-_]/ characters.
     * @param {object} params Parameters to give to the translation. The
     * translation must have some @@name@@ keyword to place the parameter.
     * @param {boolean|Function} tostring True if you want a string to insert in
     * a innerHTML. Default if you want a Y.Node to append in DOM. You can set a
     * callback function to do whatever you want with the translation when it's
     * loaded. The callback will be called everytime the translation change.
     * @example <pre>
     * __('file~key', null, Y.bind(
     *     function(text)
     *     {
     *         this.one('input').setAttribute('placeholder', text);
     *     },
     *     this
     * ));
     * // The placeholder attribute will be updated when the locale will be
     * // loaded and everytime the use change the global locale.
     * </pre>
     * @return string|Y.Node
     * @public
     */
    localize: function(key, params, tostring)
    {
        var keys = this.get('keys'),
            el = this.createKey(key, params);

        params || (params = {});

        return el.localize(tostring);
    },

    /**
     * Create a new key
     * @method createKey
     * @param {string} key The key of the locale to translate. Must have the
     * form `file~key`. `key` can have /[a-zA-Z0-9\.\-_]/ characters.
     * @param {object} params Parameters to give to the translation. The
     * translation must have some @@name@@ keyword to place the parameter.
     * @return Y.ys.I18n
     * @public
     */
    createKey: function(key, params)
    {
        var i = new I18n({
                key: key,
                locale: this.get('locale'),
                params: params
            }),
            keys = this.get('keys');

        keys[i.get('id')] = i;

        this.set('keys', keys);

        return i;
    },
    
    _loadLocales: function(locale, callback)
    {
        if (this._loading[locale])
        {
            this._loading[locale].push(callback);
            
            return;
        }
        
        this._loading[locale] = [callback];
        
        Y.Get.script(
            (Y.config.localepath || '/locales/') +locale+'.js',
            {
                onSuccess: Y.bind(
                    function(locale)
                    {
                        var locales = window['__ys_locales_'+locale];

                        this._locales[locale] = Y.clone(locales);
                        
                        try{
                            delete window['__ys_locales_'+locale];
                        }
                        catch(e)
                        {
                            window['__ys_locales_'+locale] = null;
                        }
                        
                        Y.each(
                            this._loading[locale],
                            function(fn)
                            {
                                fn();
                            }
                        );
                        this._loading[locale] = [];
                    },
                    this,
                    locale
                )
            }
        );
    },
    
    getLocalizedString: function(config)
    {
        config = config || {};
        
        var locale = config.locale || this.get('locale'),
            locales = this._locales[locale],
            key = config.key,
            text;
        
        if (!key) return;
        
        if (!locales)
        {
            return this._loadLocales(
                this.get('locale'),
                Y.bind(
                    this.getLocalizedString,
                    this,
                    {
                        key: key,
                        callback: config.callback
                    }
                )
            );  
        }
        
        text = locales[key.replace(/~/, '.')];
        
        config.callback && config.callback(text);
        
        return text;
    }
},
{
    NAME: 'I18nManager',
    ATTRS: {
        /**
         * Global language configuration
         * @attribute locale
         * @public
         */
        locale: {
            valueFn: function()
            {
                var clocale = locale_cache.retrieve(CACHE_LOCALE);
                
                return clocale && clocale.response;
            },
            /**
             * Function to set the locale after verifying its validity. Set the
             * default if invalid
             * @method set('locale')
             * @public
             */
            setter: function(locale)
            {
                var found = false,
                    dft = navigator.language || navigator.userLanguage || DEFAULT_LOCALE;

                /**
                 * Look into config if asked locale is available
                 */
                if (Y.config.locales)
                {
                    Y.Array.some(
                        Y.config.locales,
                        function(l)
                        {
                            if (l.locale === locale)
                            {
                                locale = l.locale;
                                return (found = true);
                            }
                            if (l.sameas)
                            {
                                Y.Array.some(
                                    l.sameas,
                                    function(s)
                                    {
                                        if (s === locale)
                                        {
                                            locale = l.locale;
                                            return (found = true);
                                        }
                                    }
                                );
                            }
                            if (true === l['default'])
                            {
                                dft = l.locale
                            }
                            return found;
                        }
                    );
                    
                    /**
                     * Looking for locale name in 2 caracters
                     */
                    if (!found && Y.Lang.isString(locale))
                    {
                        locale = locale.substring(0,2);
                        
                        Y.Array.some(
                            Y.config.locales,
                            function(l)
                            {
                                if (l.locale.substring(0,2) === locale)
                                {
                                    locale = l.locale;
                                    return (found = true);
                                }
                                return found;
                            }
                        );
                    }
                }
                
                if (!found)
                {
                    locale = dft;
                }
                
                locale_cache.add(CACHE_LOCALE, locale);
                
                return locale;
            },
            /**
             * Fired when the locale has been changed
             * @event localeChange
             */
            broadcast: 1
        },
        /**
         * Collection of I18n objects
         * @attribute keys
         * @protected
         */
        keys: {
            valueFn: Object
        }
    }
});

/**
 * Instanciate new I18nManager in the ys namespace
 */
Y.namespace(NS).I18nManager = new I18nManager();
Y.namespace(NS).I18nManager.I18n = I18n;
/**
 * Create a usefull global function : __()
 * @method window.__
 * @param {string} key Translation key
 * @param {object} param Object of params to give to the locale
 * @param {boolean} tostring Do you want a Node or a string ?
 */
window.__ = function(key, params, tostring)
{
    return Y.ys.I18nManager.localize(key, params, tostring);
};
})();(function() {/**
 * View
 * @module ys/view
 * @requires view, node, get, substitute, json
 */

var

NS = 'ys',

CLASS_YS_LOADING_VIEW = 'ys-loading-view',

View = function(config)
{
    View.superclass.constructor.apply(this, arguments);
};

/**
 * Y.ys.View extends Y.View and add it all the magic of yoshioka. With this
 * view, you can dynamically load other views and construct your interface.
 * You can use templates, locales, load and unload css.
 * <p>When you instanciate a view, you append its container node to a parent by
 * calling render() method :</p>
 * <pre>
 * var view = new Y.ys.MyView();
 * Y.one(document.body).append(
 *     view.render()
 * );
 * </pre>
 * <p>Will append the node in page body.</p>
 * <p>The render() method will call renderUI(), bindUI() and syncUI() methods, then, will return `container` attribute. So when you write a view, you just have to write this three methods.</p>
 * <ul><li>renderUI() will generate all the DOM from template(s) or javascript</li>
 * <li>bindUI() will listen to events relative to the view</li>
 * <li>syncUI() will update variables in view's DOM from it's attributes and models. You'll have to call it anytime an attribute used in the view has changed.</li></ul>
 * @class View
 * @namespace Y.ys
 * @extend Y.View
 * @constructor
 */
Y.namespace(NS).View = Y.extend(View, Y.View, {
    
    /**
     * Current view in place
     * @property _currentview
     * @private
     */
    _currentview: null,
    /**
     * Current state in place
     * @property _loading
     * @private
     */
    _loading: null,
    
    /**
     * Store your custom events listener in this array which will be cleaned
     * into the destroy process
     * @property _events
     * @type Array
     * @private
     */
    _events: null,
    
    /**
     * Flag to set if view has been binded
     * @property _isBinded
     * @protected
     */
    _isBinded: false,

    /**
     * Init the view
     * @method initializer
     * @protected
     */
    initializer: function()
    {
        /**
         * Init collections
         */
        this._currentview = {};
        this._loading = {};
        this._events = [];
    },
    
    /**
     * Render method is the main method that you have to use.
     * It will render the template in the node container,
     * bind the event of the view,
     * then sync the content.
     * The container will be returned to be appened on a parent node.
     * @method render
     * @public
     * @return Y.Node
     */
    render: function()
    {
        this._render && this._render();
        
        Y.later(
            1,
            this,
            function()
            {
                this.fire('render');
                this.set('rendered', true);
            }
        );
        
        return this.get('container');
    },
    
    /**
     * Protected render method. Change this in your custom views
     * @method _render
     * @protected
     */
    _render: function()
    {
        this.renderUI();
        this.bindUI();
        this.syncUI();
    },
    
    /**
     * Render the view DOM
     * @method renderUI
     * @public
     */
    renderUI: function()
    {
        var container = this.get('container');
        
        container.set('innerHTML', '');
        container.append(
            this._compile(this.get('compile_params'))
        );
        
        return this._renderUI && this._renderUI();
    },
    
    /**
     * Add some element into view container that wouldn't have been created into
     * template : instanciate subview, widgets, etc
     * @method _renderUI
     * @protected
     */
    _renderUI: function()
    {
        
    },
    
    /**
     * Bind event listener to `container` attribute DOM
     * @method bindUI
     * @public
     */
    bindUI: function()
    {
        if (this._isBinded)
        {
            return;
        }
        
        this._bindUI && this._bindUI();
        
        this._isBinded = true;
        
        return true;
    },
    
    /**
     * Bind view elements'event
     * @method _bindUI
     * @protected
     */
    _bindUI: function()
    {
        
    },
    
    unbindUI: function()
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
    },
    
    /**
     * Update view DOM with attributes values. If views is detroyed, just do
     * nothing
     * @method syncUI
     * @public
     */
    syncUI: function()
    {
        if (this.get('destroyed'))
        {
            return;
        }
        return this._syncUI && this._syncUI.apply(this, arguments);
    },
    
    /**
     * Set view's own method to sync the view
     * @method _syncUI
     * @protected
     */
    _syncUI: function()
    {
        
    },
    
    /**
     * Remove all css links of this view
     * method destructor
     * @protected
     */
    destructor: function()
    {
        this.unbindUI();
        
        View.superclass.destroy.apply(this);
    },
    
    /**
     * Return a Node compiled template
     * @method _compile
     * @param {object} params Object of parameters :
     * <dl>
     *        <dt>tpl</dt>
     *         <dd>Alternative template</dd>
     *        <dt>Ohter parameters</dt>
     *        <dd>…are given to Y.substitute method to replace `{name}`
     *        keywords into template</dd>
     * </dl>
     * @private
     * @return Y.Node
     * @throws {Error} when no template is given
     */
    _compile: function(params)
    {
        var tpl = (params && params.tpl) || this.get('template'),
            node,
            locales = tpl && tpl.match(
                /\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/gi
            );
        
        if (!tpl)
        {
            return;
        }
        
        params || (params = {});
        
        if (locales)
        {
            Y.Array.each(
                locales,
                function(l)
                {
                    var l = l.match(/\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/),
                        toreplace = l[0],
                        key = l[1],
                        params = (params = l[2]) ? params.replace(/'/,"\\\'") : 'null';

                    if (params)
                    {
                        try
                        {
                            params = Y.JSON.parse(params);
                        }
                        catch(e)
                        {
                            throw new Error(
                                "Your paramaters in locale `"+key+"` is not a valid JSON."
                            );
                        }
                    }

                    tpl = tpl.replace(
                        toreplace,
                        __(key, params, true)
                    );
                }
            );
        }
        
        if (!tpl)
        {
            throw new Error("No template given.");
        }
        
        node = Y.Node.create(
            Y.substitute(
                tpl,
                params
            )
        );
        
        if (!params.enhance || params.enhance !== false)
        {
            Y.ys.Router.enhance(node.all('a'));
        }
        
        return node;
    },
    
    /**
     * Append a view to a node in the container view with params. Only one
     * view can be loaded at a time, so if another view is already loading,
     * this one will be queued and delayed 100ms later, waiting for its
     * turn.
     * @method setView
     * @param {string} name View name.
     *     <p>The module and classname will be defined from this name :</p>
     *     <dl>
     *         <dt>module</dt>
     *         <dd>app\_name\_view</dd>
     *         <dt>classname</dt>
     *         <dd>Y.yourapp.NameView (yourapp is configured in default_config
     *         `app` param)</dd>
     *     </dl>
     * @param {string} place A CSS classname representing the element where
     * to append the view in the main container
     * @param {Object} params Config to give to the view's constructor
     * @param {function} callback A callback function to execute after
     * the view's module has been loaded
     * @example <pre>
     *this.setView(
     *    'articleslist',
     *    'main',
     *    {
     *        type: 'published'
     *    }
     *);</pre>
     * @public
     */
    setView: function(name, place, params, callback) // TODO : (name|Class, node, params, callback)
    {
        var container = this.get('container'),
            el;
        
        if (this._loading[place])
        {
            /**
             * A view is currently loading for this place, delay the new
             * load
             */
            Y.later(
                100,
                this,
                Y.bind(
                    function(name, place, params, callback)
                    {
                        this.setView(name, place, params, callback);
                    },
                    this,
                    name, place, params, callback
                )
            );
            return;
        }
        
        try
        {
            el = container.one('.'+place);
            el && el.addClass(CLASS_YS_LOADING_VIEW);
            this._setView(name, place, params, callback);
        }
        catch (e)
        {
            /**
             * On exception, set loading flag as false to tell the load is
             * finished.
             */
            this._loading[place] = false;
            
            el = container.one('.'+place);
            el && el.removeClass(CLASS_YS_LOADING_VIEW);
            
            throw e;
        }
    },
    /**
     * The real view setter ! When queue is free, the hard work can begin.
     * @method _setView
     * @protected
     */
    _setView: function(name, place, params, callback)
    {
        var container = this.get('container'),
            /**
             * Get the node corresponding to the place given
             */
            node = container.one('.'+place),
            /**
             * Construct the object classname from the name param
             * will get 'NameView' for 'name' param, so the view must be
             * a 'NameView' Object in a 'name' module
             */
            classname = name.charAt(0).toUpperCase()+name.slice(1)+'View',
            /**
             * Module name
             */
            module = Y.config.ys_app+'/views/'+name,
            /**
             * Put this in a variable to use it in the new sandbox
             */
            self = this,
            
            el;

        params || (params = {});

        /**
         * Check if new view is the same as the current
         * to avoid re instanciate same class and reload the page
         */
        if (this._currentview[place] &&
            this._currentview[place].constructor.NAME === classname)
        {
            /**
             * Don't instanciate new view, just give new params to it
             */
            this._currentview[place].setAttrs(params);
            
            el = container.one('.'+place);
            el && el.removeClass(CLASS_YS_LOADING_VIEW);
        }
        else
        {
            /**
             * Add a wait class on html
             */
            Y.one('html').addClass('_loading_view');

            /**
             * Set loading flag for this place
             */
            this._loading[place] = true;

            /**
             * Load new view
             */
            Y.namespace(NS).use(
                module,
                Y.bind(
                    function()
                    {
                        this._setViewCallback.apply(this, arguments);
                        /**
                         * Remove wait class on body
                         */
                        Y.one('html').removeClass('_loading_view');
                    },
                    this,
                    classname,
                    params,
                    node,
                    place,
                    callback
                )
            );
        }
    },
    /**
     * The callback for the _setView method. Executed when the module has
     * been loaded. It instanciates the view, remove the current loaded
     * view, then execute the callback given in setView or append the
     * rendered view into the given place
     * @method _setViewCallback
     * @param {string} classname The view javascript classname
     * @param {object} param The config object to construct the view
     * @param {Y.Node} node The node where to append the view
     * @param {string} place The className of the place where to append the
     * view
     * @param {function} callback Callback to execute
     * @protected
     * throws {Error} If the view class does not exist. You _MUST_ declare
     * a Y.yourapp.NameView class extending Y.ys.View
     */
    _setViewCallback: function(classname, params, node, place, callback)
    {
        var viewclass =
            Y[Y.config.ys_app][classname],
            /**
             * Instanciate view
             */
            view;
            
        try
        {
            view = new viewclass(params);
        }
        catch (e)
        {
            throw new Error(
                "This view does not exist. You must declare a "+
                "`Y."+Y.config.ys_app+"."+classname+"` class in a "+
                "`"+Y.config.ys_app+"_"+
                classname.toLowerCase().replace('view', '_view')+"` module"
            );
        }
        
        /**
         * Destroy previously instancied view
         */
        this._removeCurrentView(place, view);

        /**
         * Append view to the given node in main view
         */
        if (callback)
        {
            callback(view, node);
        }
        else
        {
            node.append(
                view.render()
            );
        }

        this._loading[place] = false;
        
        view.after(
            'render',
            function(e, place)
            {
                var el;
                el = this.get('container').one('.'+place);
                el && el.removeClass(CLASS_YS_LOADING_VIEW);
            },
            this,
            place
        );
    },
    /**
     * Remove current view. Can be overrided to do something before
     * destroying the view
     * @method _removeCurrentView
     * @param {string} place The className of the place where to append the
     * view
     * @param {Y.ys.View} The new view which take the place of the previous
     * @protected
     */
    _removeCurrentView: function(place, view)
    {
        if (this._currentview[place])
        {
            this._currentview[place].remove();
        }
        this._currentview[place] = view;
    },
    /**
     * Remove the view. Can be overrided to do something before destroy the
     * view
     * @method remove
     * @public
     */
    remove: function()
    {
        this.destroy();
    },
    
    /**
     * Extract subtemplates
     * @method extractSubTemplate
     * @param {object} params same as compileTpl(param…)
     * @param {object} options Extraction parameters. Array of parameters object :
     * <dl>
     *     <dt>selector</dt>
     *     <dd>expression passed to Node.one() method to get the node to extract</dd>
     *     <dt>outer</dt>
     *     <dd>True if you want to extract the outerHTML of the selected node. Default is false</dd>
     *     <dt>clean</dt>
     *     <dd>Remove the extracted zone from the main template. Default is true.</dd>
     * </dl>
     * @example <pre>view.extractSubTemplate(
     * {
     *     tpl: '&lt;div&gt;foo&lt;div class="sub"&gt;bar&lt;/div&gt;&lt;/div&gt;'
     * },
     * {
     *     selector: '.sub',
     *     outer: true,
     *     clean: true
     * }
     * );</pre>
     * @public
     */
    extractSubTemplate: function(params, options)
    {
        var node,
            response = [''],
            removeId = /\s+id=["']yui[^"']*?["']/;
        
        params ||(params = {});
        
        params.tpl || (params.tpl = this.get('template'));
        
        if (!options ||
            !Y.Lang.isArray(options))
        {
            return [params.tpl];
        }
        
        node = Y.Node.create(Y.substitute(
            '<div>' + params.tpl + '</div>',
            params
        ));
        Y.Array.each(
            options,
            function(o)
            {
                var sel = o.selector,
                    outer = !(o.outer === false),
                    clean = !(o.clean === false),
                    zone, content, div = Y.Node.create('<div></div>');
                
                if (!sel)
                {
                    throw new Error('Selector is not set');
                }
                
                zone = node.one(sel);
                
                if (outer)
                {
                    div.append(zone);
                    content = div.get('innerHTML');
                    
                    if (clean)
                    {
                        zone.remove();
                    }
                }
                else
                {
                    content = zone.get('innerHTML');
                    
                    if (clean)
                    {
                        zone.set('innerHTML', '');
                    }
                }
                response[response.length] = content
                    .replace(removeId, '')
            },
            this
        );
        response[0] = node.get('innerHTML');
        
        return response;
    },
    /**
     * Get current view instance in given place
     * @method getCurrentView
     * @param {string} place Classname of the node's place where the view is
     * appened
     * @public
     */
    getCurrentView: function(place)
    {
        return this._currentview[place] || null;
    },
    
    /**
     * Store an event to not forget to clean it in the destroy process
     * @method storeEvent
     * @param {Y.Event} e Event to store
     * @return Y.Event
     * @public
     */
    storeEvent: function(events)
    {
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
    }
},
{
    NAME: 'Y.'+NS+'.View',
    ATTRS: {
        /**
         * Set true when view has been rendered
         * @attribute rendered
         * @public
         */
        rendered: {
            value: false,
            validator: function(v)
            {
                return Y.Lang.isBoolean(v);
            }
        },
        /**
         * Parameters given to the container compilation process
         * @attribute compile_params
         * @public
         */
        compile_params: {
            valueFn: Object
        }
    }
});
})();(function() {/**
 * The framework core that made the dream become true
 * @module ys/core
 * @requires router, model, ys/routes, substitute, ys/i18n
 */

var

NS = 'ys',

EVT_PATH_CHANGE = 'pathchange',

Core = function()
{
    Core.superclass.constructor.apply(this, arguments);
};
    
/**
 * Core object. It extends Y.Router and manage routes
 * by updating a Coord
 * @class Core
 * @namespace Y.ys
 * @extends Y.Router
 * @constructor
 */
Y.namespace(NS).Core = Y.extend(Core, Y.Router, {
    
    initializer: function()
    {
        Core.superclass.initializer.apply(this, arguments);
        
        /**
         * <p>
         * The path has changed. Fire everytime a link enhanced by
         * Y.ys.Router.enhance method is clicked. The link's href is
         * passed in e param as e.path.
         * </p>
         * @event pathchange
         * @param {EventFacade} e Event object
         */
        this.publish(
            EVT_PATH_CHANGE,
            {
                emitFacade: true,
                defaultFn: Y.bind(
                    function(e)
                    {
                        this.save(
                            e.path
                        );
                    },
                    this
                )
            }
        );
    },
    
    /**
     * Callback for path changes which update coord object
     * @method _updateAttrs
     * @param {object} attrs Routes statics attributes (set in routes.js)
     * @param {object} params Dynamic parameters extracted from uri
     * @protected
     */
    _updateAttrs: function(attrs, params)
    {
        var attrsp = {},
            coord = this.get('coord');
            
        Y.Object.each(
            attrs,
            function(v, k)
            {
                coord.addAttr(
                    k, {}
                );

                if (Y.Lang.isObject(v))
                {
                    attrsp[k] = this._substituteObj(v, params);
                }
                else if (Y.Lang.isString(v))
                {
                    attrsp[k] = this._substitute(v, params);
                }
                else
                {
                    attrsp[k] = v;
                }
            },
            this
        );
        
        /**
         * Reset attributes unset
         */
        Y.Object.each(
            coord.getAttrs(),
            function(v, k)
            {
                if (k !== 'initialized' &&
                    k !== 'destroyed' &&
                    k !== 'clientId' &&
                    k !== 'id')
                {
                    if (!attrsp[k])
                    {
                        attrsp[k] = false;
                    }
                }
            }
        );
        coord.setAttrs(attrsp);
        
        this.set('coord', coord);
    },
    /**
     * Y.substitue alias
     * @method _substitute
     * @return string with new value
     * @protected
     */
    _substitute: function(v, params)
    {
        return Y.substitute(
            v,
            params
        );
    },
    /**
     * Substitute keywords in a value by values in an object
     * @method _substituteObj
     * @param {string} v original value
     * @param {object} params Values to replace
     * @return object with new values
     * @protected
     */
    _substituteObj: function(v, params)
    {
        var newo = {};
        Y.Object.each(
            v,
            function(i, k)
            {
                newo[k] = this._substitute(i, params);
            },
            this
        );
        return newo;
    },
    /**
     * Load routes from routes.js
     * @method loadRoutes
     * @param {Array} routes Array of objects with a path value and some
     * arbitrary values associated
     * @return Y.ys.Coord object wich contains attributes which will
     * be updated
     * @public
     */
    loadRoutes: function(routes)
    {
        routes || (routes = []);
        
        Y.Array.each(
            routes,
            function(r)
            {
                this.route(
                    r.path,
                    Y.bind(
                        function(attrs, req)
                        {
                            this._updateAttrs(attrs, req.params);
                        },
                        this,
                        r
                    )
                );
            },
            this
        );
        
        return this.get('coord');
    },
    /**
     * Replace click event of a link (`a` tag) to make it call the
     * Y.Router.save() method in place of loading its href and update
     * Y.ys.Coord object
     * @method enhance
     * @param {Node|NodeList} links Node or nodeList of `a` elements
     * @public
     */
    enhance: function(links)
    {
        if (links._node)
        {
            links = Y.all(links._node);
        }
        
        if (links)
        {
            links.each(
                function(link)
                {
                    this._enhance(link);
                },
                this
            );
        }
    },
    /**
     * Set the click event on the link
     * @method _enhance
     * @param {Node} link Node `a` element
     * @protected
     */
    _enhance: function(link)
    {
        link.on(
            'click',
            function(e, link)
            {
                var href = link.getAttribute('href'),
                    match = href.match(/^((https?:)?\/\/)([^\/]*)/),
                    path;

                if (!this.hasRoute(href) // this link is not handle in a route
                    ||
                    (e.button !== 1 || e.ctrlKey || e.metaKey) // ability to open link in a new window/tab
                    ||
                    (match && match[3] !== window.location.hostname)) // don't change link behavior if it's not on same host
                {
                    return;
                }
                
                
                e.preventDefault();
                
                path = this.removeRoot(link.get('href'));
                
                this.fire(EVT_PATH_CHANGE, {path: path});
            },
            this,
            link
        );
    },
    /**
     * Load a module, add it to the Y object and execute a callback.
     * It's an ehnaced version of the Y.use method
     * @method use
     * @param {string} module Module to load
     * @param {Function} callback Callback to execute
     * @public
     */
    use: function(module, callback)
    {
        if (Y.Env._used[module])
        {
            callback(Y);
        }
        else
        {
            Y.use(module, Y.bind(
                function(callback) {
                    callback(Y);
                },
                Y,
                callback
            ));
        }
    }
},
{
    NAME: 'Core',
    ATTRS: {
        /**
         * Coord object which is updated when path change
         * @property coord
         * @type Y.Model
         */
        coord: {
            valueFn: function()
            {
                return new Y.Model();
            }
        }
    }
});

/**
 * @class Router
 * @namespace Y.ys
 * @extends Y.ys.Core
 */
Y.namespace(NS).Router = new (Y.namespace(NS).Core)();

/**
 * Coord object. Listen to its `change` event to know if a route has changed.
 * <p>When you configure a route, you specify an object with a `path` attribute and some arbitraries attributes of your choice. This attributes are set to the Coord object in the way you can listen to them in any views.</p>
 * <p>By example, if you specify this routes :</p>
 * <pre>[{
 *     "path": "/",
 *     "foo": "bar"
 * },
 * {
 *     "path": "/hello",
 *     "foo": "hello"
 * }]</pre>
 * <p>So, Y.ys.Coord.get('foo') will return `bar` for path / and `hello` for path /hello. A view can listen to Y.ys.Coord attributes change to do behavior :</p>
 * <pre>
 * Y.ys.Coord.after(
 *     'fooChange',
 *     this.doSomething,
 *     this
 * );
 * </pre>
 * <p>Each time the path change and the attribute foo's value change, the view will execute its method doSomething().</p>
 * @class Coord
 * @namespace Y.ys
 * @extends Y.Model
 * @event change event
 */
Y.namespace(NS).Coord = Y.namespace(NS).Router.loadRoutes(Y[NS].routes);

Y.namespace(NS).use = Y.namespace(NS).Router.use;
})();});