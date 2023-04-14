CT.require("CT.all");
CT.require("core");
CT.pubsub.set_protocol("wss");

CT.onload(function() {
	var procBuff = function(buffer, channel) {
		window.parent.postMessage({
			action: "clip",
			data: {
				channel: channel,
				data: buffer
			}
		}, targetOrigin);
	}, targetOrigin, chans = {}, senders = {}, udata = {},
		user = "embedded" + CT.data.random(100000);
	CT.pubsub.connect(location.hostname, core.config.ctstream.port, user);
	window.addEventListener("message", function(evt) {
		var d = event.data;
		if (d.action) {
			targetOrigin = evt.origin;
			if (d.action == "subscribe") {
				chans[d.data] = { requiredInitChunk: "unset" };
				CT.pubsub.subscribe(d.data);
			} else if (d.action == "error") {
				if (!(d.data.channel in chans))
					return CT.log("error on own video ignored");
				chans[d.data.channel].requiredInitChunk = d.requiredInitChunk;
				CT.pubsub.publish(d.data.channel, {
					action: "error",
					data: {
						user: user,
						sender: senders[d.data.channel]
					}
				});
			} else if (d.action == "stream") {
				CT.require("stream.core", true);
				stream.core.startRecord(stream.core.multiplex(d.data,
					false, false, true, buffer => procBuff(buffer, d.data)));
			} else if (d.action == "push") {
				CT.stream.util.push(d.data.blob, d.data.channel,
					CT.stream.util.sig(d.data.channel, user, d.data.segment,
						chans[d.data.channel] || udata));
			}
		}
	});
	CT.pubsub.set_cb("message", function(data) {
		if (data.message.action == "clip") {
			senders[data.channel] = data.user;
			var cdata = chans[data.channel];
			if (cdata.requiredInitChunk == "unset")
				cdata.requiredInitChunk = data.channel + data.user + "init";
			CT.stream.util.update(data.message.data, function(blob) {
				CT.stream.util.blob_to_buffer(blob, buffer => procBuff(buffer, data.channel));
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