/**
 * View
 * @module ys_view
 * @requires view, node, get, substitute
 */
YUI().add('ys_view', function(Y) {

	var NS = 'ys',

		View = function(config)
		{
			View.superclass.constructor.apply(this, arguments);
		};
	
	/**
	 * Y.ys.View extends Y.View and add it all the magic of yoshioka. With this
	 * view, you can dynamically load other views and construct your interface.
	 * You can use templates, locales, load and unload css.
	 * @class View
	 * @namespace Y.ys
	 * @extend Y.View
	 * @constructor
	 */
	Y.namespace(NS).View = Y.extend(View, Y.View, {
		
		/**
		 * List of loaded css modules
		 * @attribute _css_modules
		 * @private
		 */
		_css_modules: null,

		/**
		 * Current view in place
		 * @attribute _currentview
		 * @private
		 */
		_currentview: null,
		/**
		 * Current state in place
		 * @attribute _loading
		 * @private
		 */
		_loading: null,

		/**
		 * Scan all css modules in requires and load them if needed
		 * @method initializer
		 * @protected
		 */
		initializer: function()
		{
			var modulename = Y.config.app+'_'+
				this.constructor.NAME.toLowerCase().replace('view', '_view'),
				module = Y.config.groups[Y.config.app].modules[modulename],
				requires = module ? module.requires : null;

			/**
			 * Init collections
			 */
			this._currentview = {};
			this._loading = {};

			if (!requires)
			{
				return;
			}

			this._css_modules = [];

			Y.Array.each(
				requires,
				function(r)
				{
					if (r.match(/^css_/))
					{
						this._loadCssModule(
							[r]
						);
						this._css_modules[this._css_modules.length] = r;
					}
				},
				this
			);
		},
		
		/**
		 * Render method is the main method that you have to use.
		 * It will render the template in the node container,
		 * bind the event of the view,
		 * then sync the content.
		 * The container will be returned to be appened on a parent node.
		 * @method render
		 * @public
		 * @retun Y.Node
		 */
		render: function()
		{
			this.renderUI();
			this.bindUI();
			this.syncUI();
			
			return this.container;
		},
		/**
		 * Render the template and append nodes in this.container node
		 * @method renderUI
		 * @protected
		 */
		renderUI: function()
		{
			this.container.append(this.compileTpl());
		},
		/**
		 * Bind event listener to this.container DOM
		 * @method bindUI
		 * @protected
		 */
		bindUI: function()
		{
			
		},
		/**
		 * Update this.container DOM nodes
		 * @method syncUI
		 * @protected
		 */
		syncUI: function()
		{
			
		},
		
		/**
		 * Remove all css links of this view
		 * method destructor
		 * @protected
		 */
		destructor: function()
		{
			View.superclass.destructor.apply(this);
			
			Y.Array.each(
				this._css_modules,
				function(r)
				{
					if (r.match(/^css_/))
					{
						this._unloadCssModule(
							[r]
						);
					}
				},
				this
			);

		},
		/**
		 * Load a css link by its path
		 * @method _loadCssModule
		 * @param {string} modulename Name of the CSS module
		 * @param {boolean} unload True if you want to unload the module
		 * @protected
		 */
		_loadCssModule: function(modulename, unload)
		{
			var path;
			
			if (!Y.config.groups[YUI_config.app].modules[modulename])
			{
				throw new Error("Module "+modulename+" does not exists.")
			}
			path = Y.config.groups[YUI_config.app].base+
				Y.config.groups[YUI_config.app].modules[modulename].path,
				style = Y.one('link[href="'+path+'"]');

			if (unload)
			{
				style && style.remove();

				Y.Env._used[modulename] = null;
			}
			else
			{
				if (!style)
				{
					Y.Get.css(path);

					Y.Env._used[modulename] = true;
				}
			}
		},
		/**
		 * Unload a css link by its path
		 * @method _unloadCssModule
		 * @param {string} modulename Name of the CSS module
		 * @protected
		 */
		_unloadCssModule: function(modulename)
		{
			this._loadCssModule(modulename, true);
		},
		
		/**
		 * Return a Node compiled template
		 * @method compileTpl
		 * @param {object} params Object of parameters :
		 * <dl>
		 *		<dt>tpl</dt>
		 * 		<dd>Alternative template</dd>
		 *		<dt>Ohter parameters</dt>
		 *		<dd>…are given to Y.substitute method to replace `{name}`
		 *		keywords into template</dd>
		 * </dl>
		 * @public
		 * @return Y.Node
		 * @throws {Error} when no template is given
		 */
		compileTpl: function(params)
		{
			var tpl = (params && params.tpl) || this.template,
				node,
				locales = tpl.match(
					/\{@([a-zA-Z0-9\-\_\~\.]+)(\{.+?\})?@\}/gi
				);
			
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
				Y.ys.Controller.enhance(node.all('a'));
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
		 * 	<p>The module and classname will be defined from this name :</p>
		 * 	<dl>
		 * 		<dt>module</dt>
		 * 		<dd>app\_name\_view</dd>
		 * 		<dt>classname</dt>
		 * 		<dd>Y.yourapp.NameView (yourapp is configured in default_config
		 * 		`app` param)</dd>
		 * 	</dl>
		 * @param {string} place A CSS classname representing the element where
		 * to append the view in the main container
		 * @param {Object} params Config to give to the view's constructor
		 * @param {function} callback A callback function to execute after
		 * the view's module has been loaded
		 * @example <pre>
		 *this.setView(
		 *	'articleslist',
		 *	'main',
		 *	{
		 *		type: 'published'
		 *	}
		 *);</pre>
		 * @public
		 */
		setView: function(name, place, params, callback)
		{
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
			this._setView(name, place, params, callback);
		},
		/**
		 * The real view setter ! When queue is free, the hard work can begin.
		 * @method _setView
		 * @protected
		 */
		_setView: function(name, place, params, callback)
		{
				/**
				 * Get the node corresponding to the place given
				 */
			var node = this.container.one('.'+place),
				/**
				 * Construct the object classname from the name param
				 * will get 'NameView' for 'name' param, so the view must be
				 * a 'NameView' Object in a 'name' module
				 */
				classname = name.charAt(0).toUpperCase()+name.slice(1)+'View',
				/**
				 * Module name
				 */
				module = Y.config.app+'_'+name+'_'+'view',
				/**
				 * Put this in a variable to use it in the new sandbox
				 */
				self = this;

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
						this._setViewCallback,
						this,
						classname,
						params,
						node,
						place,
						callback
					)
				);

				/**
				 * Remove wait class on body
				 */
				Y.one('html').removeClass('_loading_view');
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
		 * throws {Error} If the view class does not exists. You _MUST_ declare
		 * a Y.yourapp.NameView class extending Y.ys.View
		 */
		_setViewCallback: function(classname, params, node, place, callback)
		{
			var viewclass =
				Y[Y.config.app][classname],
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
					"This view does not exists. You must declare a "+
					"`Y."+Y.config.app+"."+classname+"` class in a "+
					"`"+Y.config.app+"_"+
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
				callback(view);
			}
			else
			{
				node.append(
					view.render()
				);
			}

			this._loading[place] = false;
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
		}
	},
	{
		NAME: 'Y.'+NS+'.View'
	});

}, '1.0', {requires: ["view", "node", "get", "substitute"]});
