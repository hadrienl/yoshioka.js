YUI().use('core', 'node', 'main_view', function(Y) {

	var NS = 'ys',
		body = Y.one(document.body),
		main = new Y[NS].MainView();
	
	body.set('innerHTML', '');
	body.append(
		main.render()
	);

	Y[NS].Controller.dispatch();
});