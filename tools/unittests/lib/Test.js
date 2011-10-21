YUI().add('l10n_en_hello', function(Y) {
	Y.namespace('ys.L10n.en').hello =
	{
		"world": 'Hello World!'
	};
});

YUI().add('l10n_fr_hello', function(Y) {
	Y.namespace('ys.L10n.fr').hello =
	{
		"world": 'Bonjour Monde !'
	};
});

YUI().add('ys_test', function(Y) {
	var suite = new Y.Test.Suite("TestSuite Yoshioka");
	
	/**
	 * Test L10nManager. The correct way to add locales in a DOM
	 */
	suite.add(
		new Y.Test.Case({

			name: "TestCase L10nManager",
		
			setUp: function()
			{
				Y.ys.L10nManager.set('locale', 'en');
				
				this.data = Y.ys.L10nManager.localize(
					'hello~world'
				);
				
				Y.one(document.body).append(this.data);
			},
			tearDown: function()
			{
				this.data.remove();
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
				Y.ys.L10nManager.set('locale', 'fr');
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

			name: "TestCase L10nManager string mode",
		
			setUp: function()
			{
				var span;
				
				Y.ys.L10nManager.set('locale', 'en');
				
				span = Y.ys.L10nManager.localize(
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
				Y.ys.L10nManager.set('locale', 'fr');
				Y.Assert.areEqual(
					'Bonjour Monde !',
					this.data.get('innerHTML')
				);
			}
		})
	);
	
	/**
	 * Test L10n only
	 */
	suite.add(
		new Y.Test.Case({

			name: "TestCase L10n",
		
			setUp: function()
			{
				this.data = new Y.ys.L10nManager.L10n({
						key: 'hello~world',
						locale: 'en'
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
				this.data.set('locale', 'fr');
				Y.Assert.areEqual(
					'Bonjour Monde !',
					this.data.get('translation')
				);
			}
		})
	);
	
	Y.Test.Runner.add(suite);
}, '1.0', {requires: ["ys_l10n"]});
