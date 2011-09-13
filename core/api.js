YUI().add('core_api', function(Y) {
	
	var NS = 'ob.Core',
	
		Api = function()
		{
			Api.superclass.constructor.apply(this, arguments);
		};
	
	Y.extend(Api, Y.Base, {
		
		request: function(config, callback)
		{
			return Y.io(
				this._formatUri(config),
				{
					on: {
						success: function(id, data, args)
						{
							callback(data);
						},
						failure: function(id, data)
						{
							this._failure(data);
						}
					},
					context: this,
					arguments: callback
				}
			);
		},
		
		_formatUri: function(config)
		{
			var uri = this.get('api');
			
			return uri + Y.QueryString.stringify(config);
		},
		
		_failure: function(data)
		{
			console.error(data.statusText);
			this.failure(data)
		},
		
		failure: function()
		{
			console.debug('bouh');
			
		}
	},
	{
		NAME: 'API',
		ATTRS: {
			api: {
				getter: function()
				{
					return Y.config.api;
				}
			}
		}
	});
	
	Y.namespace(NS).API = new Api();
	
}, '1.0', {requires: ["base", "io", "querystring"]})