YUI().add('ys/core/test', function(Y) {
	var suite = new Y.Test.Suite("Core");
	
	suite.add(
		new Y.Test.Case({

			name: "Core Global Environnement",
			
			testCoreGlobalInstances: function()
			{
				Y.assert(
					Y.ys.Controller
				);
				Y.assert(
					Y.ys.Coord
				);
			}
		})
	);
	
	suite.add(
		new Y.Test.Case({

			name: "Core Controller",
			
			setUp: function()
			{
				this.data = new Y.ys.Core();
				this.coord = this.data.loadRoutes([{
					path: "/yoshioka.js/unittests/",
					test: 1
				},
				{
					path: "/yoshioka.js/unittests/test",
					test: 2
				}]);
				this.data.dispatch();
			},
			tearDown: function()
			{
				this.data.destroy();
				this.coord.destroy();
			},
			testRoutes1: function()
			{
				this.wait(function()
				{
					Y.Assert.areEqual(
						1,
						this.coord.get('test')
					);
				}, 1000);
			},
			testRoutes2: function()
			{
				this.data.save('/yoshioka.js/unittests/test');
				
				this.wait(function()
				{
					Y.Assert.areEqual(
						2,
						this.coord.get('test')
					);
					Y.assert(
						window.location.href.match(
							/\/yoshioka\.js\/unittests\/test$/
						)
					);
				}, 1000);
			},
			testRoutes3: function()
			{
				this.data.save('/yoshioka.js/unittests/');
				this.wait(function()
				{
					Y.Assert.areEqual(
						1,
						this.coord.get('test')
					);
					Y.assert(
						window.location.href.match(
							/\/yoshioka\.js\/unittests\/$/
						)
					);
				}, 1000);
			}
		})
	);
	
	suite.add(
		new Y.Test.Case({

			name: "Core link Enhancer",
			
			setUp: function()
			{
				this.data = new Y.ys.Core();
				this.coord = this.data.loadRoutes([{
					path: "/yoshioka.js/unittests/",
					test: 1
				},
				{
					path: "/yoshioka.js/unittests/test",
					test: 2
				}]);
				this.data.dispatch();
			},
			tearDown: function()
			{
				this.data.destroy();
				this.coord.destroy();
			},
			testEnhanceLink: function()
			{
				var a = Y.Node.create(
					'<a href="/yoshioka.js/unittests/test"></a>'
				);
				this.data.enhance(a);
				
				a.simulate('click');
				
				this.wait(function()
				{
					Y.Assert.areEqual(
						'/yoshioka.js/unittests/test',
						this.data.getPath()
					);
				}, 200);
			},
			testEnhanceLink2: function()
			{
				var a = Y.Node.create(
					'<a href="/yoshioka.js/unittests/"></a>'
				);
				this.data.enhance(a);
				
				a.simulate('click');
				
				this.wait(function()
				{
					Y.Assert.areEqual(
						'/yoshioka.js/unittests/',
						this.data.getPath()
					);
				}, 200);
			}
		})
	);
	
	suite.add(
		new Y.Test.Case({

			name: "Core use method",
			
			setUp: function()
			{
				this.data = new Y.ys.Core();
			},
			tearDown: function()
			{
				this.data.destroy();
			},
			testUseWithCallback: function()
			{
				this.data.use(
					'ys/core',
					Y.bind(
						function(Y)
						{
							this._loaded = true
						},
						this
					)
				);
				this.wait(function()
				{
					Y.Assert.areEqual(
						true,
						this._loaded
					)
				}, 500);
			}
		})
	);
	
	Y.Test.Runner.add(suite);
}, '1.0', {requires: ["ys/core", "node", 'node-event-simulate']});
