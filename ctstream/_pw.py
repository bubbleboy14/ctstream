from cantools.web import respond, fail, cgi_get, clearmem
from cantools import config

def response():
	if cgi_get("pw") != config.pw:
		fail()
	action = cgi_get("action", required=False)
	if action == "clear":
		clearmem()

respond(response)