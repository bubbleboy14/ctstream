stream.countdown = {
	_show_or_no: function(show) {
		var opts = {
			chat: true,
			lurk: true,
			channel: show.token
		};
		if (core.config.ctstream.multiplexer_opts.chatnames && location.hash)
			opts.user = location.hash.slice(1);
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
	node: function(show) {
		return show ? (show.ttl > 0 ? [
				CT.dom.span(core.config.ctstream.copy.countdown.replace("[HOST]", show.meta.host)),
				CT.dom.pad(),
				CT.parse.countdown(show.ttl),
				CT.dom.pad(),
				CT.dom.span("(your time: " + stream.core.timestamp(show.ttl) + ")")
			] : stream.countdown._show_or_no(show)) : core.config.ctstream.copy.nothing;
	},
	load: function(show, node, extra) {
		var content = stream.countdown.node(show), _valid = function() {
			if (show)
				return content != core.config.ctstream.copy.nouser.replace("[HOST]", show.meta.host);
			else
				return !core.config.ctstream.multiplexer_opts.chatnames || !!location.hash.slice(1);
		}
		if (extra && _valid())
			content = [content, extra];
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