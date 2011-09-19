{
	"base": "/~hadrien/obv4pre/admin/",
	"modules": {
		"routes": {
			"path": "config/routes.js"
		},
		"core": {
			"path": "lib/core/core.js",
			"requires": ["controller", "model", "routes", "substitute", "core_api", "l10n"]
		},
		"l10n": {
			"path": "lib/core/l10n.js",
			"requires": ["base"]
		}
	}
}
