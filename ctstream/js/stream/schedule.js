stream.schedule = {
	load: function(show, name) {
		var cfg =  core.config.ctstream;
		name = name || cfg.default_channel;
		var node = CT.dom.id(name), isnew = false,
			priv = name != cfg.default_channel,
			tnode = CT.dom.div(priv ? name : "Public", "biggest");
		if (!node) {
			isnew = true;
			node = CT.dom.div(null, null, name);
			CT.dom.addContent("private", node);
		}
		if (show) {
			var content = [
				tnode,
				CT.dom.div("Next show in", "bigger padded"),
				CT.parse.countdown(show.ttl),
				CT.dom.div("Host: " + show.meta.host, "big padded"),
				CT.dom.button("stream it!", function() {
					CT.storage.set(cfg.storage_key, {
						"chat": true,
						"channel": show.token,
						"user": show.meta.host
					});
					location = "/stream";
				}),
				CT.dom.pad(),
				CT.dom.button("cancel!", function() {
					CT.net.post({
						path: "/_stream",
						params: {
							pw: stream.core._pw,
							action: "clear"
						},
						cb: function(show) {
							stream.schedule.load(show, name);
						}
					});
				})
			];
			if (priv) {
				content.push(CT.dom.pad());
				content.push(CT.dom.button("show link", function() {
					var token = escape(btoa(JSON.stringify({
						channel: show.token,
						user_prompt: true
					}))), link = "https://" + location.host + "/stream/private.html#" + token;
					(new CT.modal.Modal({
						content: [
							CT.dom.div("Here's a link to the private show:", "bigger bold"),
							CT.dom.link(link, null, link)
						]
					})).show();
				}));
				content.push(CT.dom.pad());
				content.push(CT.dom.button("email invitations", function() {
					(new CT.modal.Prompt({
						isTA: true,
						inputClass: "w1 block",
						prompt: [
							"Please enter the text of your email below. Include the following tokens:",
							"{link} -&gt; link to the stream goes here",
							"{time} -&gt; date/time of stream goes here",
							"{password} -&gt; password goes here"
						],
						cb: function(msg) {
							(new CT.modal.Prompt({
								style: "multiple-string",
								prompt: "whom do you want to email?",
								cb: function(addrs) {
									CT.net.post({
										path: "/_stream",
										params: {
											msg: msg,
											show: name,
											emails: addrs,
											action: "invite",
											pw: stream.core._pw
										},
										eb: function(e) {
											alert("there was a problem: " + e);
										},
										cb: function() {
											alert("success!");
										}
									});
								}
							})).show();
						}
					})).show();
				}));
			}
			CT.dom.setContent(node, CT.dom.div(content, "padded centered"));
		} else if (priv && !isnew)
			CT.dom.remove(name);
		else { // scheduling interface
			var ds = CT.dom.dateSelectors({ withtime: true }),
				hn = CT.dom.smartField({ blurs: ["Host Name"] });
			CT.dom.setContent(node, CT.dom.div([
				tnode,
				CT.dom.div("Schedule a show!", "bigger padded"),
				ds,
				CT.dom.br(),
				hn,
				CT.dom.br(),
				CT.dom.button("do it", function() {
					var val = ds.value();
					if (!val) return;
					var secs = ~~((CT.parse.string2date(val) - Date.now()) / 1000);
					CT.memcache.countdown.set(name, secs, function() {
						CT.memcache.countdown.get(name, function(show) {
							stream.schedule.load(show, name);
						});
					}, { host: CT.dom.getFieldValue(hn) || cfg.default_hostname });
				})
			], "padded centered"));
		}
	},
	custom: function(name) {
		CT.memcache.countdown.get(name, function(show) {
			stream.schedule.load(show, name);
		});
	},
	test: function(streamer) { /* streamer is mouse event -- whatever */
		var opts = {
			chat: true,
			channel: stream.schedule._testChannel
		};
		if (streamer)
			opts.name = core.config.ctstream.default_hostname;
		else {
			opts.lurk = true;
			opts.name = "user" + CT.data.numstr(5);
		}
		CT.storage.set(core.config.ctstream.storage_key, opts);
		window.open("/stream", "_blank");
	},
	init: function() {
		stream.schedule._testChannel = CT.data.numstr(10);
		CT.dom.setContent("ctmain", [
			CT.dom.div([
				CT.dom.button("Private Show", function() {
					(new CT.modal.Prompt({
						noClose: true,
						prompt: "What's the password for this show?",
						cb: stream.schedule.custom
					})).show();
				}),
				CT.dom.pad(),
				CT.dom.button("Test Streaming", stream.schedule.test),
				CT.dom.pad(),
				CT.dom.button("Test Watching", function() {
					stream.schedule.test();
				})
			], "right padded"),
			CT.dom.div(null, "clearnode"),
			CT.dom.div(null, null, core.config.ctstream.default_channel),
			CT.dom.div(null, null, "private")
		]);
		CT.memcache.countdown.list(function(chans) {
			chans.forEach(function(chan) {
				CT.memcache.countdown.get(chan, function(show) {
					stream.schedule.load(show, chan);
				});
			});
			if (chans.indexOf(core.config.ctstream.default_channel) == -1)
				CT.memcache.countdown.get(core.config.ctstream.default_channel, stream.schedule.load);
		});
	}
};