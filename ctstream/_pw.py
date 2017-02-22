from cantools.web import respond, fail, cgi_get
from cantools import config

def response():
	if cgi_get("pw") != config.pw:
		fail()

respond(response)