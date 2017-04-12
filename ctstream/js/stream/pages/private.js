CT.require("CT.storage");
CT.require("core");

var cfg = JSON.parse(atob(unescape(location.hash.slice(1))));
cfg.chat = true;
cfg.lurk = true;
CT.storage.set(core.config.ctstream.storage_key, cfg);
location = "/stream";