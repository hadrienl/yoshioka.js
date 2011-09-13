YUI().use('core', 'node', 'main_view', function(Y) {

	var NS = 'ob',
		body = Y.one(document.body),
		main = new Y.ob.MainView();
	
	body.set('innerHTML', '');
	body.append(
		main.render()
	);

	Y[NS].Core.Controller.dispatch();
});