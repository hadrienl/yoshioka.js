YUI().add('ys_core', function(Y) {

	var NS = 'ys',

		Core = function()
		{
			Core.superclass.constructor.apply(this, arguments);
		};

	Y.namespace(NS).Core = Y.extend(Core, Y.Controller, {
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
		_substitute: function(v, params)
		{
			return Y.substitute(
				v,
				params
			);
		},
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
		 * Method to enhance a link to save its href to controller
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
						this._enhance(link)
					},
					this
				);
			}
		},
		_enhance: function(link)
		{
			link.on(
				'click',
				function(e, link)
				{
					if (e.button !== 1 || e.ctrlKey || e.metaKey) {
						return;
					}

					e.preventDefault();

					this.save(
						this.removeRoot(link.get('href'))
					);
				},
				this,
				link
			);
		},
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
			coord: {
				valueFn: function()
				{
					return new Y.Model();
				}
			}
		}
	});

	Y.namespace(NS).Controller = new (Y.namespace(NS).Core)();
	
	Y.namespace(NS).Coord = Y.namespace(NS).Controller.loadRoutes(Y[NS].routes);

	Y.namespace(NS).use = Y.namespace(NS).Controller.use;

}, '1.0', {requires: ["controller", "model", "ys_routes", "substitute", "ys_i18n"]})