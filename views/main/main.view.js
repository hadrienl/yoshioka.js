YUI().add('main_view', function(Y) {

	var NS = 'ys',
		
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
		 * - listen to Y.ys.Coord 'mainviewChange' event to load it
		 */
		render: function()
		{
			var node = this.template;
			
			this.container.append(node);
			
			return this.container;
		}
	},
	{
		NAME: 'MainView'
	});
	
}, '1.0', {requires: ["view", "substitute", "main_skin"]})