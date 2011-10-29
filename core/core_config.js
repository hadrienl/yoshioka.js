{
	"base": "/",
	"modules": {
		"ys/routes": {
			"path": "config/routes.js"
		},
		"ys/core": {
			"path": "yoshioka.js/core/core.js",
			"requires": ["controller", "model", "ys/routes", "substitute", "ys/i18n", "ys/view"]
		},
		"ys/i18n": {
			"path": "yoshioka.js/core/i18n.js",
			"requires": ["base"]
		},
		"ys/view": {
			"path": "yoshioka.js/core/view.js",
			"requires": ["view", "node", "get", "substitute"]
		}
	}
}
