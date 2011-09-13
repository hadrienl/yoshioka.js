{
	"base": "/",
	"modules": {
		"routes": {
			"path": "config/routes.js"
		},
		"core": {
			"path": "core/core.js",
			"requires": ["controller", "model", "routes", "substitute", "core_api"]
		},
		"core_api": {
			"path": "core/api.js",
			"requires": ["base", "io", "querystring"]
		}
	}
}
