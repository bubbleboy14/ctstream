import os
hsdir = os.path.join("html", "stream")
dirs = [hsdir]

copies = {
	"img": ["audio.png", "remote_control.png", "save.png", "tv.png"],
	"css": ["custom.css"]
}
copies[hsdir] = ["index.html", "schedule.html", "widget.html"]

syms = {
	".": ["_pw.py"],
	"js": ["stream"],
	"css": ["stream.css"]
}

routes = {
	"/_pw": "_pw.py"
}