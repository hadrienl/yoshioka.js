{
	"base": "/",
	"modules": {
		"ys_routes": {
			"path": "config/routes.js"
		},
		"ys_core": {
			"path": "yoshioka.js/core/core.js",
			"requires": ["controller", "model", "ys_routes", "substitute", "ys_i18n", "ys_view"]
		},
		"ys_i18n": {
			"path": "yoshioka.js/core/i18n.js",
			"requires": ["base"]
		},
		"ys_view": {
			"path": "yoshioka.js/core/view.js",
			"requires": ["view", "node", "get", "substitute"]
		}
	}
}
