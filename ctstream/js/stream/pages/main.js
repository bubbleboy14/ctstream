CT.require("CT.all");
CT.require("CT.stream");
CT.require("core");
CT.require("stream.core");
CT.pubsub.set_protocol("wss");
CT.pubsub.set_reconnect(false);

CT.onload(function() {
	stream.core.setNode(CT.dom.id("ctmain"));
	if (core.config.footer) {
		core.config.ctstream.channels.length &&
			stream.core.loadChannels(core.config.ctstream.channels);
		stream.core.loadRemote();
	}
	CT.initCore();
	stream.core.init();
});