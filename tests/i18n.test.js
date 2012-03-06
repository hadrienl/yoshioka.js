YUI().add('i18n/en_US/hello', function(Y) {
    Y.namespace('ys.I18n.en_US').hello =
    {
        "world": 'Hello World!',
        "world.params": "Hello World @@param1@@ @@param2@@ !"
    };
});

YUI().add('i18n/fr_FR/hello', function(Y) {
    Y.namespace('ys.I18n.fr_FR').hello =
    {
        "world": 'Bonjour Monde !',
        "world.params": "Bonjour Monde @@param1@@ @@param2@@ !"
    };
});

/**
 * Yoshioka internationalization
 * @module ys/i18n/test
 * @requires ys/i18n
 */
var suite = new Y.Test.Suite("I18nManager");

Y.config.locales = [{
    "locale": "en_US",
    "sameas": ["en", "en_EN", "en_US", "en_UK"],
    "default": true
},
{
    "locale": "fr_FR",
    "sameas": ["fr", "fr_FR"]
}];

/**
 * Test I18nManager. The correct way to add locales in a DOM
 */
suite.add(
    new Y.Test.Case({

        name: "I18nManager",

        setUp: function()
        {
            this.data = Y.ys.I18nManager.localize(
                'hello~world'
            );

            Y.one(document.body).append(this.data);
        },
        tearDown: function()
        {
            this.data.remove();
        },
        testDefaultLocale: function()
        {
            Y.assert(
                (Y.ys.I18nManager.get('locale') === 'en_US') ||
                (Y.ys.I18nManager.get('locale') === 'fr_FR')
            );
        },
        testChangeLocale: function()
        {
            Y.ys.I18nManager.set('locale', 'en');

            Y.Assert.areEqual(
                'en_US',
                Y.ys.I18nManager.get('locale'),
                'Locale would be en_US'
            );

            Y.ys.I18nManager.set('locale', 'fr');

            Y.Assert.areEqual(
                'fr_FR',
                Y.ys.I18nManager.get('locale'),
                'Locale would be fr_FR'
            );

            Y.ys.I18nManager.set('locale', 'en_UK');

            Y.Assert.areEqual(
                'en_US',
                Y.ys.I18nManager.get('locale'),
                'Locale would be en_US'
            );

            Y.ys.I18nManager.set('locale', 'it');

            Y.Assert.areEqual(
                'en_US',
                Y.ys.I18nManager.get('locale'),
                'Locale would be en_US'
            );
        },
        testSpanInnerHTML : function ()
        {
            Y.ys.I18nManager.set('locale', 'en');

            Y.Assert.areEqual(
                'Hello World!',
                this.data.get('innerHTML')
            );
        },
        testSpanInnerHTMLAfterLocaleChange : function ()
        {
            Y.ys.I18nManager.set('locale', 'fr');

            Y.Assert.areEqual(
                'Bonjour Monde !',
                this.data.get('innerHTML')
            );
        }
    })
);

/**
 * Test string only
 */
suite.add(
    new Y.Test.Case({

        name: "I18nManager string mode",

        setUp: function()
        {
            var span;

            Y.ys.I18nManager.set('locale', 'en');

            span = Y.ys.I18nManager.localize(
                'hello~world',
                null,
                true
            );

            this._node = Y.Node.create(
                '<div id="test_locale">'+span+'</div>'
            );
            Y.one(document.body).append(
                this._node
            );
            this.data = this._node.one('span');
        },
        tearDown: function()
        {
            this._node.remove();
        },

        testSpanInnerHTML : function ()
        {
            Y.Assert.areEqual(
                'Hello World!',
                this.data.get('innerHTML')
            );
        },
        testSpanInnerHTMLAfterLocaleChange : function ()
        {
            Y.ys.I18nManager.set('locale', 'fr');
            Y.Assert.areEqual(
                'Bonjour Monde !',
                this.data.get('innerHTML')
            );
        }
    })
);

/**
 * Test I18n only
 */
suite.add(
    new Y.Test.Case({

        name: "I18n",

        setUp: function()
        {
            this.data = new Y.ys.I18nManager.I18n({
                    key: 'hello~world',
                    locale: 'en_US'
                });

            Y.one(document.body).append(this.data.localize());
        },
        tearDown: function()
        {
            this.data.destroy();
        },

        testSpanInnerHTML : function ()
        {
            Y.Assert.areEqual(
                'Hello World!',
                this.data.get('translation')
            );
        },
        testSpanInnerHTMLAfterLocaleChange : function ()
        {
            this.data.set('locale', 'fr_FR');
            Y.Assert.areEqual(
                'Bonjour Monde !',
                this.data.get('translation')
            );
        }
    })
);

/**
 * Test I18n with params
 */
suite.add(
    new Y.Test.Case({

        name: "I18n",

        setUp: function()
        {
            this.data = new Y.ys.I18nManager.I18n({
                    key: 'hello~world.params',
                    locale: 'en_US',
                    params: {param1:"p1",param2:"p2"}
                });

            Y.one(document.body).append(this.data.localize());
        },
        tearDown: function()
        {
            this.data.destroy();
        },

        testSpanInnerHTML : function ()
        {
            Y.Assert.areEqual(
                'Hello World p1 p2 !',
                this.data._insertTranslation()
            );
        },
        testSpanInnerHTMLAfterLocaleChange : function ()
        {
            this.data.set('locale', 'fr_FR');
            Y.Assert.areEqual(
                'Bonjour Monde p1 p2 !',
                this.data._insertTranslation()
            );
        }
    })
);


Y.Test.Runner.add(suite);
