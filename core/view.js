YUI().add('ys_view', function(Y) {

	var NS = 'ys',

		View = function(config)
		{
			View.superclass.constructor.apply(this, arguments);
		};

	Y.namespace(NS).View = Y.extend(View, Y.View, {

		_css_modules: null,

		/**
		 * Current view in place
		 */
		_currentview: null,
		/**
		 * Current state in place
		 */
		_loading: null,

		/**
		 * Scan all css modules in requires and load them if needed
		 */
		initializer: function()
		{
			var modulename = Y.config.app+'_'+
				this.constructor.NAME.toLowerCase().replace('view', '_view'),
				module = Y.config.groups[YUI_config.app].modules[modulename],
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
						this.loadCssModule(
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
		 */
		render: function()
		{
			this.renderUI();
			this.bindUI();
			this.syncUI();
			
			return this.container();
		},
		/**
		 * Render the template and append nodes in this.container node
		 */
		renderUI: function()
		{
			this.container.append(this.compileTpl());
		},
		/**
		 * Bind event listener to this.container DOM
		 */
		bindUI: function()
		{
			
		},
		/**
		 * Update this.container DOM nodes
		 */
		syncUI: function()
		{
			
		},
		
		/**
		 * Remove all css links of this view
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
						this.unloadCssModule(
							[r]
						);
					}
				},
				this
			);

		},
		/**
		 * Load a css link by its path
		 */
		loadCssModule: function(modulename, unload)
		{
			var path = Y.config.groups[YUI_config.app].base+
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
		 */
		unloadCssModule: function(modulename)
		{
			this.loadCssModule(modulename, true);
		},
		
		/**
		 * Return a Node compiled template
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
			
			return Y.Node.create(
				Y.substitute(
					tpl,
					params
				)
			);
		},
		
		/**
		 * Append a view to a node in the container view with params
		 * @param {string} name View name.
		 * 		The module and classname will be defined from this name :
		 * 		module : {app}_name_view
		 * 		classname : Y.yourapp.NameView
		 * 			(yourapp is configured in default_config `app` param)
		 * @param {string} place A CSS classname representing the element where
		 *		to append the view in the main container
		 * @param {Object} params Parameters to give to the view's constructor
		 * @example this.setView('articleslist', 'main', {type: 'published'})
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
		_setViewCallback: function(classname, params, node, place, callback)
		{
			var viewclass =
				Y[Y.config.app][classname],
				/**
				 * Instanciate view
				 */
				view = new viewclass(params);

			/**
			 * Destroy previously instancied view
			 */
			this.removeCurrentView(place, view);

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
		removeCurrentView: function(place, view)
		{
			if (this._currentview[place])
			{
				this._currentview[place].remove();
			}
			this._currentview[place] = view;
		},
		remove: function()
		{
			this.destroy();
		}
	},
	{
		NAME: 'Y.'+NS+'.View'
	});

}, '1.0', {requires: ["view", "node", "get", "substitute"]});
