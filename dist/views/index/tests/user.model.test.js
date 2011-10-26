YUI().add('index_user_model_test', function(Y) {
	var suite = new Y.Test.Suite("User");
	
	suite.add(
		new Y.Test.Case({

			name: "User",
		
			setUp: function()
			{
				this.data = new Y.yourapp.User({
					name: 'Steve'
				});
			},
			tearDown: function()
			{
				this.data.destroy();
			},
		
			testName : function ()
			{
				Y.Assert.areEqual(
					'Steve',
					this.data.get('name'),
					"Value must be 'Steve'"
				);
			}
		})
	);
	
	Y.Test.Runner.add(suite);
}, '1.0', {requires: ["index_user_model"]});
