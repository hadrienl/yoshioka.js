/**
 * {viewclass} view
 * @module {module}
 * @requires ys/view
 */
var NS = '{appname}',
	
	{viewclass} = function(config)
	{
		{viewclass}.superclass.constructor.apply(this, arguments);
	};

/**
 * {view} view
 * @class {viewclass}
 * @namespace Y.{appname}
 * @constructor
 */
Y.namespace(NS).{viewclass} = Y.extend({viewclass}, Y.ys.View, {
	template: {${view}.tpl}
},
{
	/**
	 * @attribute NAME
	 */
	NAME: '{viewclass}'
});
