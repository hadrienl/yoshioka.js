/**
 * @module {module}
 * @requires {requires}
 */
var suite = new Y.Test.Suite("{viewclass}");

suite.add(
	new Y.Test.Case({

		name: "Test {viewclass}",
	
		setUp: function()
		{
			this.data = new Y.{appname}.{viewclass}();
		},
		tearDown: function()
		{
			this.data.destroy();
		},
	
		testSomething : function ()
		{
			Y.assert(
				!Y.Lang.isUndefined(this.data)
			);
		}
	})
);

Y.Test.Runner.add(suite);
