{
	"app": "yourapp",
	"mainview": "index",
	"api": "/api.php?",
	"groups": {
		"yourapp": {
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
