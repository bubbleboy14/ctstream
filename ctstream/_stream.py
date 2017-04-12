import base64, json, urllib
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
		ts = show["ttl"].strftime("%A at %-I:%M%p")
		baseaddr = "%s://%s"%(config.web.protocol, config.web.domain)
		for email in cgi_get("emails"):
			credz = urllib.quote(base64.b64encode(json.dumps({
				"channel": show["token"],
				"user": email.split("@")[0]
			})))
			send_mail(email, subject=private_show["subject"],
				body=private_show["body"]%(ts, baseaddr, credz, pw))

respond(response)