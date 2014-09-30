util = {
	inherit: function(childClass, parentClass) {
		childClass.prototype = Object.create(parentClass.prototype);
		childClass.prototype.constructor = childClass;
	},
	makeSingletonGetter: function(classObject) {
		classObject.getInstance = function() {
			if(!classObject.instance)
				return classObject.instance = new classObject();
			return classObject.instance;
		};
	},
	checkInterface: function(implementation, wantedInterface) {
		for(var idx in wantedInterface.methods) {
			if(!implementation.prototype[idx])
				throw Error("Class " + implementation.name + " does not implement the method " + idx);
			if(implementation[idx] != wantedInterface.methods[idx])
				throw Error("Class " + implementation.name + " does not implement the method " + idx + " correctly");
		}
	},
	simulateClick: function(element) {
		var event = document.createEvent("MouseEvents"); 
		event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null); 
		element.dispatchEvent(event);
	},
	simulateFormSubmit: function(form) {
		var submitButton = util.makeElement("input", {type: "submit"});
		this.simulateClick(form.appendChild(submitButton));
		form.removeChild(submitButton);
	},
	enableEnterToSubmit: function(form) {
		form.appendChild(
			util.makeElement("input", {
				type: "submit",
				style: "height: 0px; width: 0px; border: none; padding: 0px;",
				hidefocus: true
			})
		);
	},
	preventFormSubmission: function(form) {
		form.addEventListener("submit", function(event) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		}, true);
	},
	checkAbstract: function(implementation, abstractParent) {
		for(var idx in abstractParent.abstracts) {
			if(!implementation.prototype[idx])
				throw Error("Class " + implementation.name + " does not implement the method " + idx);
			if(implementation.prototype[idx].length != abstractParent.abstracts[idx])
				throw Error("Class " + implementation.name + " does not implement the method " + idx + " correctly");
		}
	},
	removeFromArray: function(arr, obj) {
		arr.splice(arr.indexOf(obj), 1);
	},
	getOccurencesInString: function(str, what) {
		return str.split(what).length - 1;
	},
	arrayToList: function(arr, sorted) {
		sorted = sorted || false;
		var ul = document.createElement(sorted ? "ol" : "ul");
		for(var idx in arr) {
			var li = document.createElement("li");
			li.appendTextNode(arr[idx]);
			ul.appendChild(li);
		}
		return ul;
	},
	objectToSortedList: function(obj, attribs) {
		var keys = this.getKeysFromObject(obj);
		keys.sort();
		var ul = this.makeElement("ul", attribs);
		for(var idx in keys) {
			var li = document.createElement("li");
			var label = document.createElement("span");
			label.appendChild(document.createTextNode(keys[idx] + ":"));
			li.appendChild(label);
			li.appendChild(document.createTextNode(obj[keys[idx]]));
			ul.appendChild(li);
		}
		return ul;
	},
	getKeysFromObject: function(obj) {
		if(Object.keys)
			return Object.keys(obj);
		var ret = [];
		for(var key in obj)
			if(obj.hasOwnProperty(key))
				ret.push(key);
		return ret;
   },
	roundToDigit: function(val, decimals) {
		var b = Math.pow(10, decimals);
		return Math.round(val * b) / b;
	},
	sizePostFixes: [" MB", " GB", " TB", " PB", " EB", " ZB", " YB"],
	formatSizeMB: function(size) {
		if(size == 0)
			return "0 MB";
			
		var log = Math.log(size) / Math.log(1024);
		return this.roundToDigit((size / (Math.pow(1024, Math.floor(log)))), 3) + this.sizePostFixes[Math.ceil(log)-1];
	},
	makeAccessor: function(object, name, member, getter, setter) {
		if(getter !== true)
			object["set" + name] = getter ? getter : function(val) {
				this[member] = val;
			}
			
		if(setter !== true)
			object["get" + name] = setter ? setter : function() {
				return this[member];
			}
	},
	makeListAccessor: function(object, name, member) {
		object["add" + name] = function(val) {
			this[member].push(val);
			return val;
		}
		
		object["remove" + name] = function(val) {
			util.removeFromArray(this[member], val);
			return val;
		}
	},
	makeArrayGetter: function(object, name, member) {
		object["get" + name] = function() {
			return this[member].slice(0);
		}
	},
	makeGetByer: function(object, container, name, member) {
		object["getBy" + name] = function(value) {
			for(var idx in this[container])
				if(this[container][idx][member] == value)
					return this[container][idx];
		}
	},
	makeText: function(text) {
		return document.createTextNode(text);
	},
	isElement: function(obj) {
		try {
			return obj instanceof HTMLElement;
		} catch(e) {
			return (typeof obj==="object") &&
			(obj.nodeType === Node.ELEMENT_NODE) &&
			(typeof obj.style === "object") &&
			(typeof obj.ownerDocument === "object");
		}
	},
	
	
	/*
		Traverses the DOM sub-tree of the specified element or "document", calls the specified function for every element
		If the function returns any value the evaluates to false, the traverse will be cancelled
	*/
	domTraverse: function(elem, callback) {
		elem = elem || document;
		for(var child = elem.firstChild;child;child = child.nextSibling) {
			if(!this.isElement(child))
				continue;
			if(!callback(child))
				return;
		}
	},
	/*
		Traverses the DOM sub-tree of the specified element, calls the specified function for every element
		If the function returns any value the evaluates to true, the element will be present in the list returned by this
		function
	*/
	domTraverseGet: function(elem, callback) {
		var ret = [];
		for(var child = elem.firstChild;child;child = child.nextSibling) {
			if(!this.isElement(child))
				continue;
			if(callback(child))
				ret.push(child);
			ret = ret.concat(this.domTraverseGet(child, callback));
		}
		return ret;
	},
	inputNames: [
		"input",
		"select",
		"textarea"
	],
	getFormValues: function(form) {
		var inputs = this.domTraverseGet(form, function(elem) { return util.inputNames.indexOf(elem.tagName.toLowerCase()) != -1; });
		var ret = {};
		for(var idx in inputs) {
			if(!inputs[idx].name)
				continue;
				
			switch(inputs[idx].type) {
				case "radio":
				case "checkbox":
					if(!inputs[idx].checked)
						continue;
			}
			
			ret[inputs[idx].name] = inputs[idx].value;
		}
		return ret;
	},
	deepCopyTo: function(dest, source) {
		for(var idx in source) {
			if(source[idx] == null)
				continue;
			if(source[idx] instanceof Object) {
				if(!dest[idx])
					dest[idx] = {};
				deepCopyTo(dest[idx], source[idx]);
			} else
				dest[idx] = source[idx];
		}
	},
	appendChilds: function(elem, childs) {
		for(var idx in childs)
			elem.appendChild(childs[idx]);
	},
	addEventListeners: function(elem, listeners) {
		for(var eventName in listeners) {
			if(listeners[eventName] instanceof Function)
				elem.addEventListener(eventName, listeners[eventName]);
			else
				elem.addEventListener(eventName, listeners[eventName].handler, listeners[eventName].capture);
		}
	},
	addEventListenerObject: function(elem, events, listener) {
		for(var eventName in events)
			elem.addEventListener(eventName, listener, listeners[eventName]);
	},
	
	makeElement: function(name, attributes, childs, events) {
		var elem = document.createElement(name);
		if(attributes)
			this.deepCopyTo(elem, attributes);
		
		if(childs)
			this.appendChilds(elem, childs);
			
		if(events)
			this.addEventListeners(elem, events);
				
		return elem;
	},
	makeSelect: function(attributes, options) {
		var select = this.makeElement("select", attributes);
		for(var idx in options) {
			select.appendChild(this.makeElement("option", {
				value: options[idx].value,
				selected: options[idx].selected,
				}, [this.makeText(options[idx].text)]
			));
		}
		return select;
	},
	makeRecurseList: function(object, depthAttribs, depthPrefixes, depth) {
		depth = depth || 0;
		var ulElem = this.makeElement("ul", depthAttribs && depthAttribs[depth]);
		ulElem.classList.add("recursive-list-depth-" + depth);
		if(!(object instanceof Object))	
			return ulElem;
		
		if(object instanceof Array)
			for(var idx in object) {
				ulElem.appendChild(this.makeElement("li", {}, [
					this.makeText(object[idx])
				]));
			}
		else
			for(var idx in object) {
				ulElem.appendChild(this.makeElement("li", {}, [
					util.makeText(((depthPrefixes && depthPrefixes[depth]) ? (depthPrefixes[depth] + ": " + idx) : idx + ":")),
					this.makeRecurseList(object[idx], depthAttribs, depthPrefixes, depth + 1)
				]));
			}
		return ulElem;
	},
	makeToString: function(object, val) {
		return function() { return val; }
	},
	isNumber: function(val) {
		return isFinite(parseFloat(val));
	},
	copyTo: function(dest, source) {
		for(var idx in source)
			dest[idx] = source;
	},
	copyToNoOverride: function(dest, source) {
		for(var idx in source)
			if(!dest[idx])
				dest[idx] = source;
	},
	copyToRestricted: function(dest, source, what) {
		for(var idx in what)
			dest[what[idx]] = source[what[idx]];
		return dest;
	},
	makeInstanceDescriptorGetter: function(proto) {
		proto.getDescriptor = function() {
			var ret = [];
			for(idx in this.instances)
				ret.push(this.instances[idx].getDescriptor());
			return ret;
		}
	}
};