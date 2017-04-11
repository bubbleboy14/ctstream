CT.require("CT.all");
CT.require("core");
CT.require("stream.core");

CT.onload(function() {
	stream.core.credz(function() {
		CT.initCore();
		stream.schedule.init();
	});
});