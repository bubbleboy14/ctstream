CT.require("CT.all");
CT.require("core");

var pwPrompt = function(cfg) {
	(new CT.modal.Prompt({
		prompt: "what's the password?",
		cb: function(val) {
			CT.memcache.countdown.get(val, function(show) {
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
};

var uPrompt = function(cfg) {
	(new CT.modal.Prompt({
		prompt: "what's your nickname?",
		cb: function(val) {
			cfg.user = val;
			pwPrompt(cfg);
		}
	})).show();
};

CT.onload(function() {
	var cfg = JSON.parse(atob(unescape(location.hash.slice(1))));
	if (cfg.user_prompt) {
		delete cfg.user_prompt;
		uPrompt(cfg);
	} else
		pwPrompt(cfg);
});
