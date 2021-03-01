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
				chans[d.data] = { requiredInitChunk: "unset" };
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
			var cdata = chans[data.channel];
			if (cdata.requiredInitChunk == "unset")
				cdata.requiredInitChunk = data.channel + data.user + "init";
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
			}, cdata.requiredInitChunk);
			delete cdata.requiredInitChunk;
		}
	});
	CT.pubsub.set_cb("meta", function(data) {
		window.parent.postMessage({
			action: "mode",
			data: {
				channel: data.channel,
				mode: data.meta.mode
			}
		}, targetOrigin);
	});
});