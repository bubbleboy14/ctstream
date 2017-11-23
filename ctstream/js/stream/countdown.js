stream.countdown = {
	_show_or_no: function(show) {
		var opts = {
			chat: true,
			lurk: true,
			channel: show.token
		};
		if (core.config.ctstream.multiplexer_opts.chatnames && location.hash) {
			opts.user = location.hash.slice(1);
			opts.inferred = true;
		}
		if (core.config.ctstream.require_username && !opts.user)
			return core.config.ctstream.copy.nouser.replace("[HOST]", show.meta.host);
		return [
			CT.dom.span(core.config.ctstream.copy.ready.replace("[HOST]", show.meta.host)),
			CT.dom.pad(),
			CT.dom.button("check it out!", function() {
				CT.storage.set(core.config.ctstream.storage_key, opts);
				top.location = "/stream";
			})
		];
	},
	_count: function(show) {
		var d = [
			CT.dom.span(core.config.ctstream.copy.countdown.replace("[HOST]", show.meta.host)),
			CT.dom.pad()
		];
		if (CT.info.mobile)
			d.push(CT.dom.span("on " + stream.core.timestamp(show.ttl)));
		else {
			d.push(CT.dom.span("starts in"));
			d.push(CT.dom.pad());
			d.push(CT.parse.countdown(show.ttl, stream.countdown.ready));
			d.push(CT.dom.pad());
			d.push(CT.dom.span("(your time: " + stream.core.timestamp(show.ttl) + ")"));
		}
		return d;
	},
	node: function(show) {
		return show ? (show.ttl > 0 ? stream.countdown._count(show) :
			stream.countdown._show_or_no(show)) : core.config.ctstream.copy.nothing;
	},
	ready: function() {
		var o = stream.countdown._opts;
		o.show.ttl = 0;
		stream.countdown.load(o.show, o.node, o.extras);
	},
	load: function(show, node, extra) {
		stream.countdown._opts = { show: show, node: node, extra: extra };
		var content = stream.countdown.node(show), _valid = function() {
//			if (show)
//				return content != core.config.ctstream.copy.nouser.replace("[HOST]", show.meta.host);
//			else
				return !core.config.ctstream.multiplexer_opts.chatnames || !!location.hash.slice(1);
		}
		if (extra && _valid())
			content = [extra, CT.dom[CT.info.mobile ? "span" : "div"](content)];
		CT.dom.setContent(node || document.body,
			CT.dom.div(content, core.config.ctstream.countdown_class));
	},
	widget: function(node, extra) {
		CT.memcache.countdown.get(core.config.ctstream.default_channel,
			function(show) {
				stream.countdown.load(show, node, extra);
			});
	}
};