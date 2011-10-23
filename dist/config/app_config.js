{
	"app": "yourappname",
	"mainview": "yourmainviewname",
	"api": "/api.php?",
	"groups": {
		"yourappname": {
			"base": "/"
		}
	},
	"dev": {
		"proxy_path": [
			{
				"path": "^\/api",
				"host": "localhost",
				"port": 80,
				"replace_url": "^\/api(/.*?)$"
			}
		],
		"port": 1636
	}
}
