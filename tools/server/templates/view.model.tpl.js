/**
 * {modelclass}
 * @module {module}
 * @requires model
 */
var

NS = '{appname}',

{modelclass} = function(config)
{
	{modelclass}.superclass.constructor.apply(this, arguments);
};

Y.namespace(NS).{modelclass} = Y.extend({modelclass}, Y.Model, {
	/**
	 * Set your model's methods
	 */
},
{
	NAME: '{modelclass}',
	ATTRS: {
		/**
		 * Set your model's attributes
		 * @attribute your_attribute
		 */
		your_attribute: {
			value: null
		}
	}
});
