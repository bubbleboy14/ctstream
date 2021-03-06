import os
hsdir = os.path.join("html", "stream")
dirs = [hsdir]

copies = {
	".": ["streamails.py"],
	"img": ["audio.png", "fullscreen.png", "remote_control.png", "save.png", "tv.png"],
	"css": ["custom.css"]
}
copies[hsdir] = ["countdown.html", "index.html", "private.html", "schedule.html", "widget.html", "vidsrc.html"]

syms = {
	".": ["_stream.py"],
	"js": ["stream"],
	"css": ["stream.css"]
}

routes = {
	"/_stream": "_stream.py"
}