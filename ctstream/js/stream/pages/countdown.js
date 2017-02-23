CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

CT.onload(function() {
	CT.memcache.countdown.get("show", stream.core.loadCountdown);
});