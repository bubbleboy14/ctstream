CT.require("CT.all");
CT.require("core");
CT.require("stream.core");
CT.pubsub.set_protocol("wss");
var cfg = core.config.ctstream;
CT.pubsub.set_reconnect(cfg.reconnect);
if (cfg.transcode)
	CT.stream.opts.setTranscoder(stream.core.transcode);

CT.onload(function() {
	for (var o in cfg.stream_opts)
		CT.stream.opts[o] = cfg.stream_opts[o];
	stream.core.setNode(CT.dom.id("ctmain"));
	if (core.config.footer) {
		cfg.channels.length && stream.core.loadChannels(cfg.channels);
		stream.core.loadRemote();
		stream.core.loadModeSwapper();
	}
	CT.initCore();
	stream.core.init();
	CT.on("beforeunload", function() {
		cfg.beforeunload && cfg.beforeunload();
		if (cfg.require_admin && !(user && user.core.get() && user.core.get().admin))
			CT.storage.clear();
	});
});