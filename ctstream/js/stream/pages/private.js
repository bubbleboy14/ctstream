CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	(new CT.modal.Prompt({
		prompt: "what's the password?",
		cb: function(val) {
			CT.memcache.countdown.get(val, function(show) {
				var cfg = JSON.parse(atob(unescape(location.hash.slice(1))));
				cfg.chat = true;
				cfg.lurk = true;
				if (show && show.token == cfg.channel) {
					CT.storage.set(core.config.ctstream.storage_key, cfg);
					location = "/stream";
				} else
					location = core.config.ctstream.redirect;
			});
		}
	})).show();
});
