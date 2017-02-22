CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

CT.onload(function() {
	stream.core.credz(function() {
		CT.initCore();
		CT.memcache.countdown.get("show", stream.core.loadScheduler);
	});
});