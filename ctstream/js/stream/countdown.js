stream.countdown = {
	_show_or_no: function(show) {
		var opts = {
			"chat": true,
			"lurk": true,
			"channel": show.token
		};
		if (core.config.ctstream.multiplexer_opts.chatnames && location.hash)
			opts.user = location.hash.slice(1);
		if (core.config.ctstream.require_username && !opts.user)
			return core.config.ctstream.copy.nouser;
		return [
			CT.dom.span(core.config.ctstream.copy.ready),
			CT.dom.pad(),
			CT.dom.button("check it out!", function() {
				CT.storage.set(core.config.ctstream.storage_key, opts);
				top.location = "/stream";
			})
		];
	},
	node: function(show) {
		return show ? (show.ttl > 0 ? [
				CT.dom.span(core.config.ctstream.copy.countdown),
				CT.dom.pad(),
				CT.parse.countdown(show.ttl)
			] : stream.countdown._show_or_no(show)) : core.config.ctstream.copy.nothing;
	},
	load: function(show, node) {
		CT.dom.setContent(node || document.body,
			CT.dom.div(stream.countdown.node(show), core.config.ctstream.countdown_class));
	},
	widget: function(node) {
		CT.memcache.countdown.get("show", function(show) {
			stream.countdown.load(show, node);
		});
	}
};