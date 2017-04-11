CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

CT.onload(function() {
	stream.core.credz(function() {
		CT.initCore();
		CT.memcache.countdown.get(core.config.ctstream.default_channel,
			stream.core.loadScheduler);
	});
});