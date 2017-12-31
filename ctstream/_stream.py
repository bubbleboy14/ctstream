from cantools.web import respond, fail, read_file, send_file, cgi_get, clearmem
from cantools.util import transcode
from cantools import config
from ctstream import invite
from streamails import privates

def response():
	if cgi_get("pw") != config.pw:
		fail()
	action = cgi_get("action", required=False)
	if action == "clear":
		clearmem()
	elif action == "transcode":
		send_file(transcode(read_file(cgi_get("data")), True))
	elif action == "invite":
		invite(cgi_get("show"), cgi_get("emails"), cgi_get("msg", required=False), privates[cgi_get("stream_type", default="show")])

respond(response)