import base64, json, time, urllib
from cantools.web import respond, fail, read_file, send_file, send_mail, cgi_get, getmem, clearmem
from cantools.util import transcode
from cantools import config
from streamails import private_show

def response():
	if cgi_get("pw") != config.pw:
		fail()
	action = cgi_get("action", required=False)
	if action == "clear":
		clearmem()
	elif action == "transcode":
		send_file(transcode(read_file(cgi_get("data")), True))
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
			body = msg and msg.format(link='<a href="%s">here</a>'%(link,), password=pw,
				time=ts) or private_show["body"]%(ts, link, pw)
			send_mail(email, subject=private_show["subject"], body=body)

respond(response)