/**
 * Yoshioka Core
 * @module ys/core/test
 * @requires ys/core, node, node-event-simulate
 */
var suite = new Y.Test.Suite("Core");

suite.add(
    new Y.Test.Case({

        name: "Core Global Environnement",
        
        testCoreGlobalInstances: function()
        {
            Y.assert(
                Y.ys.Router
            );
            Y.assert(
                Y.ys.Coord
            );
        }
    })
);

suite.add(
    new Y.Test.Case({

        name: "Core Router",
        
        setUp: function()
        {
            this.prevpath = (window.location.hash &&
                    window.location.hash.replace('#', '')) ||
                window.location.pathname;
            
            this.data = new Y.ys.Core();
            this.coord = this.data.loadRoutes([{
                path: "/__unittests/framework",
                test: 1
            },
            {
                path: "/__unittests/framework/test",
                test: 2
            }]);
            
            this.data.save('/__unittests/framework');
            
            this.data.dispatch();
        },
        tearDown: function()
        {
            this.data.save(this.prevpath);
            
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
            this.data.save('/__unittests/framework/test');
            
            this.wait(function()
            {
                Y.Assert.areEqual(
                    2,
                    this.coord.get('test')
                );
                Y.assert(
                    window.location.href.match(
                        /\/__unittests\/framework\/test$/
                    )
                );
            }, 1000);
        },
        testRoutes3: function()
        {
            this.data.save('/__unittests/framework');
            this.wait(function()
            {
                Y.Assert.areEqual(
                    1,
                    this.coord.get('test')
                );
                Y.assert(
                    window.location.href.match(
                        /\/__unittests\/framework$/
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
            this.prevpath = (window.location.hash &&
                    window.location.hash.replace('#', '')) ||
                window.location.pathname;
            
            this.data = new Y.ys.Core();
            this.coord = this.data.loadRoutes([{
                path: "/__unittests/framework",
                test: 1
            },
            {
                path: "/__unittests/framework/test",
                test: 2
            }]);
            this.data.dispatch();
            
            this._event = null;
        },
        tearDown: function()
        {
            this.data.save(this.prevpath);
            
            this.data.destroy();
            this.coord.destroy();
            
            this._event && this._event.detach();
        },
        testEnhanceLink: function()
        {
            var a = Y.Node.create(
                '<a href="/__unittests/framework/test"></a>'
            );
            this.data.enhance(a);
            
            a.simulate('click');
            
            this.wait(function()
            {
                Y.Assert.areEqual(
                    '/__unittests/framework/test',
                    this.data.getPath()
                );
            }, 200);
        },
        testEnhanceLink2: function()
        {
            var a = Y.Node.create(
                '<a href="/__unittests/framework"></a>'
            );
            this.data.enhance(a);
            
            a.simulate('click');
            
            this.wait(function()
            {
                Y.Assert.areEqual(
                    '/__unittests/framework',
                    this.data.getPath()
                );
            }, 200);
        },
        testPreventPathChange: function()
        {
            var a = Y.Node.create('<a></a>');
            this.data.enhance(a);
            
            this.data.save('/__unittests/framework');
            
            this.wait(function()
            {
                Y.Assert.areEqual(
                    '/__unittests/framework',
                    this.data.getPath()
                );

                a.setAttribute('href', '/__unittests/framework/test');

                this._event = this.data.on(
                    'pathchange',
                    function(e)
                    {
                        e.preventDefault();
                    }
                );
                
                a.simulate('click');
                
                this.wait(function()
                {
                    Y.Assert.areEqual(
                        '/__unittests/framework',
                        this.data.getPath()
                    );
                    
                    this._event.detach();
                    
                    a.simulate('click');
                    
                    this.wait(function()
                    {
                        Y.Assert.areEqual(
                            '/__unittests/framework/test',
                            this.data.getPath()
                        );
                        
                    }, 500);
                    
                }, 500);
                
            }, 500);
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
