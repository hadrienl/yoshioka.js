{
	"app": "yourappname",
	"mainview": "yourmainviewname",
	"api": "/api.php?",
	"groups": {
		"yourappname": {
			"base": "/"
		}
	},
	"proxy_path": [
		{
			"path": "^\/api",
			"host": "localhost",
			"port": 80
		}
	]
}
