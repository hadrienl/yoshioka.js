/**
 * Yoshioka View
 * @module ys/view/test
 * @requires ys/view, node-event-simulate
 */
var suite = new Y.Test.Suite("View");

Y.config.ys_app = 'core';

suite.add(
    new Y.Test.Case({

        name: "View",
        
        setUp: function()
        {
            this.data = new Y.ys.View();
        },
        tearDown: function()
        {
            this.data.destroy();
        },
        
        testRender_withTemplate : function ()
        {
            this.data.set('template', '<p>Test</p>');
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                1,
                this.data.get('container').all('p').size()
            );
            Y.Assert.areEqual(
                'Test',
                this.data.get('container').all('p').get('innerHTML')
            );
        },
        
        testRender_templateWithParams_old: function ()
        {
            this.data.set('template', '<p>Test</p>');
            this.data.renderUI = function()
            {
                this.get('container').append(this._compile({
                    tpl: '<p>Test</p><p>yoshioka</p>'
                }));
            };
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                2,
                this.data.get('container').all('p').size()
            );
            Y.Assert.areEqual(
                'yoshioka',
                this.data.get('container').all('p').item(1).get('innerHTML')
            );
        },
        
        testRender_templateWithParams: function ()
        {
            this.data.set('template', '<p>Test{foo}</p>');
            this.data.set('compile_params.foo', 'bar');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'Testbar',
                this.data.get('container').all('p').item(0).get('innerHTML')
            );
            
            this.data.set('compile_params.foo', 'bie');
            
            this._node = this.data.render();
            
            Y.Assert.areEqual(
                'Testbie',
                this.data.get('container').all('p').item(0).get('innerHTML')
            );
        },
        
        testRender_templateWithLocales: function ()
        {
            Y.ys.I18nManager._locales = {
                en_US: {
                    "foo.bar": 'Hello World!'
                }
            };
            Y.ys.I18nManager.set('locale', 'en_US');
            
            this.data.set('template', '<p>{@foo~bar@}</p>');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            Y.Assert.areEqual(
                'Hello World!',
                this.data.get('container').all('p').item(0).get('innerText')
            );
        },
        
        testRender_templateWithLocalesAndParams: function ()
        {
            Y.ys.I18nManager._locales = {
                en_US: {
                    "foo.bar": 'Cake is a @@locale_param@@',
                    "bar.foo": 'hello @@var@@'
                }
            };
            Y.ys.I18nManager.set('locale', 'en_US');
            
            this.data.set('template', '<p>{@foo~bar{"locale_param":"{tpl_param}"}@}</p>');
            this.data.set('compile_params.tpl_param', 'lie');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'Cake is a lie',
                this.data.get('container').all('p').item(0).get('innerText')
            );
            
            Y.one(document.body).set('innerHTML', '');
            
            // Static param value
            
            this.data.set('template', '<p>{@bar~foo{"var": "world"}@}</p>');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'hello world',
                this.data.get('container').all('p').item(0).get('innerText')
            );
        },
        
        testRender_templateWithLocalesAndParams_specific: function()
        {
            Y.ys.I18nManager._locales = {
                en_US: {
                    "foo.title": 'the title',
                    "foo.title2": 'the other title',
                    "foo.text": "my text with @@variable@@"
                }
            };
            Y.ys.I18nManager.set('locale', 'en_US');
            
            this.data.set('template',
                '<h2>'+
                '	{@foo~title@}'+
                '</h2>'+
                '<div class="premium">'+
                '	<div class="disclaimer">'+
                '		<h3 class="title">{@foo~title2@}</h3>'+
                '		<div class="bugwashere">{@foo~text{"variable": "my variable"}@}</div>'+
                '	</div>'+
                '	<form>'+
                '	    <ul class="controls settings-list unstyled"></ul>'+
                '	</form>'+
                '</div>'
            );
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'my text with my variable',
                this.data.get('container').one('.bugwashere').get('innerText')
            );
        },
        
        testRender_templateWithParamsInLocaleKey: function()
        {
            Y.ys.I18nManager._locales = {
                en_US: {
                    "foo.bar.var1": 'variable one',
                    "foo.bar.var2": 'variable two'
                }
            };
            Y.ys.I18nManager.set('locale', 'en_US');
            
            this.data.set('template', '<p>{@foo~bar.{variable}@}</p>');
            this.data.set('compile_params.variable', 'var1');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'variable one',
                this.data.get('container').all('p').item(0).get('innerText')
            );
            
            Y.one(document.body).set('innerHTML', '');
            
            // Change param value
            this.data.set('compile_params.variable', 'var2');
            
            this._node = this.data.render();
            Y.one(document.body).append(this._node);
            
            Y.Assert.areEqual(
                'variable two',
                this.data.get('container').all('p').item(0).get('innerText')
            );
        },
        
        testExtractSubTemplate: function()
        {
            var extracts;
            
            this.data.set('template', '<div><p>Global</p><div class="sub">Sub</div></div>');
            
            Y.Assert.areEqual(
                this.data.get('template'),
                this.data.extractSubTemplate()[0]
            );
            
            extracts = this.data.extractSubTemplate(
                {
                    tpl: this.data.get('template')
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
                this.data._compile({
                    tpl: extracts[0]
                }).all('div').size()
            );
            
            Y.Assert.areEqual(
                "Sub",
                this.data._compile({
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
            this.data.set('template', '<div class="main"></div>');
            Y.one(document.body).append(this.data.render());
        },
        tearDown: function()
        {
            this.data.destroy();
        },
        
        testGetCurrentView : function ()
        {
            var TestView = function(config)
            {
                TestView.superclass.constructor.apply(this, arguments);
            };
            
            Y.namespace('core').TestView = Y.extend(TestView, Y.ys.View, {
                
            },
            {
                NAME: 'TestView',
                ATTRS: {
                    template: {
                        value: '<div>Hello World</div>'
                    }
                }
            });
            
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
                        .get('container').one('div').get('innerHTML')
                );
                
                Y.Assert.isNull(
                    this.data.getCurrentView('kikoo')
                );
            }, 200);
        }
    })
);

suite.add(
    new Y.Test.Case({

        name: "View Binding",
        
        setUp: function()
        {
            var TestView = Y.Base.create('TestView', Y.ys.View, [], {
                test: 1,
                _bindUI: function()
                {
                    var container = this.get('container');
                    this.storeEvent(
                        container.on(
                            'click',
                            function()
                            {
                                this.get('container').one('.main').set('innerHTML', this.test);
                            },
                            this
                        )
                    );
                }
            }, {
                ATTRS: {
                    template: {
                        value: '<div class="main"></div>'
                    }
                }
            });
            this.data = new TestView();
            Y.one(document.body).append(this.data.render());
        },
        tearDown: function()
        {
            this.data.destroy();
        },
    
        testBindUI: function ()
        {
            var container = this.data.get('container');
            
            Y.Assert.areEqual(
                '',
                container.one('.main').get('innerHTML'),
                'Must call the click callback'
            );
            
            container.simulate('click');
            
            Y.Assert.areEqual(
                '1',
                container.one('.main').get('innerHTML'),
                'Must call the click callback'
            );
            
            this.data.test = 2;
            container.simulate('click');
            
            Y.Assert.areEqual(
                '2',
                container.one('.main').get('innerHTML'),
                'Must call the click callback'
            );
        },
        
        testUnbindUI: function ()
        {
            var container = this.data.get('container');
            
            container.simulate('click');
            
            Y.Assert.areEqual(
                '1',
                container.one('.main').get('innerHTML'),
                'Must call the click callback'
            );
            
            this.data.unbindUI();
            
            this.data.test = 2;
            container.simulate('click');
            
            Y.Assert.areEqual(
                '1',
                container.one('.main').get('innerHTML'),
                'Must do nothing'
            );
            
            this.data.bindUI();
            this.data.bindUI();
            this.data.bindUI();
            container.simulate('click');
            
            Y.Assert.areEqual(
                '2',
                container.one('.main').get('innerHTML'),
                'Must call the click callback again'
            );
        }
    })
);

Y.Test.Runner.add(suite);
