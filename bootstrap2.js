util.bootstrap = {
	makeLabel: function(text, forID) {
		return util.makeElement("label", {
			for: forID,
			className: "control-label"
		}, [util.makeText(text)])
	},
	makeControlGroup: function(text, input) {
		return util.makeElement("div", {className: "control-group"}, [
			this.makeLabel(text, input.id),
			util.makeElement("div", {className: "controls"}, [input])
		]);
	}
};