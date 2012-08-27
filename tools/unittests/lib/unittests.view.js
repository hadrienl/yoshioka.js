/**
 * Unit tests View
 * @module ys/views/unittests
 * @requires ys/view, json
 */
var

NS = 'ys',

YTR = Y.Test.Runner,

STATUS_NONE = '',
STATUS_SUCCESS = 'success',
STATUS_FAIL = 'fail',

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
    
    _tests: null,
    _running: false,
    
    renderUI: function()
    {
        var modules = this.get('modules'),
            container = this.get('container'),
            tests_suites;
        
        UnittestsView.superclass.renderUI.apply(this, arguments);
        
        tests_suites = container.one('.tests_suites');
        
        this._tests = [];
        
        Y.each(
            modules,
            function(m)
            {
                if (!m.module) return;
                var test = new UnittestsSuiteSubview({
                    module: m.module
                });
                tests_suites.append(test.render());
                
                this._tests.push(test);
            },
            this
        );
    },
    
    bindUI: function()
    {
        Y.each(
            this._tests,
            function(t)
            {
                t.after(
                    ['statsChange', 'complete'],
                    this.syncUI,
                    this
                );
            },
            this
        );
        
        this.get('container').one('.runall').on(
            'click',
            this.runAll,
            this
        )
    },
    
    syncUI: function()
    {
        var container = this.get('container'),
            header = container.one('.header'),
            nbtests = 0,
            nbcases = 0,
            nbsuites = 0,
            status = STATUS_NONE;
        
        Y.each(
            this._tests,
            function(t)
            {
                nbsuites += t.get('nbsuites');
                nbcases += t.get('nbcases');
                nbtests += t.get('nbtests');
                
                if (t.get('status') === STATUS_FAIL)
                {
                    status = STATUS_FAIL;
                }
                if (status !== STATUS_FAIL &&
                    t.get('status') === STATUS_SUCCESS)
                {
                    status = STATUS_SUCCESS;
                }
            }
        );
        
        header.one('.summary').set(
            'innerHTML',
            nbtests+' tests in '+nbcases+' cases in '+nbsuites+' suites.'
        );
        
        header.removeClass(STATUS_FAIL);
        header.removeClass(STATUS_SUCCESS);
        header.addClass(status);
    },
    
    runAll: function()
    {
        if (this._running !== false)
        {
            return;
        }
        this.get('container').one('.runall').setAttribute('disabled', true);
        this._running = 0;
        this._next();
    },
    
    _next: function()
    {
        var test = this._tests[this._running];
        if (!test)
        {
            return this._stop();
        }
        
        test.once(
            'complete',
            function(result)
            {
                this._readResult(result);
                this._running++;
                this._next();
            },
            this
        );
        test.run();
    },
    
    _stop: function()
    {
        var report = {
            failed: 0
        };
        
        this._running = false;
        this.get('container').one('.runall').removeAttribute('disabled');
        
        /**
         * Send the report
         */
        Y.each(
            this._tests,
            function(t)
            {
                if (t.get('status') === STATUS_FAIL)
                {
                    report.failed = 1;
                }
            }
        );
        this.complete(report);
        
    },
    
    _readResult: function(result)
    {
        //console.debug('result', result);
        
    },
    
    complete: function()
    {
        // do nothing
    }
},
{
    NAME: 'UnittestsView',
    ATTRS: {
        template: {
            value: '<div>'+
'   <div class="header">'+
'      <h1>UnitTests</h1>'+
'       <p>'+
'           <span class="summary"></span>'+
'           <button class="runall">Run all the tests</button>'+
'       </p>'+
'   </div>'+
'   <div class="tests_suites"></div>'+
'</div>'
        },
        modules: {
            valueFn: Array,
            validator: function(v)
            {
                return Y.Lang.isArray(v);
            },
            setter: function(v)
            {
                var o = {};
                
                Y.each(
                    v,
                    function(val, k)
                    {
                        o[val] = {
                            module: val,
                            nbsuites: 0,
                            nbcases: 0,
                            nbtests: 0
                        };
                    }
                );
                
                return o;
            }
        }
    }
});

/**
 * UnittestsSuiteSubview
 * @class UnittestsSuiteSubview
 * @namespace Y.ys
 * @extend Y.ys.View
 */
Y.namespace(NS).UnittestsSuiteSubview = Y.extend(
    UnittestsSuiteSubview, Y.ys.View, {
    
    _ready: false,
    _testsstarted: 0,
    
    renderUI: function()
    {
        var container = this.get('container');
        
        UnittestsSuiteSubview.superclass.renderUI.apply(this, arguments);
        
        container.setAttribute(
            'id',
            this.get('module').replace(/[^a-zA-Z0-9]/g, '-')
        );
    },
    
    bindUI: function()
    {
        var container = this.get('container'),
            iframe = container.one('iframe'),
            module = this.get('module');
        
        container.one('.run').on(
            'click',
            this.run,
            this
        );
        
        container.one('a').purge();
        
        Y.one(window).on(
            'message',
            function(e)
            {
                var container = this.get('container'),
                    iframe = container.one('iframe'),
                    data = e._event.data;
                
                try
                {
                    data = Y.JSON.parse(data);
                }
                catch (e)
                {
                    console && console.error(e);
                    return;
                }
                
                if (!data.from ||
                    data.from !==
                        window.location.protocol+'//'+
                        window.location.host+this.get('location'))
                {
                    return;
                }
                
                if (data.message === 'stats')
                {
                    return this._testIsReady(data.data);
                }
                else if (data.message === 'error')
                {
                    return this._testIsComplete('error');
                }
                else if (data.message === 'complete')
                {
                    return this._testIsComplete('complete', data.data);
                }
                else if (data.message === 'test')
                {
                    this._testsstarted++;
                    return this.syncUI();
                }
            },
            this
        );
    },
    
    syncUI: function()
    {
        var container = this.get('container');
            aname = container.one('.name'),
            module = this.get('module'),
            name = this.get('name') || module,
            run = container.one('.run'),
            status = this.get('status'),
            nbtests = this.get('nbtests'),
            progress = container.one('.progress');
        
        aname.setAttribute('href', '#'+container.getAttribute('id'));
        aname.set('innerHTML', name);
        
        container.removeClass(STATUS_FAIL);
        container.removeClass(STATUS_SUCCESS);
        status && container.addClass(status);
        
        if (nbtests)
        {
            progress.setStyle(
                'width', (this._testsstarted / nbtests * 100)+'%'
            )
        }
    },
    
    run: function()
    {
        var container = this.get('container'),
            iframe = container.one('iframe');
        
        container.one('.run').setAttribute('disabled', true);
        this._testsstarted = 0;
        this.syncUI();
        
        iframe.setAttribute('src', this.get('location'));
    },
    _testIsReady: function(data)
    {
        var container = this.get('container'),
            iframe = container.one('iframe'),
            nbsuites = 0,
            nbcases = 0,
            nbtests = 0;
        
        Y.Array.each(
            data,
            function(suite)
            {
                nbsuites++;
                
                nbcases+=suite.nbcases;
                nbtests+=suite.nbtests;
            }
        );
        
        this.set('nbsuites', nbsuites);
        this.set('nbcases', nbcases);
        this.set('nbtests', nbtests);
        
        this.fire('statsChange');
        
        this.set('status', STATUS_NONE);
        
        iframe._node.contentWindow.postMessage(
            Y.JSON.stringify({
                message: 'run'
            }),
            '*'
        );
    },
    
    _testIsComplete: function(state, data)
    {
        var container = this.get('container');
        
        if (state === 'error' ||
            data.failed)
        {
            this.set('status', STATUS_FAIL);
        }
        else
        {
            if (data.results.failed)
            {
                this.set('status', STATUS_FAIL);
            }
            else if (data.results.ignored)
            {
                this.set('status', STATUS_NONE);
            }
            else
            {
                this.set('status', STATUS_SUCCESS);
            }
        }
        container.one('.run').removeAttribute('disabled');
        this._testsstarted = 0;
        
        this._displayResults(data && data.results);
        
        container.one('iframe').insert(
            Y.Node.create('<iframe></iframe>'),
            'after'
        );
        container.one('iframe').remove(true);
        
        window.location.hash = container.getAttribute('id');
        
        this.syncUI();
        
        this.fire('complete', {state: state, data: data});
    },
    
    _displayResults: function(results)
    {
        var container = this.get('container'),
            details = container.one('.details');
        
        details.set('innerHTML', '');
        
        if (!results)
        {
            details.set('innerHTML', '<li>Syntax Error. Watch your console.</li>')
        }
        
        Y.each(
            results,
            function(r)
            {
                var node, ol;
                
                if (Y.Lang.isObject(r))
                {
                    node = Y.Node.create(
                        '<li class="case"><span class="name">'+
                        r.name +
                        '</span>'+
                        '<span class="count">'+
                        r.total + ' test' + (r.total > 1 ? 's' : '') +
                        '</span>'+
                        '<span class="duration">' + r.duration + 'ms</span>'+
                        '<ol></ol></li>'
                    );
                    
                    if (r.failed)
                    {
                        node.addClass('failed');
                    }
                    if (r.ignored)
                    {
                        node.addClass('ignored');
                    }
                    if (r.passed)
                    {
                        node.addClass('passed');
                    }
                    
                    ol = node.one('ol');
                    
                    /**
                     * Reading each assertions
                     */
                    Y.Object.each(
                        r,
                        function(v, k)
                        {
                            var li;
                            
                            if (k.match(/^test/))
                            {
                                li = Y.Node.create(
                                    '<li class="unic"><span class="name">'+
                                    v.name +
                                    '</span>'+
                                    '<span class="message">'+
                                    v.message.replace(/\n/g, '<br />') +
                                    '</span>'+
                                    '<span class="duration">' + v.duration + 'ms</span>'
                                );

                                if (v.result === 'pass')
                                {
                                    li.addClass('passed');
                                }
                                else if (v.result === 'fail')
                                {
                                    li.addClass('failed');
                                }
                                else
                                {
                                    li.addClass('ignored');
                                }
                                
                                ol.append(li);
                            }
                        }
                    );
                    details.append(node);
                }
            }
        );
    }
},
{
    NAME: 'UnittestsSuiteSubview',
    ATTRS: {
        template: {
            value: '<div class="test">'+
'   <div class="progress"></div>'+
'   <div class="ctn">'+
'       <span class="btn"><button class="run">Run</button></span>'+
'       <a href="#" class="name"></a>'+
'   </div>'+
'   <ol class="details"></ol>'+
'   <iframe class="test"></iframe>'+
'</div>'
        },
        module: {
            validator: function(v)
            {
                return Y.Lang.isString(v);
            }
        },
        name: {
            value: '',
            validator: function(v)
            {
                return Y.Lang.isString(v);
            }
        },
        location: {
            valueFn: function()
            {
                return '/__unittests/'+this.get('module');
            }
        },
        nbsuites: {
            value: 0,
            validator: function(v)
            {
                return Y.Lang.isNumber(v);
            }
        },
        nbcases: {
            value: 0,
            validator: function(v)
            {
                return Y.Lang.isNumber(v);
            }
        },
        nbtests: {
            value: 0,
            validator: function(v)
            {
                return Y.Lang.isNumber(v);
            }
        },
        status: {
            value: STATUS_NONE,
            validator: function(v)
            {
                return (STATUS_NONE === v ||
                        STATUS_SUCCESS === v ||
                        STATUS_FAIL === v);
            }
        }
    }
});
