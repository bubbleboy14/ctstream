import os
hsdir = os.path.join("html", "stream")
dirs = [hsdir]

copies = {
	"img": ["audio.png", "remote_control.png", "save.png", "tv.png"],
	"css": ["custom.css"]
}
copies[hsdir] = ["index.html", "widget.html"]

syms = {
	"css": ["stream.css"],
	"js": ["stream"]
}