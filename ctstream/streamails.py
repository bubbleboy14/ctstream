private_show = {
	"subject": "You've been invited to a private show"
}
private_show["body"] = """
You've been invited to a private show.

It starts at %s. To watch, click here:

%s/stream/private.html#%s

And enter this password:

%s

Enjoy!
"""
private_show["html"] = """
You've been invited to a private show.<br>
<br>
It starts at %s. To watch, click <a href="%s/stream/private.html#%s">here</a>.<br>
<br>
And enter this password:<br>
<br>
%s<br>
<br>
Enjoy!
"""