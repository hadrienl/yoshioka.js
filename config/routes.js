YUI().add('routes', function(Y) {
	
	var NS = 'ob'
	
	/**
	 * Routes definition
	 */
	Y.namespace(NS).routes = [
		{
			path: '/',
			mainview: 'home'
		}
	];
});
