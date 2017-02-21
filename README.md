# ctstream
This package includes all the machinery for building sites that feature streaming video.


# Back (Init Config)

copies = {
	"img": ["audio.png", "remote_control.png", "save.png", "tv.png"],
	"css": ["custom.css"]
}

syms = {
	"html": ["stream"], # copy these?
	"css": ["stream.css"],
	"js": ["stream"]
}

# Front (JS Config)

## core.config.ctstream
### Import line: 'CT.require("core.config");'
{
	"port": 8888,
	"channels": []
}