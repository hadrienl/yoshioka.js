/**
 * Unit tests View
 * @module ys/views/unittests
 * @requires ys/view
 */
var

NS = 'ys',

YTR = Y.Test.Runner,

UnittestsView = function(config)
{
    UnittestsView.superclass.constructor.apply(this, arguments);
},
UnittestsSuiteSubview = function(config)
{
    UnittestsSuiteSubview.superclass.constructor.apply(this, arguments);
};

/**
 * UnittestsView
 * @class UnittestsView
 * @namespace Y.ys
 * @extend Y.ys.View
 */
Y.namespace(NS).UnittestsView = Y.extend(UnittestsView, Y.ys.View, {
    
    template: '<div>'+
'   <h1>UnitTests</h1>'+
'   <p>'+
'       <button class="runall">Run all tests</button>'+
'   </p>'+
'   <ul class="tests_suites"></ul>'+
'</div>',
    
    _suiteviews: null,

    initializer: function()
    {
        UnittestsView.superclass.initializer.apply(this, arguments);
        
        this._suiteviews = [];
    },
    
    bindUI: function()
    {
        this.container.one('.runall').on(
            'click',
            this.run,
            this
        );
    },
    
    syncUI: function()
    {
        Y.Array.each(
            YTR.masterSuite.items,
            function(suite)
            {
                var v = new Y.ys.UnittestsSuiteSubview({
                    suite: suite
                });
                
                this.container.one('.tests_suites').append(
                    v.render()
                );
                
                this._suiteviews.push(v);
            },
            this
        );
    },
    
    run: function()
    {
        var i = 0,
            suites = this._suiteviews,
            results = {
                duration: 0,
                failed: 0,
                ignored: 0,
                passed: 0,
                total: 0
            },
            next = Y.bind(
                function()
                {
                    if (YTR._lastResults)
                    {
                        results.duration += YTR._lastResults.duration;
                        results.failed += YTR._lastResults.failed;
                        results.ignored += YTR._lastResults.ignored;
                        results.passed += YTR._lastResults.passed;
                        results.total += YTR._lastResults.total;
                    }
                    if (suites[i])
                    {
                        YTR.once(
                            'testsuitecomplete',
                            function()
                            {
                                next();
                            }
                        );
                        Y.later(1, suites[i], function()
                        {
                            this.run();
                        });
                    }
                    else
                    {
                        this.complete(results);
                    }
                    i++;
                },
                this
            );
        
        next();
    },
    complete: function(results)
    {
        console.debug('FINISHED !')
        console.debug(results);
    }
},
{
    NAME: 'UnittestsView'
});

/**
 * UnittestsSuiteSubview
 * @class UnittestsSuiteSubview
 * @namespace Y.ys
 * @extend Y.ys.View
 */
Y.namespace(NS).UnittestsSuiteSubview = Y.extend(UnittestsSuiteSubview, Y.ys.View, {
    
    template: '<li>'+
'   <div class="ctn">'+
'       <span class="name">{name}</span>'+
'       <span class="btn"><button class="run">Run</button></span>'+
'   </div>'+
'   <ol class="details"></ol>'+
'</li>',
    
    _suiteviews: null,
    
    renderUI: function()
    {
        var suite = this.get('suite');
        
        this.container.append(
            this.compileTpl({
                name: suite.name
            })
        );
    },
    
    bindUI: function()
    {
        this.container.one('.run').on(
            'click',
            this.run,
            this
        );
    },
    
    _events: null,
    run: function()
    {
        if (YTR.isRunning())
        {
            return;
        }
        
        YTR.clear();
        YTR.add(this.get('suite'));
        
        this._detachEvents();
        
        this._events.push(
            YTR.on(
                ['fail', 'pass', 'ignore'],
                function(e)
                {
                    this._displayTest(e);
                },
                this
            )
        );
        
        this._events.push(
            YTR.once(
                'complete',
                function(e)
                {
                    this._displayResults(e.results);
                },
                this
            )
        );
        this._clearResults();
        this.container.addClass('running');
        
        YTR.run();
    },
    
    _detachEvents: function()
    {
        Y.Array.each(
            this._events,
            function(e)
            {
                e.detach();
            }
        );
        this._events = [];
    },
    
    _clearResults: function()
    {
        this.container.one('.details').set('innerHTML', '');
        this.container.removeClass('passed');
        this.container.removeClass('failed');
        this.container.removeClass('ignored');
        this.container.removeClass('running');
        this.container.one('.run').set('innerHTML', '…');
    },
    _displayTest: function(test)
    {
        console.debug(test);
        
        var details = this.container.one('.details'),
            li = Y.Node.create(
                Y.substitute(
                    '<li>'+
                    '   <p class="name">'+
                    '       <span class="testcase">{testcase}</span>'+
                    '       <span class="testname">{testname}</span>'+
                    '       <span class="result">{result}</span>'+
                    '   </p>'+
                    '</li>',
                    {
                        testcase: test.testCase.name,
                        testname: test.testName,
                        result: test.type
                    }
                )
            );
        
        if (test.type === 'fail')
        {
            li.append(
                Y.Node.create(Y.substitute(
                    '<div><p>'+
                    '   <span class="name">{name}</span> :'+
                    '   <span class="message">{message}</span>'+
                    '</p>'+
                    '<p>'+
                    '   <span class="actual">actual :{actual}</span>'+
                    '</p>'+
                    '<p>'+
                    '   <span class="expected">expected :{expected}</span>'+
                    '</p></div>',
                    {
                        name: test.error.name,
                        message: test.error.message,
                        actual: test.error.actual,
                        expected: test.error.expected
                    }
                ))
            );
        }
        
        li.addClass(test.type);
    
        details.append(li);
    },
    _displayResults: function(results)
    {
        var suite = this.get('suite'),
            details = this.container.one('.details');
        
        this._detachEvents();
        
        this.container.one('.run').set('innerHTML', 'Run');
        
        if (results.failed === 0 &&
            results.ignored === 0)
        {
            this.container.addClass('passed');
            return;
        }
        
        if (results.failed > 0)
        {
            this.container.addClass('failed');
        }
        
        if (results.ignored > 0)
        {
            this.container.addClass('ignored');
        }
    }
},
{
    NAME: 'UnittestsSuiteSubview',
    ATTRS: {
        suite: {
            
        }
    }
});
