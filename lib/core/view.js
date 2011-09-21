YUI().add('ys_view', function(Y) {

	var NS = 'ys',

		View = function(config)
		{
			View.superclass.constructor.apply(this, arguments);
		};

	Y.namespace(NS).View = Y.extend(View, Y.View, {

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
				 * View name
				 */
				view = null,
				/**
				 * Put this in a variable to use it in the new sandbox
				 */
				self = this,
				/**
				 * Define viewname
				 */
				viewname = '_view' + place,
				/**
				 * Get document body
				 */
				body = Y.one(document.body);

			params || (params = {});

			/**
			 * Check if new view is the same as the current
			 * to avoid re instanciate same class and reload the page
			 */
			if (this[viewname] &&
				this[viewname].constructor.NAME === classname)
			{
				/**
				 * Don't instanciate new view, just give new params to it
				 */
				this[viewname].setAttrs(params);
			}
			else
			{
				/**
				 * Add a wait class on body
				 */
				Y.one('html').addClass('_loading_view');

				/**
				 * Destroy previously instancied view
				 */
				this[viewname] && this[viewname].destroy();

				/**
				 * Load new view
				 */
				Y.use(module, function(Y) {

					try
					{
						var viewclass = Y.namespace(Y.config.app)[classname];

						/**
						 * Instanciate view
						 */
						view = new viewclass(params);

						/**
						 * Append view to the given node in main view
						 */
						node.append(
							view.render()
						);

						/**
						 * Save object
						 */
						self[viewname] = view;
					}
					catch (e)
					{
						self[viewname] = null;
						console.debug(e);
						console.debug(classname);

					}
				});

				/**
				 * Change html class for this place
				 */
				self.setHtmlClass(name, place);

				/**
				 * Remove wait class on body
				 */
				Y.one('html').removeClass('_loading_view');
			}
		},
		/**
		 * Add a classname to html tag to know which view is currently visible
		 */
		setHtmlClass: function(name, place)
		{
			var html = Y.one('html');
			Y.Array.each(
				html.get('className').split(' '),
				function(c)
				{
					var m = c.match('^'+place + '_(.*)$');
					if (m)
					{
						html.removeClass(place+'_'+m[1]);
					}
				}
			);
			html.addClass(place+'_'+name);
		}
	},
	{
		NAME: ['Y.',NS,'.View'].join('')
	});

}, '1.0', {requires: ["view"]});
