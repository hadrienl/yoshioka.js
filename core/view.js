/**
 * View
 * @module ys/view
 * @requires view, node, get, substitute, json
 */

var

NS = 'ys',
View,

CLASS_YS_LOADING_VIEW = 'ys-loading-view',

EVT_SYNCUI = 'sync',

LOC_OPEN_TAG = '<<<LOC_OPEN>>>',
LOC_CLOSE_TAG = '<<<LOC_CLOSE>>>',
LOC_OPEN_PARAM = '<<<LOC_OPEN_PARAM>>>',
LOC_CLOSE_PARAM = '<<<LOC_CLOSE_PARAM>>>';

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
Y.namespace(NS).View = View = Y.Base.create('View', Y.View, [], {
    
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
        this._syncUI && this._syncUI.apply(this, arguments);
        this.fire(EVT_SYNCUI);
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
            locales;

        if (!tpl)
        {
            return;
        }
        
        params || (params = {});
        
        /**
         * Clean locales brackets to avoid Y.substitute remove them
        **/
        tpl = tpl.replace(
            /\{\@(.*?)\@\}/g,
            LOC_OPEN_TAG+'$1'+LOC_CLOSE_TAG
        );
        
        tpl = Y.substitute(
            tpl,
            params
        );
        
        locales = tpl.match(
            new RegExp(LOC_OPEN_TAG+'([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?'+LOC_CLOSE_TAG, 'gi')
        );
        
        if (locales)
        {
            Y.Array.each(
                locales,
                function(l)
                {
                    var l = l.match(
                            new RegExp(LOC_OPEN_TAG+'([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?'+LOC_CLOSE_TAG)
                        ),
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
            tpl
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
