YUI().add('ys_i18n', function(Y) {
	
	var NS = 'ys',
		
		DEFAULT_LOCALE = 'en_US',
		
		/**
		 * I18n object for an unique translation
		 */
		I18n = function(config)
		{
			I18n.superclass.constructor.apply(this, arguments);
		},
		/**
		 * Manager of all translation in the app
		 */
		I18nManager = function(config)
		{
			I18nManager.superclass.constructor.apply(this, arguments);
		};
	
	/**
	 * Whitelisting the DOMNodeRemovedFromDocument event to use it on
	 * I18n's node destruction
	 */
	Y.mix(Y.Node.DOM_EVENTS, {
	    DOMNodeRemovedFromDocument: true
	});
	
	Y.extend(I18n, Y.Base, {
		
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
							k+'Change',
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
				name = 'i18n_'+locale+'_'+module,
				self = this;
			
			if (!module)
			{
				throw new Error('module~key invalid');
			}
			
			/**
			 * Load the translation file module
			 */
			YUI().use(name, function(Y2) {
				
				try
				{
					Y[NS] = Y2.merge(
						Y[NS],
						Y2[NS]
					);
					/**
					 * Copy the module class in the main Y object
					 */
					var t = Y[NS].I18n[locale][module][key];
					
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
					Y.log('Locale '+key+' is not available in locale "'+locale+'"');
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
			node = '<span id="'+this.get('id')+'">'+
				this.get('translation')+
				'</span>';
			
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
				this.set('node', node);
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
		},
		
		destructor: function()
		{
			var node = this.get('node');
			if (node)
			{
				Y.Event.purgeElement(node, true);
				node.remove();
			}
		}
	},
	{
		NAME: 'I18n',
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
				setter: function(n)
				{
					if (n)
					{
						n.on(
							'DOMNodeRemovedFromDocument',
							function()
							{
								this.set('node', null);
								this.destroy();
							},
							this
						)
					}
					return n;
				}
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
	
	Y.extend(I18nManager, Y.Base, {
		
		initializer: function()
		{
			/**
			 * Set initial locale from browser environement
			 */
			this.set(
				'locale',
				navigator.language || navigator.userLanguage || DEFAULT_LOCALE
			);
			console.error(this.get('locale'))
			
			/**
			 * Bind locale change event to set all the instancied I18n locale
			 */
			this.after(
				'localeChange',
				function()
				{
					var keys = this.get('keys'),
						locale = this.get('locale');
					
					Y.Object.each(
						keys,
						function(I18n)
						{
							if (I18n)
							{
								I18n.set('locale', locale);
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
			var i = new I18n({
					key: key,
					locale: this.get('locale'),
					params: params
				}),
				keys = this.get('keys');
			
			keys[i.get('id')] = i;
			
			this.set('keys', keys);
			
			return i;
		}
	},
	{
		NAME: 'I18nManager',
		ATTRS: {
			/**
			 * Global language configuration
			 */
			locale: {
				value: DEFAULT_LOCALE,
				setter: function(locale)
				{
					var found = false,
						dft = DEFAULT_LOCALE;
					
					/**
					 * Look into config if asked locale is available
					 */
					if (Y.config.locales)
					{
						Y.Array.some(
							Y.config.locales,
							function(l)
							{
								if (l.sameas)
								{
									Y.Array.some(
										l.sameas,
										function(s)
										{
											if (s === locale)
											{
												locale = l.locale;
												found = true;
												return found;
											}
										}
									);
								}
								if (true === l.default)
								{
									dft = l.locale
								}
								return found;
							}
						);
					}
					
					if (!found)
					{
						locale = dft;
					}
					
					return locale;
				},
				broadcast: 1
			},
			/**
			 * Collection of I18n objects
			 */
			keys: {
				valueFn: Object
			}
		}
	});
	
	/**
	 * Instanciate new I18nManager in the ys namespace
	 */
	Y.namespace(NS).I18nManager = new I18nManager();
	Y.namespace(NS).I18nManager.I18n = I18n;
	/**
	 * Create a usefull global function : __()
	 * @param {string} key Translation key
	 * @param {object} param Object of params to give to the locale
	 * @param {boolean} tostring Do you want a Node or a string ?
	 */
	window.__ = function(key, params, tostring)
	{
		return Y.ys.I18nManager.localize(key, params, tostring);
	};
	
}, '1.0', {requires: ["base"]});
