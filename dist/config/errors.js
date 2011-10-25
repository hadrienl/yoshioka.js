YUI().add('errors', function(Y) {
	Y.one(window).on(
		'error',
		function(e)
		{
			var err = e._event,
				error = {
					type: err.type,
					filename: err.filename,
					lineno: err.lineno,
					timeStamp: err.timeStamp,
					message: err.message
				},
				img = new Image();
			
			img.src = '/logerror?' + Y.JSON.stringify(error);
		}
	);
}, '1.0', {requires: ["node", "json"]});