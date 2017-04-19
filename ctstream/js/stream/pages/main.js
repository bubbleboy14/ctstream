CT.require("CT.all");
CT.require("CT.stream");
CT.require("core");
CT.require("stream.core");
CT.pubsub.set_protocol("wss");
CT.pubsub.set_reconnect(false);
if (core.config.ctstream.transcode)
	CT.stream.opts.setTranscoder(stream.core.transcode);

CT.onload(function() {
	for (var o in core.config.ctstream.stream_opts)
		CT.stream.opts[o] = core.config.ctstream.stream_opts[o];
	stream.core.setNode(CT.dom.id("ctmain"));
	if (core.config.footer) {
		core.config.ctstream.channels.length &&
			stream.core.loadChannels(core.config.ctstream.channels);
		stream.core.loadRemote();
	}
	CT.initCore();
	stream.core.init();
	CT.on("beforeunload", CT.storage.clear);
});