# ctstream
This package includes all the machinery for building sites that feature streaming video.


# Back (Init Config)

    import os
    hsdir = os.path.join("html", "stream")
    dirs = [hsdir]
    
    copies = {
    	"img": ["audio.png", "remote_control.png", "save.png", "tv.png"],
    	"css": ["custom.css"]
    }
    copies[hsdir] = ["countdown.html", "index.html", "schedule.html", "widget.html"]
    
    syms = {
    	".": ["_pw.py"],
    	"js": ["stream"],
    	"css": ["stream.css"]
    }
    
    routes = {
    	"/_pw": "_pw.py"
    }

# Front (JS Config)

## core.config.ctstream
### Import line: 'CT.require("core.config");'
    {
    	"mode": "hash",
    	"redirect": "/",
    	"countdown_class": null,
    	"countdown_parent_host": null,
    	"storage_key": "ssk",
    	"port": 8888,
    	"channels": [],
    	"no_title": false,
    	"open_stream": true,
    	"background": null,
    	"back_message": null,
    	"end_message": null,
    	"default_hostname": null,
    	"require_username": false,
    	"multiplexer_opts": {
    		"chatblurs": ["say what?", "any questions?", "what's up?"],
    		"vidopts": {},
    		"closeunsubs": true,
    		"singlechannel": true
    	},
    	"copy": {
    		"ready": "you're late!",
    		"countdown": "show starts in",
    		"nothing": "nothing to see here!",
    		"nouser": "stream is streaming. log in to view."
    	}
    }