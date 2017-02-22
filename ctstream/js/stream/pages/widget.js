CT.require("CT.all");
CT.require("CT.stream");
CT.require("core");
CT.require("stream.core");
CT.pubsub.set_protocol("wss");
CT.pubsub.set_reconnect(false);

CT.onload(function() {
	stream.core.setNode();
	stream.core.checkHash();
});