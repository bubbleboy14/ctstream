CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

var cfg = core.config.ctstream,
	cph = cfg.countdown_parent_host; 
if (cph && cfg.redirect &&
	document.referrer.indexOf(cph) == -1)
		window.open(cfg.redirect, "_top");

CT.onload(function() {
	CT.memcache.countdown.get("show", stream.core.loadCountdown);
});