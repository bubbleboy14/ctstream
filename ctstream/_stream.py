from base64 import b64encode
from cantools.web import respond, fail, cgi_get, getmem, clearmem, send_mail
from cantools import config
from streamails import private_show

def response():
	if cgi_get("pw") != config.pw:
		fail()
	action = cgi_get("action", required=False)
	if action == "clear":
		clearmem()
	elif action == "invite":
		pw = cgi_get("show")
		show = getmem(pw, False)
		ts = show["tts"].strftime("%A at %-I:%M%p")
		for email in cgi_get("emails"):
			b64 = b64encode({
				"chat": True,
				"lurk": True,
				"channel": show["token"],
				"user": email.split("@")[0]
			})
			send_mail(email, subject=private_show["subject"],
				body=private_show["body"]%(ts, config.web.domain, b64, pw),
				html=private_show["html"]%(ts, config.web.domain, b64, pw))

respond(response)