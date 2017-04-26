CT.require("CT.all");
CT.require("CT.stream");
CT.require("core");
CT.require("stream.core");
CT.pubsub.set_protocol("wss");
CT.pubsub.set_reconnect(false);
var cfg = core.config.ctstream;
if (cfg.transcode)
	CT.stream.opts.setTranscoder(stream.core.transcode);

CT.onload(function() {
	for (var o in cfg.stream_opts)
		CT.stream.opts[o] = cfg.stream_opts[o];
	stream.core.setNode(CT.dom.id("ctmain"));
	if (core.config.footer) {
		cfg.channels.length && stream.core.loadChannels(cfg.channels);
		stream.core.loadRemote();
	}
	CT.initCore();
	stream.core.init();
	CT.on("beforeunload", function() {
		if (cfg.require_admin && !(user && user.core._current && user.core._current.admin))
			CT.storage.clear();
	});
});