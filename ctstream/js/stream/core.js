CT.require("stream.countdown");
CT.require("stream.schedule");

stream.core = {
	_: {
		refreshes: 0,
		stream: null,
		recorder: null,
		multiplexer: null,
		host: location.hostname,
		testMode: "ask", // stream|bounce|ask
		mode: "camera",
		modes: {
			camera: "getUserMedia",
			screenshare: "getDisplayMedia"
		},
		nodes: {
			parent: null,
			test: CT.dom.div(null, null, "testnode"),
			video: CT.dom.div(null, "abs all0", "vnode"),
			back: CT.dom.marquee(core.config.ctstream.back_message, "gigantic bold pt1-2", null, true),
			title: CT.dom.div(null, "biggest bold centered above relative"),
			link: CT.dom.div([
				CT.dom.node("Ctr-C to Copy URL"),
				CT.dom.field()
			], "right transparent p5"),
		},
		copyLink: function(channel) {
			var cname = channel;
			if (cname.length > 40 && cname.indexOf(" ") == -1)
				cname = "private chat";
			return CT.dom.link(cname + " (link)", function() {
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
			var n = CT.dom.div("(just you)"),
				hover = CT.dom.div(null, "round padded bordered whiteback");
			CT.pubsub.set_cb("presence", function(p, channel) {
				CT.dom.setContent(n, "count: " + p);
				CT.dom.setContent(hover, CT.pubsub.presence(channel));
			});
			CT.hover.set({
				node: n,
				content: hover,
				recursive: true
			});
			return n;
		},
		wserror: function() {
			var _ = stream.core._;
			_.oops = _.oops || new CT.modal.Modal({
				transition: "slide",
				slide: {
					origin: "bottom"
				},
				content: [
					CT.dom.div("Oops!", "bigger pb10"),
					[
						CT.dom.span("Looks like your browser is too shy to talk to our WebSocket server. Click"),
						CT.dom.pad(),
						CT.dom.link("here", null, "https://" + _.host + ":" + core.config.ctstream.port,
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.span("to introduce them!"),
						CT.dom.pad(),
						CT.dom.span("This is probably happening because we're using a self-signed SSL certificate, which just means we didn't buy someone's stamp of approval. It's not less safe, just less expensive. And you might want/need to refresh this page after.")
					]
				]
			});
			_.oops.show();
		},
		camsel: function() {
			var _ = stream.core._, vinputs;
			navigator.mediaDevices.enumerateDevices().then(function(devices) {
				vinputs = devices.filter(d => d.kind == "videoinput");
				(vinputs.length == 1) || CT.modal.choice({
					prompt: "which camera?",
					data: vinputs,
					cb: function(device) {
						_.deviceId = device.deviceId;
					}
				})
			});
		},
		pass: function() {
			return btoa(Date.now());
		},
		setRefresh: function(now) {
			now = now || Date.now();
			stream.core._.nextRefresh = now + CT.stream.opts.resetWait;
		},
		passes: function(token) {
			var now = Date.now();
			stream.core._.setRefresh(now);
			return token && (now - parseInt(atob(token)) < CT.stream.opts.reset);
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
	handleReset: function(edata, channel) {
		var c = core.config.ctstream, _ = stream.core._,
			uname = edata.user, sender = edata.sender,
			youser = c.multiplexer_opts.user || _.uname;
		CT.log("USER RESET!!!! " + uname + " (" + sender + ")");
		if (c.admins.indexOf(youser) != -1)
			_.multiplexer.chat({ data: uname + " glitched" }, "SYSTEM");
		if (_.recorder && sender == youser) {
			var n = Date.now();
			if (_.refreshed) {
				var diff = n - _.refreshed;
				CT.log("USER RESET diff " + diff);
//				if (diff < CT.stream.opts.chunk)
//					return;
				_.multiplexer.initChunk = false;
				if (diff < CT.stream.opts.reset) {
					delete _.refreshed;
					return stream.core.refresh(channel);
				}
			}
			_.refreshed = n;
		}
	},
	multiplex: function(channel, chat, lurk, noco, onbuff) {
		var c = core.config.ctstream, _ = stream.core._, opts = CT.merge({
			chat: chat,
			port: c.port,
			host: _.host,
			wserror: _.wserror,
			node: _.nodes.video,
			title: _.nodes.title
		}, c.multiplexer_opts), isAdmin = !lurk || c.admins.indexOf(opts.user) != -1;
		if (c.recover)
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
		if (noco)
			opts.autoconnect = false;
		var multiplexer = _.multiplexer = _.multiplexer
			|| new CT.stream.Multiplexer(opts);
		multiplexer.join(channel);
		_.channel = channel;
		_.uname = multiplexer.opts.user;
		if (c.host_presence && isAdmin) {
			CT.dom.setContent(_.nodes.title, _.presenceTracker());
			_.nodes.title.classList.remove("hidden"); // may be hidden by "no_title"
		} else
			CT.dom.setContent(_.nodes.title, _.copyLink(channel));
		return function(blobs, segment) {
			var vid = multiplexer.push(blobs, segment, channel, _.stream);
			if (!_.recorder.video)
				_.recorder.video = vid;
			onbuff && CT.stream.util.blob_to_buffer(blobs.video, onbuff);
		};
	},
	stopRecord: function() {
		var _ = stream.core._;
//		_.stream.getTracks().forEach(function(track) {
//			track.stop();
//		});
		if (_.recorder) { // not created in stream-mode test...
			_.recorder.state != "inactive" && _.recorder.stop();
			_.recorder._stopped = true;
		}
		var testnode = _.nodes.test.firstChild;
		if (testnode) { // handles stream test
			var v = testnode.video || testnode;
			v.pause();
			v.src = v.srcObject = null;
			CT.dom.remove(v);
		}
	},
	startRecord: function(cb, vid) {
		var sc = stream.core, _ = sc._;
		_.cb = cb;
		if (CT.info.isFirefox && _.mode == "screenshare" && !_.ffasked) {
			_.ffasked = true; // TODO : fully fix Firefox Screenshare
			return CT.stream.opts.doPrompt("Ready to record?", "Begin Broadcast",
				() => sc.startRecord(cb, vid)).show();
		}
		CT.stream.util.record(cb, function(rec, vstream) {
			_.recorder = rec;
			_.stream = vstream;
			if (vid)
				vid.video.srcObject = vstream;
		}, null, _.modes[_.mode], _.deviceId);
	},
	reset: function() {
		var _ = stream.core._;
		CT.log("STREAM CORE RESET");
		CT.pubsub.unsubscribe(_.channel);
		stream.core.stopRecord();
		stream.core.startRecord(_.cb, _.recorder.video);
		CT.pubsub.subscribe(_.channel);
	},
	refresh: function(chan) {
		var _ = stream.core._, rl = CT.stream.opts.resetLimit,
			sk = core.config.ctstream.storage_key;
		_.refreshes += 1;
		CT.log("RESET refresh!!! " + _.refreshes);
		if (_.nextRefresh && _.nextRefresh > Date.now())
			return;
		_.setRefresh();
		if (rl == "auto")
			rl = Math.ceil(CT.pubsub.presence(chan).length / 2);
		if (_.refreshes < rl)
			stream.core.reset();
		else {
			CT.storage.set(sk, CT.merge({
				bypass: stream.core._.pass() 
			}, CT.storage.get(sk)));
			window.location.reload();
		}

//		window.location = location.pathname + location.hash;
//		stream.core._.recorder.stop();
//		stream.core._.multiplexer.initChunk = false;
//		stream.core._.recorder.start();
	},
	startTest: function() {
		var sc = stream.core, _ = sc._, tmode = _.testMode;
		if (tmode != "ask")
			return sc._startTest(tmode);
		CT.modal.choice({
			data: ["bounce", "stream"],
			cb: sc._startTest
		});
	},
	_startTest: function(tmode) {
		var _ = stream.core._;
		if (tmode == "bounce") {
			var streamer = new CT.stream.Streamer({
				vopts: { mimeType: CT.stream.opts.modes[_.mode] }
			});
			CT.dom.setContent(_.nodes.test, streamer.getNode());
			stream.core.startRecord(streamer.echo);
		} else { // stream
			navigator.mediaDevices[_.modes[_.mode]]({ video: true }).then(function(strm) {
				_.stream = strm;
				CT.dom.setContent(_.nodes.test, CT.dom.video(strm,
					null, null, { autoplay: true }));
			});
		}
	},
	resizeWidget: function() {
		CT.dom.className("widget")[0].style.zoom = CT.align.height() / 440;
	},
	_start: function(channel, cnode, lurk, bypass) {
		if (lurk)
			stream.core.multiplex(channel, cnode, true);
		else {
			if (core.config.ctstream.open_stream || stream.core._.passes(bypass))
				stream.core.startRecord(stream.core.multiplex(channel, cnode));
			else {
				stream.core.credz(function() {
					stream.core.startRecord(stream.core.multiplex(channel, cnode));
				});
			}
			CT.pubsub.meta(channel, { mode: stream.core._.mode });
		}
	},
	startMultiplex: function(channel, chat, lurk, zoom, user, inferred, bypass) {
		var cnode;
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			channel = obj.channel;
			chat = obj.chat;
			lurk = obj.lurk;
			zoom = obj.zoom;
			user = obj.user;
			inferred = obj.inferred;
			bypass = obj.bypass;
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
		stream.core._start(channel, cnode, lurk, bypass);
	},
	tvButton: function(cb, title, fname) {
		var b = CT.dom.img("/img/" + (fname || "tv") + ".png", "abs b0 m5", function() {
			CT.trans.wobble(b.firstChild.firstChild,
				{ axis: "y", radius: -5, duration: 200 });
			cb();
		}, null, null, title, null, "w80p h80p inline-block");
		return b;
	},
	setChannel: function(channel) {
		if (core.config.ctstream.recover && location.pathname == "/stream")
			location.hash = channel;
		stream.core.startMultiplex(channel);
	},
	channelButton: function(channel) {
		return {
			content: stream.core.tvButton(function() {
				stream.core.setChannel(channel);
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
			cb: stream.core.setChannel
		});
		m.showHide(stream.core._.nodes.parent);
	},
	loadRemote: function() {
		core.config.footer.links.push({
			content: stream.core.tvButton(stream.core.selectChannel,
				"Remote Control", "remote_control")
		});
	},
	loadModeSwapper: function() {
		var _ = stream.core._;
		core.config.footer.links.unshift({
			content: "swap mode",
			className: "glowing",
			cb: function() {
				CT.modal.choice({
					prompt: "current: " + _.mode,
					data: ["camera", "screenshare"],
					cb: function(mode) {
						_.mode = mode;
						(mode == "camera") && _.camsel();
					}
				});
			}
		});
	},
	credz: function(cb) {
		if (core.config.ctstream.require_user) {
			CT.require("user.core", true);
			var current_user = CT.module("user.core").get();
			if (!current_user ||
				(core.config.ctstream.require_admin && !current_user.admin))
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
							stream.core.startMultiplex(CT.merge({
								user: uname,
								channel: chan
							}, core.config.ctstream.defaults));
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
			if (channel.slice(-7) == "_screen") {
				channel = channel.slice(0, -7);
				stream.core._.mode = "screenshare";
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