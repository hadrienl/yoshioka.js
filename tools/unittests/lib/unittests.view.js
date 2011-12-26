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
'       <span class="summary"></span>'+
'       <button class="runall">Run all the tests</button>'+
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
        var tests = null,
            nbsuites = 0,
            nbcases = 0,
            nbtests = 0;
        
        YTR.masterSuite.items.sort(function(a, b)
        {
            return (a.name.toLowerCase() < b.name.toLowerCase()) ?
                -1 : 1;
        });
        
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
                
                // Count data
                nbsuites++;
                nbcases += suite.items.length;
                
                Y.Array.each(
                    suite.items,
                    function(item)
                    {
                        Y.Object.each(
                            item,
                            function(v, k)
                            {
                                if (k.match(/^test/))
                                {
                                    nbtests++;
                                }
                            }
                        );
                    }
                );
            },
            this
        );
        
        this.container.one('.summary').set(
            'innerHTML',
            nbtests+' tests in '+nbcases+' cases in '+nbsuites+' suites.'
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
Y.namespace(NS).UnittestsSuiteSubview = Y.extend(
    UnittestsSuiteSubview, Y.ys.View, {
    
    template: '<li>'+
'   <div class="ctn">'+
'       <span class="name">{name}</span>'+
'       <span class="btn"><button class="run">Run</button></span>'+
'   </div>'+
'   <ol class="details"></ol>'+
'</li>',
    
    _suiteviews: null,
    _nbtests: 0,
    _progress: 0,
    
    initializer: function()
    {
        var suite = this.get('suite'),
            nbtests = 0;
        
        UnittestsSuiteSubview.superclass.initializer.apply(this, arguments);
        
        // Count nb tests
        Y.Array.each(
            suite.items,
            function(item)
            {
                Y.Object.each(
                    item,
                    function(v, k)
                    {
                        if (k.match(/^test/))
                        {
                            nbtests++;
                        }
                    }
                );
            }
        );
        this._nbtests = nbtests;
    },
    
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
        
        // progress bar
        this._progress = 1;
        this._setProgress();
    },
    _setProgress: function()
    {
        var width = 2000,// background image width
            ctn = this.container.one('.ctn'),
            reg = ctn.get('region'),
            progress = this._progress / this._nbtests * 100,
            position = -(width);
        
        position = width - reg.width * progress / 100;
        
        this.container.one('.ctn').setStyle(
            'backgroundPosition',
            '-'+position+'px 0'
        );
    },
    _displayTest: function(test)
    {
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
                        actual: test.error.actual || 'null',
                        expected: test.error.expected || 'null'
                    }
                ))
            );
        }
        
        li.addClass(test.type);
    
        details.append(li);
        
        // progress bar
        this._progress++;
        this._setProgress();
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
