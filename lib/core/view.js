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
			var modulename = [Y.config.app, '_',
				this.constructor.NAME.toLowerCase().
					replace('view', '_view')].join(''),
				module = Y.config.groups.ob.modules[modulename],
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
		 * Remove all css links of this view
		 */
		destructor: function()
		{
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
			var path = [Y.config.groups.ob.base,
				Y.config.groups.ob.modules[modulename].path].join(''),
				style = Y.one(['link[href="', path, '"]'].join(''));

			if (unload)
			{
				style.remove();

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
		setView: function(name, place, params)
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
					function()
					{
						this.setView(name, place, params);
					}
				);
				return;
			}
			this._setView(name, place, params);
		},
		_setView: function(name, place, params)
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
				classname = [
					name.charAt(0).toUpperCase(),
					name.slice(1),
					'View'].join(''),
				/**
				 * Module name
				 */
				module = [Y.config.app, '_', name, '_', 'view'].join(''),
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
				Y.use(module, Y.bind(
					function(classname, params, node, Y)
					{
						try
						{
							var viewclass =
								Y.namespace(Y.config.app)[classname],
								/**
								 * Instanciate view
								 */
								view = new viewclass(params);


							/**
							 * Destroy previously instancied view
							 */
							if (this._currentview[place])
							{
								this._currentview[place].destroy();
							}

							/**
							 * Append view to the given node in main view
							 */
							node.append(
								view.render()
							);

							/**
							 * Save object
							 */
							this._currentview[place] = view;
						}
						catch (e)
						{
							this._currentview[place] = null;
							Y.log(e);
						}

						this._loading[place] = false;
					},
					this,
					classname,
					params,
					node
				));

				/**
				 * Remove wait class on body
				 */
				Y.one('html').removeClass('_loading_view');
			}
		}
	},
	{
		NAME: ['Y.',NS,'.View'].join('')
	});

}, '1.0', {requires: ["view", "get"]});
