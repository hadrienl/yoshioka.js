YUI().use(
	'ys_core',
	'node',
	YUI_config.app+'_'+YUI_config.mainview+'_view',
	function(Y)
{
	var NS = 'ys',
		body = Y.one(document.body),
		viewclass =
			Y.config.mainview.charAt(0).toUpperCase()+
			Y.config.mainview.slice(1)+
			'View',
		main = new Y[Y.config.app][viewclass]();

	body.set('innerHTML', '');
	body.append(
		main.render()
	);

	Y[NS].Controller.dispatch();
});
