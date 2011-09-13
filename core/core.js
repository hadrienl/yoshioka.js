YUI().add('core', function(Y) {
	
	var NS = 'ob.Core',
	
		Core = function()
		{
			Core.superclass.constructor.apply(this, arguments);
		};
	
	Y.namespace(NS).Coord = new Y.Model();
	
	Y.extend(Core, Y.Controller, {
		_updateAttrs: function(attrs, params)
		{
			Y.Object.each(
				attrs,
				function(v, k)
				{
					Y.ob.Core.Coord.addAttr(
						k, {}
					);
					
					if (Y.Lang.isObject(v))
					{
						v = this._substituteObj(v, params);
					}
					else if (Y.Lang.isString(v))
					{
						v = this._substitute(v, params);
					}
					
					Y.ob.Core.Coord.set(
						k,
						v
					);
				},
				this
			);
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
		}
	},
	{
		NAME: 'Core'
	});
	
	Y.namespace(NS).Controller = new Core({
		root: '/~hadrien/obv4pre/admin/' // remove that
	});
	
	Y.Array.each(
		Y.ob.routes,
		function(r)
		{
			Y.ob.Core.Controller.route(
				r.path,
				Y.bind(
					function(attrs, req)
					{
						this._updateAttrs(attrs, req.params);
					},
					Y.ob.Core.Controller,
					r
				)
			);
		}
	);
	
}, '1.0', {requires: ["controller", "model", "routes", "substitute", "core_api"]})