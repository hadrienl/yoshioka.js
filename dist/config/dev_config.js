{
    "api": "/fakeapi/",
    "fixtures": [
        {
            "path": "^\\/api\\/",
            "proxy": {
                "host": "yourhost.com",
                "port": 80
            }
        },
        {
            "path": "^\\/fakeapi\\/"
        }
    ],
    "port": 1636
}
