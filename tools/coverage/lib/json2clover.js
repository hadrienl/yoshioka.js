(function(){

var

Json2Clover = function(data)
{
	Json2Clover.prototype.init.apply(this, arguments);
};

Json2Clover.prototype = {
	
	_data: null,
	
	init: function(data)
	{
		if ('string' === typeof data)
		{
			data = JSON.parse(data);
		}
		this._data = data;
	},
	
	toClover: function()
	{
		var ts = (new Date()).getTime(),
			xml =
'<?xml version="1.0" encoding="UTF-8"?>'+
'<coverage generated="'+ts+'">'+
'	<project timestamp="'+ts+'">',
			f;

		for (var i in this._data)
		{
			xml += '<package name="'+i+'">';
			xml += '<file name="'+this._data[i].path+'">';
			
			// Get classes names
			f = this._data[i].functions;
			for (var j in f)
			{
				if (j.match(/^[A-Z]+/))
				{
					xml += '<class name="'+j.replace(/\:.*$/, '')+'">';
					xml += '</class>';
				}
			}
			
			// Get lines
			f = this._data[i].lines;
			for (j in f)
			{
				xml += '<line num="'+j+'" type="stmt" count="'+f[j]+'"/>';
			}
			
			// Metrics
			xml += '<metrics loc="308" ncloc="185" classes="1"';
			this._data[i].coveredFunctions &&
				(xml += ' methods="'+this._data[i].coveredFunctions+'"');
			this._data[i].calledFunctions &&
				(xml += ' coveredmethods="'+this._data[i].calledFunctions+'"');
			this._data[i].coveredLines &&
				(xml += ' statements="'+this._data[i].coveredLines+'"');
			this._data[i].calledLines &&
				(xml += ' coveredstatements="'+this._data[i].calledLines+'"/>');
			
			xml += '</file>';
			xml += '</package>';
		}

		xml +=
'	</coverage>'+
'</coverage>';

		return xml;
	}
};

exports.Json2Clover = Json2Clover;

})();