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
					CT.storage.set(core.config.ctstream.storage_key, {
						"chat": true,
						"lurk": true,
						"channel": show.token
					});
					top.location = "/stream";
				})
			]) : core.config.ctstream.copy.nothing;
	},
	load: function(show, node) {
		CT.dom.setContent(node || document.body,
			stream.countdown.node(show));
	},
	widget: function() {
		CT.memcache.countdown.get("show", stream.countdown.load);
	}
};