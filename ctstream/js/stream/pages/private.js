CT.require("CT.storage");
CT.require("core");

CT.storage.set(core.config.ctstream.storage_key, JSON.parse(atob(location.hash.slice(1))));
location = "/stream";