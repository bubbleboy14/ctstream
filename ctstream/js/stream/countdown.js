stream.countdown = {
	node: function(show) {
		return show ? (show.ttl > 0 ? [
				CT.dom.span(core.config.ctstream.copy.countdown),
				CT.dom.pad(),
				CT.parse.countdown(show.ttl)
			] : [
				CT.dom.span(core.config.ctstream.copy.ready),
				CT.dom.pad(),
				CT.dom.button("check it out!", function() {
					var opts = {
						"chat": true,
						"lurk": true,
						"channel": show.token
					};
					if (core.config.ctstream.multiplexer_opts.chatnames && location.hash)
						opts.user = location.hash.slice(1);
					CT.storage.set(core.config.ctstream.storage_key, opts);
					top.location = "/stream";
				})
			]) : core.config.ctstream.copy.nothing;
	},
	load: function(show, node) {
		CT.dom.setContent(node || document.body,
			stream.countdown.node(show));
	},
	widget: function(node) {
		CT.memcache.countdown.get("show", function(show) {
			stream.countdown.load(show, node);
		});
	}
};