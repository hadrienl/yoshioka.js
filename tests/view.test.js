/**
 * Yoshioka View
 * @module ys/view/test
 * @requires ys/view
 */
var suite = new Y.Test.Suite("View");

Y.config.app = 'core';

suite.add(
    new Y.Test.Case({

        name: "View",
        
        _should: {
            error: {
                testRender_withoutTpl: "No template given."
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
    
        testRender_withoutTpl : function ()
        {
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
        },
        
        testRender_withTemplate : function ()
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
        
        testRender_manualTemplate : function ()
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
        },
        
        testExtractSubTemplate: function()
        {
            var extracts;
            
            this.data.template = '<div><p>Global</p><div class="sub">Sub</div></div>';
            
            Y.Assert.areEqual(
                this.data.template,
                this.data.extractSubTemplate()[0]
            );
            
            extracts = this.data.extractSubTemplate(
                {
                    tpl: this.data.template
                },
                [{
                    selector: '.sub',
                    outer: true,
                    clean: true
                }]
            );
            Y.Assert.areEqual(
                '<div><p>Global</p></div>',
                extracts[0]
            );
            Y.Assert.areEqual(
                '<div class="sub">Sub</div>',
                extracts[1]
            );
            
            Y.Assert.areEqual(
                0,
                this.data.compileTpl({
                    tpl: extracts[0]
                }).all('div').size()
            );
            
            Y.Assert.areEqual(
                "Sub",
                this.data.compileTpl({
                    tpl: extracts[1]
                }).get('innerHTML')
            );
        }
    })
);

suite.add(
    new Y.Test.Case({

        name: "View Getters",
        
        setUp: function()
        {
            this.data = new Y.ys.View();
            this.data.template = '<div class="main"></div>';
            Y.one(document.body).append(this.data.render());
        },
        tearDown: function()
        {
            this.data.destroy();
        },
    
        testGetCurrentView : function ()
        {
            Y.namespace('core').TestView = Y.ys.View;
            
            Y.namespace('core').TestView.prototype.template = '<div>Hello World</div>';
            
            Y.Env._used['core/views/test'] = true;
            
            this.data.setView(
                'test',
                'main'
            );
            
            this.wait(function()
            {
                Y.Assert.areEqual(
                    "Hello World",
                    this.data.getCurrentView('main')
                        .container.one('div').get('innerHTML')
                );
                
                Y.Assert.isNull(
                    this.data.getCurrentView('kikoo')
                );
            }, 200);
        }
    })
);

Y.Test.Runner.add(suite);