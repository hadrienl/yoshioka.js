/**
 * @module yourapp/views/index/tests/user
 * @requires yourapp/views/index/models/user
 */
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
