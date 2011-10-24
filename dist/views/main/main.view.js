YUI().add('yourapp_main_view', function(Y) {

	var NS = 'yourapp',
	
		CLASS_USER = 'user',
		
		MainView = function(config)
		{
			MainView.superclass.constructor.apply(this, arguments);
		};
	
	/**
	 * Main view
	 */
	Y.namespace(NS).MainView = Y.extend(MainView, Y.ys.View, {
		template: {$main.tpl},
		
		/**
		 * Render main view :
		 * - append header view
		 * - append footer view
		 * - listen to Y.ys.Coord 'mainviewChange' event to load it
		 */
		renderUI: function()
		{
			this.container.append(
				this.compileTpl({
					class_user: CLASS_USER
				})
			);
			
			Y.io(
				'/api',
				{
					method: 'post',
					data: JSON.stringify({
						method: 'getUser',
						id: 1
					}),
					on: {
						success: function(id, data)
						{
							var data = JSON.parse(data.responseText);
							
							this.get('user').setAttrs(
								data
							);
							this.syncUI();
						}
					},
					context: this
				}
			)
			
			return this.container;
		},
		syncUI: function()
		{
			var user = this.get('user');
			
			this.container.one('.'+CLASS_USER).set(
				'innerHTML',
				user.get('name')
			);
		}
	},
	{
		NAME: 'MainView',
		ATTRS: {
			user: {
				valueFn: function()
				{
					return new Y.yourapp.User();
				}
			}
		}
	});
	
}, '1.0', {requires: ["ys_view", "main_user_model", "io", "json", "css_main_skin"]})