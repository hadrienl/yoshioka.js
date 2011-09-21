YUI().add('ys_l10n', function(Y) {
	
	var NS = 'ys',
		
		/**
		 * L10n object for an unique translation
		 */
		L10n = function(config)
		{
			L10n.superclass.constructor.apply(this, arguments);
		},
		/**
		 * Manager of all translation in the app
		 */
		L10nManager = function(config)
		{
			L10nManager.superclass.constructor.apply(this, arguments);
		};
	
	Y.extend(L10n, Y.Base, {
		
		initializer: function(config)
		{
			/**
			 * Add new attrs for each params in the params attr
			 * and call insertTranslation method on one of them change
			 */
			if (config.params)
			{
				Y.Object.each(
					config.params,
					function(v, k)
					{
						this.addAttr(k, {broadcast: 1});
						this.after(
							[k, 'Change'].join(''),
							function()
							{
								this.insertTranslation();
							},
							this
						);
					},
					this
				);
				
				this.setAttrs(config.params);
			}
			
			/**
			 * After locale change, call the changeLanguage method to update the
			 * node
			 */
			this.after(
				'localeChange',
				function(e)
				{
					this.getLocalizedString();
				}
			);
			
			/**
			 * Set translation in node asynchronously
			 */
			this.after(
				'translationChange',
				function(e)
				{
					this.insertTranslation();
				}
			);
		},
		
		/**
		 * Load the translations file, and get the localized string from the key
		 * Call is asynchronized, so it will update `translation` attr when
		 * it'll be load, and so, fire `translationChange`event.
		 */
		getLocalizedString: function()
		{
			var raw_key = this.get('key').split(/~/),
				module = raw_key ? raw_key[0] : null,
				key = raw_key ? raw_key[1] : null,
				locale = this.get('locale'),
				name = ['l10n_', locale, '_', module].join(''),
				self = this;
			
			if (!module)
			{
				throw 'module~key invalid';
			}
			
			/**
			 * Load the translation file module
			 */
			YUI().use(name, function(Y2) {
				
				try
				{
					/**
					 * Copy the module class in the main Y object
					 */
					var t = Y.namespace('ys.L10n.'+locale)[module] =
						Y2.ys.L10n[locale][module][key];
					
					/**
					 * Update `translation` attr
					 */
					self.set(
						'translation',
						t
					);
				}
				catch (e)
				{
					/**
					 * Display an error in console if present
					 */
					if (console)
					{
						var err = ['Locale ', key, ' is not available in locale "', locale, '"'].join('');
						console.error (
							err
						);
					}
				}
			});
		},
		
		/**
		 * Get a localized string from key
		 * key has the form : 'module~key'
		 */
		localize: function(tostring)
		{
			var node;
			
			/**
			 * Load the locale
			 */
			this.getLocalizedString()
			
			/**
			 * Create the string node
			 */
			node = ['<span id="', this.get('id'), '">',
				this.get('translation'),
				'</span>'
			].join('');
			
			/**
			 * Create a node from the string
			 */
			if (tostring !== true)
			{
				node = Y.Node.create(node);
				this.set('node', node);
			}
			/**
			 * If tostring is true, a string will returned instead of a Node
			 * object. It's usefull for templates not already instancied.
			 */
			
			return node;
		},
		
		
		/**
		 * Get node from attr or from dom
		 */
		getNode: function()
		{
			var node = this.get('node');
			
			if (!node)
			{
				/**
				 * No node set, try to get it in DOM from the ID given to the
				 * string node
				 */
				node = Y.one('#'+this.get('id'));
			}
			
			return node;
		},
		/**
		 * Replace translation string with uptodate params in the node span
		 * container
		 */
		insertTranslation: function()
		{
			var node = this.getNode()
				t = this.get('translation');
			
			t = t.replace(
				/@@(.*?)@@/gi,
				Y.bind(
					function(a, b)
					{
						var v = this.get(b);
						return v ? v : '';
					},
					this
				),
				t
			);
			
			if (node)
			{
				node.set(
					'innerHTML',
					t
				);
			}
			
			return t;
		}
	},
	{
		NAME: 'L10n',
		ATTRS: {
			/**
			 * A random GUID generated at the instanciation
			 */
			id: {
				valueFn: function()
				{
					return Y.guid();
				}
			},
			/**
			 * Language code for the translation
			 */
			locale: {
				value: null,
				broadcast: 1
			},
			/**
			 * Translation key
			 */
			key: {
				value: null
			},
			/**
			 * Container node
			 */
			node: {
				
			},
			/**
			 * Translation text
			 */
			translation: {
				value: '',
				broadcast: 1
			}
		}
	});
	
	Y.extend(L10nManager, Y.Base, {
		
		initializer: function()
		{
			/**
			 * Bind locale change event to set all the instancied L10n locale
			 */
			this.after(
				'localeChange',
				function()
				{
					var keys = this.get('keys'),
						locale = this.get('locale');
					
					Y.Object.each(
						keys,
						function(l10n)
						{
							if (l10n)
							{
								l10n.set('locale', locale);
							}
						}
					);
				}
			);
		},
		
		/**
		 * Get a localized string from key
		 * key has the form : 'module~key'
		 */
		localize: function(key, params, tostring)
		{
			var keys = this.get('keys'),
				el = this.createKey(key, params);
			
			params || (params = {});

			return el.localize(tostring);
		},
		
		/**
		 * Create a new key
		 */
		createKey: function(key, params)
		{
			var l10n = new L10n({
					key: key,
					locale: this.get('locale'),
					params: params
				}),
				keys = this.get('keys');
			
			keys[l10n.get('id')] = l10n;
			
			this.set('keys', keys);
			
			return l10n;
		}
	},
	{
		NAME: 'L10nManager',
		ATTRS: {
			/**
			 * Global language configuration
			 */
			locale: {
				value: 'fr',
				broadcast: 1
			},
			/**
			 * Collection of l10n objects
			 */
			keys: {
				valueFn: Object
			}
		}
	});
	
	/**
	 * Instanciate new L10nManager in the ys namespace
	 */
	Y.namespace(NS).L10nManager = new L10nManager();
	
	/**
	 * Create a usefull global function : __()
	 * @param {string} key Translation key
	 * @param {object} param Object of params to give to the locale
	 * @param {boolean} tostring Do you want a Node or a string ?
	 */
	window.__ = function(key, params, tostring)
	{
		return Y.ys.L10nManager.localize(key, params, tostring);
	};
	
	// TMP
	Y.one(document.body).on(
		'click',
		function(e)
		{
			var m = Y.ys.L10nManager, l10n;
			
			Y.Object.some(
				m.get('keys'),
				function(k)
				{
					return ((l10n = k).get('key') === 'header~link.home');
				}
			);
			
			l10n.set('click', l10n.get('click')+1);
		}
	);
	
}, '1.0', {requires: ["base"]});
