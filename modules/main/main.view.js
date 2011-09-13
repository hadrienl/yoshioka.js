YUI().add('main_view', function(Y) {

	var NS = 'ys',
		
		CLASS_HEADER = 'header',
		CLASS_MAIN = 'main',
		CLASS_FOOTER = 'footer',
		
		MainView = function(config)
		{
			MainView.superclass.constructor.apply(this, arguments);
		};
	
	/**
	 * Main view
	 */
	Y.namespace(NS).MainView = Y.extend(MainView, Y.View, {
		template: {$main.tpl},
		
		/**
		 * Render main view :
		 * - append header view
		 * - append footer view
		 * - listen to Y.ob.Core.Coord 'mainviewChange' event to load it
		 */
		render: function()
		{
			var node = Y.Node.create(
				Y.substitute(
					this.template,
					{
						class_header: CLASS_HEADER,
						class_main: CLASS_MAIN,
						class_footer: CLASS_FOOTER
					}
				)
			);
			this.container.append(
				node
			);
			
			this._replaceView(
				'header',
				CLASS_HEADER
			);
			this._replaceView(
				'footer',
				CLASS_FOOTER
			);
			
			Y[NS].Core.Coord.after(
				['mainviewChange', 'mainview_paramsChange'],
				function()
				{
					/**
					 * MainView change
					 */
					this._replaceView(
						Y[NS].Core.Coord.get('mainview'),
						CLASS_MAIN,
						Y[NS].Core.Coord.get('mainview_params')
					);
				},
				this
			);
			
			return this.container;
		},
		_replaceView: function(name, place, params)
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
				
				view = null,
				self = this,
				viewname = '_view' + place,
				body = Y.one(document.body);
			
			params || (params = {});
			
			/**
			 * Check if new view is the same as the current
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
				 * Render new view
				 */
				Y.use(name, function(Y) {
					view = new Y[NS][classname](params);
					node.set('innerHTML', '');
					node.append(
						view.render()
					);
					self[viewname] = view;
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
		NAME: 'MainView'
	});
	
	Y.namespace(NS).MainView.CLASS_MAIN = CLASS_MAIN;
	Y.namespace(NS).MainView.CLASS_HEADER = CLASS_HEADER;
	Y.namespace(NS).MainView.CLASS_FOOTER = CLASS_FOOTER;
	
}, '1.0', {requires: ["view", "substitute", "main_skin"]})