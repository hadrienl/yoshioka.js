YUI().add('main_user_model', function(Y) {
	
	var
	NS = 'yourapp',
	
	User = function(config)
	{
		User.superclass.constructor.apply(this, arguments);
	};
	
	Y.namespace(NS).User = Y.extend(User, Y.Model, {
		
	},
	{
		ATTRS: {
			name: {
				value: 'Anonymous'
			}
		}
	});
	
}, '1.0', {requires: ["model"]});