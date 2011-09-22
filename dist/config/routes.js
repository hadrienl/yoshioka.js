YUI().add('ys_routes', function(Y) {

	var NS = 'ys'

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
