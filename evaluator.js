(function() {
	function isNumber(val) {
		return isFinite(parseFloat(val));
	}
	
	function copyTo(dest, source, what) {
		for(var idx in what)
			dest[what[idx]] = source[what[idx]];
		return dest;
	}
	
	var regExp = /([a-z]\w*)/ig;
	
	var register = {};
	
	var constants = {
		pi: Math.PI,
		e: Math.E
	};
	
	var funcs = copyTo(
		{
			millis: function() {
				return Date.now();
			},
			rad: function(deg) {
				return deg/180 * Math.PI;
			},
			deg: function(rad) {
				return (rad * 180) / Math.PI;
			},
			string: function(val) {
				return val.toString();
			},
			sumElements: function(selector) {
				var elements = document.querySelectorAll(selector);
				var sum = 0;
				for(var idx in elements) {
					var elem = elements[idx];
					if(elem.valueAsNumber && isNumber(elem.valueAsNumber))
						sum += elem.valueAsNumber;
					else if(elem.value && isNumber(elem.value))
						sum += parseFloat(elem.value);
					else if(elem.textContent && isNumber(elem.textContent))
						sum += parseFloat(elem.textContent);
				}
				return sum;
			}
		},
		Math,
		["abs", "acos", "asin", "atan", "atan2", "ceil", "cos", "exp", "floor", "imul", "log", "max", "min", "pow", "random", "round", "sin", "sqrt"]
	);
	
	window.___xpsFuncs = funcs;
	
	function replacer(match) {
		if(document.getElementById(match))
			return "parseInt(document.getElementById(\"" + match + "\").value)";
		if(constants[match])
			return constants[match];
		return match;
	}
	
	function applyOutputEvaluators(form) {
		
		var outputs = form.querySelectorAll(":scope output[expression]");
					
		for(var idx in outputs) {
			if(!isNumber(idx))
				continue;
			var expression = outputs[idx].getAttribute("expression");
				
			var inputs = expression.match(regExp);
			for(var idx2 in inputs) {
				if(inputs[idx2] in funcs)
					continue;
				if(!document.getElementById(inputs[idx2])) {
					throw new Error("Expression \"" + expression + "\" contains unknown input");
				}
				(function(inputs, outputs, idx, idx2) {
					document.getElementById(inputs[idx2]).addEventListener("input", function(event) {
						register[outputs[idx]](outputs[idx]);
					});
				})(inputs, outputs, idx, idx2);
			}
			try {
				register[outputs[idx]] = new Function("output", "with (___xpsFuncs) { output.value = " + expression.replace(regExp, replacer) + " }");
			} catch(e) {
				throw new Error("Invalid expression \"" + expression + "\"");
			}
			var evalInterval = outputs[idx].getAttribute("eval_interval");
			
			if(isNumber(evalInterval))
				(function(outputs, idx, evalInterval) {
					setInterval(function() { register[outputs[idx]](outputs[idx]) }, parseFloat(evalInterval) * 1000);
				})(outputs, idx, evalInterval);
		}
	}
	
	outputEvaluators = {
		apply: applyOutputEvaluators,
		addFunction: function(name, func) {
			funcs[name] = func;
		},
		addConstant: function(name, value) {
			constants[name] = value;
		}
	};
})();