{
	"base": "/",
	"modules": {
		"ys_routes": {
			"path": "config/routes.js"
		},
		"ys_core": {
			"path": "yoshioka.js/core/core.js",
			"requires": ["controller", "model", "ys_routes", "substitute", "ys_l10n"]
		},
		"ys_l10n": {
			"path": "yoshioka.js/core/l10n.js",
			"requires": ["base"]
		},
		"ys_view": {
			"path": "yoshioka.js/core/view.js",
			"requires": ["view", "get"]
		}
	}
}
