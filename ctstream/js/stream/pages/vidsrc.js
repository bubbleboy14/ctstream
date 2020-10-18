CT.require("CT.all");
CT.require("core");
CT.pubsub.set_protocol("wss");

CT.onload(function() {
	var targetOrigin;
	CT.pubsub.connect(location.hostname, core.config.ctstream.port,
		"embedded" + CT.data.random(100000));
	window.addEventListener("message", function(evt) {
		targetOrigin = evt.origin;
		var d = event.data;
		if (d.action == "subscribe")
			CT.pubsub.subscribe(d.data);
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
			});
		}
	});
});