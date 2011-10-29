YUI().add('ys/view/test', function(Y) {
	var suite = new Y.Test.Suite("View");
	
	Y.config.app = 'core';
	
	suite.add(
		new Y.Test.Case({

			name: "View",
			
			_should: {
				error: {
					testRender1: "No template given."
				}
			},
			
			setUp: function()
			{
				this.data = new Y.ys.View();
			},
			tearDown: function()
			{
				this.data.destroy();
			},
		
			testRender1 : function ()
			{
				this._node = this.data.render();
				Y.one(document.body).append(this._node);
				
				Y.Assert.areEqual(
					'<div></div>',
					this.data.container.get('innerHTML')
				);
			},
			
			testRender2 : function ()
			{
				this.data.template = '<p>Test</p>';
				this._node = this.data.render();
				Y.one(document.body).append(this._node);
				
				Y.Assert.areEqual(
					1,
					this.data.container.all('p').size()
				);
				Y.Assert.areEqual(
					'Test',
					this.data.container.all('p').get('innerHTML')
				);
			},
			
			testRender3 : function ()
			{
				this.data.template = '<p>Test</p>';
				this.data.renderUI = function()
				{
					this.container.append(this.compileTpl({
						tpl: '<p>Test</p><p>yoshioka</p>'
					}));
				};
				this._node = this.data.render();
				Y.one(document.body).append(this._node);
				
				Y.Assert.areEqual(
					2,
					this.data.container.all('p').size()
				);
				Y.Assert.areEqual(
					'yoshioka',
					this.data.container.all('p').item(1).get('innerHTML')
				);
			}
		})
	);
	
	Y.Test.Runner.add(suite);
}, '1.0', {requires: ["ys/view"]});
