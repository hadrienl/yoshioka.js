{
    "base": "/",
    "modules": {
        "ys/routes": {
            "path": "config/routes.js"
        },
        "yoshioka": {
            "path": "yoshioka.js/build/yoshioka.js",
            "requires": ["base", "cache", "view", "node", "get", "router", "model", "ys/routes", "substitute", "io", "json"]
        },
        "ys/core": {
            "path": "yoshioka.js/build/yoshioka.js",
            "requires": ["router", "model", "ys/routes", "substitute", "ys/i18n", "ys/view"]
        },
        "ys/i18n": {
            "path": "yoshioka.js/build/yoshioka.js",
            "requires": ["base", "cache", "io", "json"]
        },
        "ys/view": {
            "path": "yoshioka.js/build/yoshioka.js",
            "requires": ["view", "node", "get", "substitute"]
        }
    },
    "copyright": {
        "name": "Yoshioka.js",
        "version": "0.1",
        "text": "Copyright 2011 EBuzzing Group All rights reserved\nLicensed under the BSD License."
    }
}
