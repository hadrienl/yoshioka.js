{
	"base": "/",
	"modules": {
		"ys_routes": {
			"path": "config/routes.js"
		},
		"ys_core": {
			"path": "lib/core/core.js",
			"requires": ["controller", "model", "ys_routes", "substitute", "ys_l10n"]
		},
		"ys_l10n": {
			"path": "lib/core/l10n.js",
			"requires": ["base"]
		},
		"ys_view": {
			"path": "lib/core/view.js",
			"requires": ["view", "get"]
		}
	}
}
