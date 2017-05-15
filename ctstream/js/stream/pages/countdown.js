CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

var cfg = core.config.ctstream,
	cph = cfg.countdown_parent_host; 
if (cph && cfg.redirect &&
	location.hostname.indexOf("localhost") == -1 &&
	document.referrer.indexOf(cph) == -1)
		window.open(cfg.redirect, "_top");

CT.onload(function() {
	stream.countdown.widget(null, cfg.countdown_extra && cfg.countdown_extra());
});