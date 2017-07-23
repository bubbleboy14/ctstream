CT.require("stream.countdown");
CT.require("stream.schedule");

stream.core = {
	_: {
		stream: null,
		recorder: null,
		multiplexer: null,
		host: location.hostname,
		testMode: "bounce", // stream|bounce
		reset: " may be having trouble watching - if this persists, host should refresh",
		nodes: {
			parent: null,
			test: CT.dom.div(null, null, "testnode"),
			video: CT.dom.div(null, "abs all0", "vnode"),
			back: CT.dom.marquee(core.config.ctstream.back_message, "gigantic bold pt1-2", null, true),
			title: CT.dom.div(null, "biggest bold centered"),
			link: CT.dom.div([
				CT.dom.node("Ctr-C to Copy URL"),
				CT.dom.field()
			], "right transparent p5"),
		},
		copyLink: function(channel) {
			return CT.dom.link(channel + " (link)", function() {
				var cbnode = stream.core._.nodes.link;
				cbnode.lastChild.value = "https://" + stream.core._.host + "/stream#" + channel;
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
		presenceTracker: function() {
			var n = CT.dom.div("(just you)");
			CT.pubsub.set_cb("presence", function(p) {
				CT.dom.setContent(n, "count: " + p);
			});
			return n;
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
		if (core.config.ctstream.back_message)
			stream.core._.nodes.video.appendChild(stream.core._.nodes.back);
		if (core.config.ctstream.background)
			stream.core._.nodes.parent.style.background = "url(" + core.config.ctstream.background + ")";
	},
	transcode: function(cb) {
		if (core.config.ctstream.stop_on_save) {
			stream.core._.multiplexer.stop();
			stream.core.stopRecord();
		}
		var encoder = function(blob) {
			CT.net.formUp(blob, {
				path: "/_stream",
				params: {
					action: "transcode",
					pw: stream.core._pw
				}
			});
		};
		return encoder;
	},
	echo: function(direct) {
		var streamer = new CT.stream.Streamer();
		CT.dom.setContent(stream.core._.nodes.test, streamer.getNode());
		return direct ? streamer.echo : streamer.chunk;
	},
	handleReset: function(uname) {
		CT.log("USER RESET!!!! " + uname);
		stream.core._.multiplexer.chat({ data: uname + stream.core._.reset }, "SYSTEM [HOST ONLY]");
	},
	multiplex: function(channel, chat, lurk) {
		var c = core.config.ctstream, _ = stream.core._, opts = CT.merge({
			chat: chat,
			port: c.port,
			host: _.host,
			wserror: _.wserror,
			node: _.nodes.video,
			title: _.nodes.title
		}, c.multiplexer_opts), isAdmin = !lurk || c.admins.indexOf(opts.user) != -1;
		if (c.recover && isAdmin)
			opts.onerror = stream.core.handleReset;
		if (c.back_message) {
			opts.onstart = function() {
				CT.dom.hide(_.nodes.back);
			};
		}
		if (c.end_message) {
			opts.onstop = function() {
				CT.dom.setContent(_.nodes.back, c.end_message);
				CT.dom.show(_.nodes.back);
				_.nodes.back.start();
			};
		}
		var multiplexer = _.multiplexer = _.multiplexer
			|| new CT.stream.Multiplexer(opts);
		multiplexer.join(channel);
		if (c.host_presence && isAdmin) {
			CT.dom.setContent(_.nodes.title, _.presenceTracker());
			_.nodes.title.classList.remove("hidden"); // may be hidden by "no_title"
		} else
			CT.dom.setContent(_.nodes.title, _.copyLink(channel));
		return function(blobs, segment) {
			var vid = multiplexer.push(blobs, segment, channel, _.stream);
			if (!_.recorder.video)
				_.recorder.video = vid;
		};
	},
	stopRecord: function() {
		stream.core._.stream.getTracks().forEach(function(track) {
			track.stop();
		});
		stream.core._.recorder.stop();
		stream.core._.recorder._stopped = true;
		var testnode = stream.core._.nodes.test.firstChild;
		if (testnode) { // handles stream test
			var v = testnode.video || testnode;
			v.pause();
			if (CT.info.isChrome)
				v.src = "";
			else if (CT.info.isFirefox)
				v.mozSrcObject = null;
			else
				v.src = null;
			CT.dom.remove(v);
		}
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
	_start: function(channel, cnode, lurk) {
		if (lurk)
			stream.core.multiplex(channel, cnode, true);
		else if (core.config.ctstream.open_stream)
			stream.core.startRecord(stream.core.multiplex(channel, cnode));
		else {
			stream.core.credz(function() {
				stream.core.startRecord(stream.core.multiplex(channel, cnode));
			});
		}
	},
	startMultiplex: function(channel, chat, lurk, zoom, user, inferred) {
		var cnode;
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			channel = obj.channel;
			chat = obj.chat;
			lurk = obj.lurk;
			zoom = obj.zoom;
			user = obj.user;
			inferred = obj.inferred;
		}
		if (chat) {
			cnode = CT.dom.div(null, "abs t0 r0 b0 w195p");
			stream.core._.nodes.video.classList.add("r200");
			stream.core._.nodes.video.classList.add("fullvid");
			stream.core._.nodes.parent.appendChild(cnode);
			if (core.config.ctstream.no_title)
				stream.core._.nodes.title.classList.add("hidden");
		}
		if (zoom) {
			CT.onresize(stream.core.resizeWidget);
			stream.core.resizeWidget();
		}
		if (user) {
			core.config.ctstream.multiplexer_opts.user = user;
			if (inferred && core.config.ctstream.confirm_inferred) {
				var p = new CT.modal.Prompt({
					noClose: true,
					inputClass: "w280",
					blurs: ["what's your nickname? [default: " + user + "]"],
					cb: function() {
						var name = CT.dom.getFieldValue(p.input);
						if (name)
							core.config.ctstream.multiplexer_opts.user = name;
						stream.core._start(channel, cnode, lurk);
					}
				});
				return p.show();
			}
		}
		stream.core._start(channel, cnode, lurk);
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
	credz: function(cb) {
		if (core.config.ctstream.require_user) {
			CT.require("user.core", true);
			if (!user.core._current ||
				(core.config.ctstream.require_admin && !user.core._current.admin))
					stream.core.redir();
		}
		(new CT.modal.Prompt({
			noClose: true,
			cb: function(val) {
				stream.core._pw = val;
				CT.net.post({
					path: "/_stream",
					params: { pw: val },
					cb: cb,
					eb: stream.core.redir
				})
			}
		})).show();
	},
	timestamp: function(ttl) {
		var d = new Date(Math.round((Date.now() + ttl * 1000) / 1800000) * 1800000);
		return d.toString().split(d.getFullYear())[0] + "@ " + d.toLocaleTimeString().replace(":00 ", " ");
	},
	redir: function() {
		if (core.config.ctstream.redirect)
			location = core.config.ctstream.redirect;
	},
	checkPassword: function() {
		if (!core.config.ctstream.allow_password)
			return stream.core.redir();
		(new CT.modal.Prompt({
			noClose: true,
			prompt: "password?",
			style: "password",
			cb: function(chan) {
				CT.memcache.countdown.get(chan, function(show) {
					if (!show)
						return stream.core.redir();
					(new CT.modal.Prompt({
						noClose: true,
						prompt: "nickname?",
						cb: function(uname) {
							stream.core.startMultiplex({
								chat: true,
								lurk: true,
								user: uname,
								channel: chan
							});
						}
					})).show();
				});
			}
		})).show();
	},
	checkHash: function() {
		if (location.hash) {
			var opts = {},
				channel = location.hash.slice(1);
			if (channel.slice(-5) == "_chat") {
				channel = channel.slice(0, -5);
				opts.chat = true;
			}
			if (channel.slice(-5) == "_zoom") {
				channel = channel.slice(0, -5);
				opts.zoom = true;
			}
			if (channel.slice(-5) == "_lurk") {
				channel = channel.slice(0, -5);
				opts.lurk = true;
			}
			opts.channel = channel;
			stream.core.startMultiplex(opts);
		} else
			stream.core.checkPassword();
	},
	checkStorage: function() {
		var data = CT.storage.get(core.config.ctstream.storage_key);
		data ? stream.core.startMultiplex(data) : stream.core.checkPassword();
	},
	init: function() {
		if (core.config.ctstream.mode == "storage") // more secure
			stream.core.checkStorage();
		else // hash mode (default): easier, more linkable
			stream.core.checkHash();
	}
};