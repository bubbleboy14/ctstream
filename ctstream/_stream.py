import base64, json, os, time, urllib
from cantools.web import respond, succeed, fail, cgi_get, getmem, clearmem, send_mail
from cantools import config
from streamails import private_show

def response():
	if cgi_get("pw") != config.pw:
		fail()
	action = cgi_get("action", required=False)
	if action == "clear":
		clearmem()
	elif action == "reccheck":
		succeed(os.path.isdir(os.path.join("blob", "mc", cgi_get("token"))))
	elif action == "invite":
		pw = cgi_get("show")
		msg = cgi_get("msg", required=False)
		show = getmem(pw, False)
		ts = "%s %s"%(show["ttl"].strftime("%A at %-I:%M%p"), time.tzname[time.daylight])
		baseaddr = "%s://%s/stream/private.html#"%(config.web.protocol, config.web.domain)
		for email in cgi_get("emails"):
			credz = urllib.quote(base64.b64encode(json.dumps({
				"channel": show["token"],
				"user": email.split("@")[0]
			})))
			link = "%s%s"%(baseaddr, credz)
			body = msg and msg.format(link=link, password=pw,
				time=ts) or private_show["body"]%(ts, link, pw)
			send_mail(email, subject=private_show["subject"], body=body)

respond(response)