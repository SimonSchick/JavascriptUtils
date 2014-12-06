(function() {
	var reg = /%(?:(\d+)\$)?([+ #-]*)('(.)|0)?((?:\d|\*)+)?(?:\.([\d*]*))?([bdiuoxXfFeEgGaAcsp%])/g

	String.prototype.repeat = function(num) {
		if(num < 0)
			return "";
		return new Array(num + 1).join(this);
	};

	String.prototype.paddLeft = function(length, what) {
		if(length <= this.length)
			return this;
		what = what || " ";
		return what.repeat(length - this.length) + this;
	};

	String.prototype.paddRight = function(length, what) {
		if(length <= this.length)
			return this;
		what = what || " ";
		return this + what.repeat(length - this.length);
	};

	String.prototype.contains = function(what) {
		return this.indexOf(what) !== -1;
	};

	function stringPrecision(str, prec) {
		return str;
	};

	var types = {
		number: 0,
		string: 1
	};

	function precBase(base, value, precision) {
		var val = value.toString(base); 
		var floatingPoint = val.indexOf(".");
		return val.substring(0, floatingPoint + precision + 1);
	}
	var specifiers = {
		d: {
			transform: function(a) { return a | 0},
			allowSign: true,
			type: types.number
		},
		u: {
			transform: function(a) { return a >>> 0; },
			allowSign: true,
			type: types.number
		},
		o: {
			transform: function(a) { return a.toString(8); },
			prefix: "0",
			type: types.number
		},
		x: {
			transform: function(a) { return Math.floor(a).toString(16); },
			prefix: "0x",
			type: types.number
		},
		X: {
			transform: function(a) { return specifiers.x.transform(a).toUpperCase(); },
			prefix: "0X",
			type: types.number
		},
		f: {
			transform: function(a, b) { return a.toFixed(b); },
			allowSign: true,
			type: types.number
		},
		e: {
			transform: function(a, b) { return a.toExponential(b); },
			allowSign: true
		},
		E: {
			transform: function(a, b) { return specifiers.e.transform(a, b).toUpperCase(); },
			allowSign: true,
			type: types.number
		},
		g: {
			transform: function(a, b) { return a.toPrecision(b); },
			allowSign: true,
			type: types.number
		},
		G: {
			transform: function(a, b) { return specifiers.g.transform(a, b).toUpperCase(); },
			allowSign: true,
			type: types.number
		},
		a: {
			transform: function(a, b) {
				return precBase(16, a, b) + "p0";
			},
			allowSign: true,
			prefix: "0x",
			type: types.number
		},
		A: {
			transform: function(a, b) { return specifiers.a.transform(a, b).toUpperCase(); },
			allowSign: true,
			prefix: "0X",
			type: types.number
		},
		c: {
			transform: String.fromCharCode
		},
		s: {
			type: types.string
		},
		b: {
			transform: function(a, b) { return precBase(2, a, b); },
			type: types.number
		}
	};

	specifiers.i = specifiers.d;
	specifiers.F = specifiers.F;

	String.format = function(formatString) {
		var matches;
		var ret = [];
		var values = [];
		var valueIdx = 1;
		var parentArguments = arguments;
		return formatString.replace(reg, function() {
			debugger;
			var reference = arguments[1] || valueIdx;

			var flags = arguments[2] || "";

			var leftJustify = flags.contains("-");
			var forceSign = flags.contains("+");
			var blankFill = flags.contains(" ");
			var forcePrecisionOrPrefix = flags.contains("#");
			var zeroPadd = flags.contains("0");

			var customPadding = arguments[4];

			var padding = customPadding || " ";

			var value = parentArguments[reference];

			var width = parseInt(arguments[5]) || 0;
			if(width == "*") {
				width = parentArguments[reference++];
				if(!width)
					throw new Error("No value for dynamic width for parameter no. " + (reference - 2));
			}

			var precision = parseInt(arguments[6]) || 6;
			if(precision == "*") {
				precision = parentArguments[reference++];
				if(!precision)
					throw new Error("No value for dynamic precision for parameter no. " + (reference - 3));
			}
			var type = arguments[7];

			if(type == "%")
				return "%";

			var specifier = specifiers[type];
			if(!specifier)
				throw new Error("Unsupport identified '" + type + "'");

			if(!value)
				throw new Error("No value for format parameter no. " + (reference - 1));

			if(specifier.type == types.number && !parseInt(value))
				throw new Error("Invalid value for format parameter no. " + (reference - 1) + " expected number, got string");
			var ret = specifier.transform ? specifier.transform(value, precision) : value;
			var allowSign = specifier.allowSign;
			var prefix = specifier.prefix;
			
			ret = ret.toString().replace("-", "");
			
			var fullPrefix = (forcePrecisionOrPrefix ? prefix : "") + ((forceSign && allowSign == "+" && value > 0) ? "+" : ((value < 0) ? "-" : (blankFill ? " ": "")));


			var method = leftJustify ? String.prototype.paddRight : String.prototype.paddLeft;

			if(padding == "0")
				return fullPrefix + method.call(ret, width, "0");
			else
				return method.call(fullPrefix + ret, width, padding);
		});
	};
})();