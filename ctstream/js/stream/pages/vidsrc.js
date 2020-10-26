CT.require("CT.all");
CT.require("core");
CT.pubsub.set_protocol("wss");

CT.onload(function() {
	var targetOrigin, chans = {}, user = "embedded" + CT.data.random(100000);
	CT.pubsub.connect(location.hostname, core.config.ctstream.port, user);
	window.addEventListener("message", function(evt) {
		var d = event.data;
		if (d.action) {
			targetOrigin = evt.origin;
			if (d.action == "subscribe") {
				chans[d.data] = {};
				CT.pubsub.subscribe(d.data);
			} else if (d.action == "error") {
				chans[d.data.channel].requiredInitChunk = d.requiredInitChunk;
				CT.pubsub.publish(d.data.channel, {
					action: "error",
					data: user
				});
			}
		}
	});
	CT.pubsub.set_cb("message", function(data) {
		if (data.message.action == "clip") {
			CT.stream.util.update(data.message.data, function(blob) {
				CT.stream.util.blob_to_buffer(blob, function(buffer) {
					window.parent.postMessage({
						action: "clip",
						data: {
							channel: data.channel,
							data: buffer
						}
					}, targetOrigin);
				});
			}, chans[data.channel].requiredInitChunk);
			delete chans[data.channel].requiredInitChunk;
		}
	});
});