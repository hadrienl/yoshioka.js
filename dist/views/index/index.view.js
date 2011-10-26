YUI().add('yourapp_index_view', function(Y) {

	var NS = 'yourapp',
	
		CLASS_USER = 'user',
		
		IndexView = function(config)
		{
			IndexView.superclass.constructor.apply(this, arguments);
		};
	
	/**
	 * Index view
	 */
	Y.namespace(NS).IndexView = Y.extend(IndexView, Y.ys.View, {
		template: {$index.tpl},
		
		renderUI: function()
		{
			this.container.append(
				this.compileTpl({
					class_user: CLASS_USER
				})
			);
			
		},
		bindUI: function()
		{
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
		NAME: 'IndexView',
		ATTRS: {
			user: {
				valueFn: function()
				{
					return new Y.yourapp.User();
				}
			}
		}
	});
	
}, '1.0', {requires: ["ys_view", "index_user_model", "io", "json", "css_index_skin"]})