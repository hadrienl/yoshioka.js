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
		"fixtures": [
			{
				"path": "^\/api",
				"proxy": {
					"host": "api.over-blog.dev",
					"port": 80,
					"replace_url": "^\/api(/.*?)$"
				}
			}
		],
		"port": 1636
	}
}
