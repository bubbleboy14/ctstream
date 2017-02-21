stream.core = {
	_: {
		stream: null,
		recorder: null,
		multiplexer: null,
		host: location.hostname,
		testMode: "bounce", // stream|bounce
		nodes: {
			parent: null,
			test: CT.dom.div(null, null, "testnode"),
			video: CT.dom.div(null, "abs w1 h1", "vnode"),
			title: CT.dom.div(null, "biggest bold centered"),
			link: CT.dom.div([
				CT.dom.node("Ctr-C to Copy URL"),
				CT.dom.field()
			], "right transparent p5"),
		},
		copyLink: function(channel) {
			return CT.dom.link(channel + " (link)", function() {
				var cbnode = stream.core._.nodes.link;
				cbnode.lastChild.value = "https://" + stream.core._.host + "#" + channel;
				if (cbnode._on) { // hide fallback node
					CT.dom.showHideT(cbnode);
					cbnode._on = false;
				} else {
					cbnode.lastChild.select();
					if (document.execCommand('copy'))
						alert("Link saved to clipboard. Great!");
					else {
						CT.dom.showHideT(cbnode);
						cbnode._on = true;
						cbnode.lastChild.select();
					}
				}
			});
		},
		wserror: function() {
			(new CT.modal.Modal({
				transition: "slide",
				slide: {
					origin: "bottom"
				},
				content: [
					CT.dom.div("Oops!", "bigger pb10"),
					[
						CT.dom.span("Looks like your browser is too shy to talk to our WebSocket server. Click"),
						CT.dom.pad(),
						CT.dom.link("here", null, "https://" + stream.core._.host + ":" + core.config.ctstream.port,
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.span("to introduce them!"),
						CT.dom.pad(),
						CT.dom.span("This is probably happening because we're using a self-signed SSL certificate, which just means we didn't buy someone's stamp of approval. It's not less safe, just less expensive. And you might want/need to refresh this page after.")
					]
				]
			})).show();
		}
	},
	setHost: function(host) {
		stream.core._.host = host;
	},
	setNode: function(node) {
		stream.core._.nodes.parent = node || document.body;
		stream.core._.nodes.parent.appendChild(stream.core._.nodes.link);
		stream.core._.nodes.parent.appendChild(stream.core._.nodes.title);
		stream.core._.nodes.parent.appendChild(stream.core._.nodes.video);
	},
	echo: function(direct) {
		var streamer = new CT.stream.Streamer();
		CT.dom.setContent(stream.core._.nodes.test, streamer.getNode());
		return direct ? streamer.echo : streamer.chunk;
	},
	multiplex: function(channel, chat) {
		var multiplexer = stream.core._.multiplexer = stream.core._.multiplexer ||
			new CT.stream.Multiplexer({ host: stream.core._.host, chat: chat,
				port: core.config.ctstream.port, node: stream.core._.nodes.video,
				wserror: stream.core._.wserror, singlechannel: true });
		multiplexer.join(channel);
		CT.dom.setContent(stream.core._.nodes.title, stream.core._.copyLink(channel));
		return function(blobs, segment) {
			var vid = multiplexer.push(blobs, segment, channel, stream.core._.stream);
			if (!stream.core._.recorder.video)
				stream.core._.recorder.video = vid;
		};
	},
	stopRecord: function() {
		stream.core._.recorder.stop();
		var v = stream.core._.nodes.test.firstChild.video
			|| stream.core._.nodes.test.firstChild; // handles stream test
		v.pause();
		if (CT.info.isChrome)
			v.src = "";
		else if (CT.info.isFirefox)
			v.mozSrcObject = null;
		else
			v.src = null;
		CT.dom.remove(v);
	},
	startRecord: function(cb) {
		CT.stream.util.record(cb, function(rec, vstream) {
			stream.core._.recorder = rec;
			stream.core._.stream = vstream;
		});
	},
	startTest: function() {
		if (stream.core._.testMode == "bounce") {
			var streamer = new CT.stream.Streamer();
			CT.dom.setContent(stream.core._.nodes.test, streamer.getNode());
			stream.core.startRecord(streamer.echo);
		} else { // stream
			navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
				CT.dom.setContent(stream.core._.nodes.test, CT.dom.video(URL.createObjectURL(stream),
					null, null, { autoplay: true, mozSrcObject: stream }));
			});
		}
	},
	resizeWidget: function() {
		CT.dom.className("widget")[0].style.zoom = CT.align.height() / 440;
	},
	startMultiplex: function(channel) {
		var cnode;
		if (channel.slice(-5) == "_chat") {
			channel = channel.slice(0, -5);
			cnode = CT.dom.div(null, "abs t0 r0 b0 w200p");
			stream.core._.nodes.parent.appendChild(cnode);
		}
		if (channel.slice(-5) == "_zoom") {
			channel = channel.slice(0, -5);
			CT.onresize(stream.core.resizeWidget);
			stream.core.resizeWidget();
		}
		if (channel.slice(-5) == "_lurk")
			stream.core.multiplex(channel.slice(0, -5), cnode);
		else
			stream.core.startRecord(stream.core.multiplex(channel, cnode));
	},
	tvButton: function(cb, title, fname) {
		var b = CT.dom.img("/img/" + (fname || "tv") + ".png", "abs b0 m5", function() {
			CT.trans.wobble(b.firstChild.firstChild,
				{ axis: "y", radius: -5, duration: 200 });
			cb();
		}, null, null, title, null, "w80p h80p inline-block");
		return b;
	},
	channelButton: function(channel) {
		return {
			content: stream.core.tvButton(function() {
				stream.core.startMultiplex(channel);
			}, channel)
		};
	},
	loadChannels: function(channels) {
		core.config.footer.links = channels.map(stream.core.channelButton).concat(core.config.footer.links);
	},
	selectChannel: function() {
		var m = stream.core._.controller = stream.core._.controller || new CT.modal.Prompt({
			center: false,
			transition: "slide",
			slide: { origin: "bottomright" },
			prompt: "Join A Channel",
			cb: stream.core.startMultiplex
		});
		m.showHide(stream.core._.nodes.parent);
	},
	loadRemote: function() {
		core.config.footer.links.push({
			content: stream.core.tvButton(stream.core.selectChannel,
				"Remote Control", "remote_control")
		});
	},
	checkHash: function() {
		if (location.hash)
			stream.core.startMultiplex(location.hash.slice(1));
	}
};