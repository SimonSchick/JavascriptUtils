util = window.util || {};

util.debugging = {
	findKey: function(key, where, done) {
		key = key.toLowerCase();
		where = where || window;
		done = done || {};
		if(done[where])
			return;
		done[where] = true;
		for(var idx in where) {
			if(typeof idx == "string" && idx.toLowerCase().indexOf(key) !== -1)
				console.log("Found key in", where);
			if(where[idx] instanceof Object)
				this.findKey(key, where[idx], done);
		}
	}
};