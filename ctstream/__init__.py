from . import init

__version__ = "0.1"

def invite(pw, emails, msg, template):
	import base64, json, time
	from urllib.parse import quote
	from cantools.web import getmem, send_mail
	from cantools import config
	show = getmem(pw, False)
	ts = "%s %s"%(show["ttl"].strftime("%A at %-I:%M%p"), time.tzname[time.daylight])
	baseaddr = "%s://%s/stream/private.html#"%(config.web.protocol, config.web.domain)
	for email in emails:
		credz = quote(base64.b64encode(json.dumps({
			"channel": show["token"],
			"user": email.split("@")[0]
		}).encode()))
		link = "%s%s"%(baseaddr, credz)
		body = msg and msg.format(link='<a href="%s">here</a>'%(link,), password=pw,
			time=ts) or template["body"]%(ts, link, pw)
		send_mail(email, subject=template["subject"], body=body)
