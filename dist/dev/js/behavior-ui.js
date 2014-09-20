/*
---

name: Core

description: The heart of MooTools.

license: MIT-style license.

copyright: Copyright (c) 2006-2012 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
  - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
  - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Core, MooTools, Type, typeOf, instanceOf, Native]

...
*/

(function(){

this.MooTools = {
	version: '1.5.0',
	build: '0f7b690afee9349b15909f33016a25d2e4d9f4e3'
};

// typeOf, instanceOf

var typeOf = this.typeOf = function(item){
	if (item == null) return 'null';
	if (item.$family != null) return item.$family();

	if (item.nodeName){
		if (item.nodeType == 1) return 'element';
		if (item.nodeType == 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
	} else if (typeof item.length == 'number'){
		if ('callee' in item) return 'arguments';
		if ('item' in item) return 'collection';
	}

	return typeof item;
};

var instanceOf = this.instanceOf = function(item, object){
	if (item == null) return false;
	var constructor = item.$constructor || item.constructor;
	while (constructor){
		if (constructor === object) return true;
		constructor = constructor.parent;
	}
	/*<ltIE8>*/
	if (!item.hasOwnProperty) return false;
	/*</ltIE8>*/
	return item instanceof object;
};

// Function overloading

var Function = this.Function;

var enumerables = true;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

Function.prototype.overloadSetter = function(usePlural){
	var self = this;
	return function(a, b){
		if (a == null) return this;
		if (usePlural || typeof a != 'string'){
			for (var k in a) self.call(this, k, a[k]);
			if (enumerables) for (var i = enumerables.length; i--;){
				k = enumerables[i];
				if (a.hasOwnProperty(k)) self.call(this, k, a[k]);
			}
		} else {
			self.call(this, a, b);
		}
		return this;
	};
};

Function.prototype.overloadGetter = function(usePlural){
	var self = this;
	return function(a){
		var args, result;
		if (typeof a != 'string') args = a;
		else if (arguments.length > 1) args = arguments;
		else if (usePlural) args = [a];
		if (args){
			result = {};
			for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
		} else {
			result = self.call(this, a);
		}
		return result;
	};
};

Function.prototype.extend = function(key, value){
	this[key] = value;
}.overloadSetter();

Function.prototype.implement = function(key, value){
	this.prototype[key] = value;
}.overloadSetter();

// From

var slice = Array.prototype.slice;

Function.from = function(item){
	return (typeOf(item) == 'function') ? item : function(){
		return item;
	};
};

Array.from = function(item){
	if (item == null) return [];
	return (Type.isEnumerable(item) && typeof item != 'string') ? (typeOf(item) == 'array') ? item : slice.call(item) : [item];
};

Number.from = function(item){
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

String.from = function(item){
	return item + '';
};

// hide, protect

Function.implement({

	hide: function(){
		this.$hidden = true;
		return this;
	},

	protect: function(){
		this.$protected = true;
		return this;
	}

});

// Type

var Type = this.Type = function(name, object){
	if (name){
		var lower = name.toLowerCase();
		var typeCheck = function(item){
			return (typeOf(item) == lower);
		};

		Type['is' + name] = typeCheck;
		if (object != null){
			object.prototype.$family = (function(){
				return lower;
			}).hide();
			//<1.2compat>
			object.type = typeCheck;
			//</1.2compat>
		}
	}

	if (object == null) return null;

	object.extend(this);
	object.$constructor = Type;
	object.prototype.$constructor = object;

	return object;
};

var toString = Object.prototype.toString;

Type.isEnumerable = function(item){
	return (item != null && typeof item.length == 'number' && toString.call(item) != '[object Function]' );
};

var hooks = {};

var hooksOf = function(object){
	var type = typeOf(object.prototype);
	return hooks[type] || (hooks[type] = []);
};

var implement = function(name, method){
	if (method && method.$hidden) return;

	var hooks = hooksOf(this);

	for (var i = 0; i < hooks.length; i++){
		var hook = hooks[i];
		if (typeOf(hook) == 'type') implement.call(hook, name, method);
		else hook.call(this, name, method);
	}

	var previous = this.prototype[name];
	if (previous == null || !previous.$protected) this.prototype[name] = method;

	if (this[name] == null && typeOf(method) == 'function') extend.call(this, name, function(item){
		return method.apply(item, slice.call(arguments, 1));
	});
};

var extend = function(name, method){
	if (method && method.$hidden) return;
	var previous = this[name];
	if (previous == null || !previous.$protected) this[name] = method;
};

Type.implement({

	implement: implement.overloadSetter(),

	extend: extend.overloadSetter(),

	alias: function(name, existing){
		implement.call(this, name, this.prototype[existing]);
	}.overloadSetter(),

	mirror: function(hook){
		hooksOf(this).push(hook);
		return this;
	}

});

new Type('Type', Type);

// Default Types

var force = function(name, object, methods){
	var isType = (object != Object),
		prototype = object.prototype;

	if (isType) object = new Type(name, object);

	for (var i = 0, l = methods.length; i < l; i++){
		var key = methods[i],
			generic = object[key],
			proto = prototype[key];

		if (generic) generic.protect();
		if (isType && proto) object.implement(key, proto.protect());
	}

	if (isType){
		var methodsEnumerable = prototype.propertyIsEnumerable(methods[0]);
		object.forEachMethod = function(fn){
			if (!methodsEnumerable) for (var i = 0, l = methods.length; i < l; i++){
				fn.call(prototype, prototype[methods[i]], methods[i]);
			}
			for (var key in prototype) fn.call(prototype, prototype[key], key);
		};
	}

	return force;
};

force('String', String, [
	'charAt', 'charCodeAt', 'concat', 'contains', 'indexOf', 'lastIndexOf', 'match', 'quote', 'replace', 'search',
	'slice', 'split', 'substr', 'substring', 'trim', 'toLowerCase', 'toUpperCase'
])('Array', Array, [
	'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice',
	'indexOf', 'lastIndexOf', 'filter', 'forEach', 'every', 'map', 'some', 'reduce', 'reduceRight'
])('Number', Number, [
	'toExponential', 'toFixed', 'toLocaleString', 'toPrecision'
])('Function', Function, [
	'apply', 'call', 'bind'
])('RegExp', RegExp, [
	'exec', 'test'
])('Object', Object, [
	'create', 'defineProperty', 'defineProperties', 'keys',
	'getPrototypeOf', 'getOwnPropertyDescriptor', 'getOwnPropertyNames',
	'preventExtensions', 'isExtensible', 'seal', 'isSealed', 'freeze', 'isFrozen'
])('Date', Date, ['now']);

Object.extend = extend.overloadSetter();

Date.extend('now', function(){
	return +(new Date);
});

new Type('Boolean', Boolean);

// fixes NaN returning as Number

Number.prototype.$family = function(){
	return isFinite(this) ? 'number' : 'null';
}.hide();

// Number.random

Number.extend('random', function(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
});

// forEach, each

var hasOwnProperty = Object.prototype.hasOwnProperty;
Object.extend('forEach', function(object, fn, bind){
	for (var key in object){
		if (hasOwnProperty.call(object, key)) fn.call(bind, object[key], key, object);
	}
});

Object.each = Object.forEach;

Array.implement({

	/*<!ES5>*/
	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) fn.call(bind, this[i], i, this);
		}
	},
	/*</!ES5>*/

	each: function(fn, bind){
		Array.forEach(this, fn, bind);
		return this;
	}

});

// Array & Object cloning, Object merging and appending

var cloneOf = function(item){
	switch (typeOf(item)){
		case 'array': return item.clone();
		case 'object': return Object.clone(item);
		default: return item;
	}
};

Array.implement('clone', function(){
	var i = this.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(this[i]);
	return clone;
});

var mergeOne = function(source, key, current){
	switch (typeOf(current)){
		case 'object':
			if (typeOf(source[key]) == 'object') Object.merge(source[key], current);
			else source[key] = Object.clone(current);
		break;
		case 'array': source[key] = current.clone(); break;
		default: source[key] = current;
	}
	return source;
};

Object.extend({

	merge: function(source, k, v){
		if (typeOf(k) == 'string') return mergeOne(source, k, v);
		for (var i = 1, l = arguments.length; i < l; i++){
			var object = arguments[i];
			for (var key in object) mergeOne(source, key, object[key]);
		}
		return source;
	},

	clone: function(object){
		var clone = {};
		for (var key in object) clone[key] = cloneOf(object[key]);
		return clone;
	},

	append: function(original){
		for (var i = 1, l = arguments.length; i < l; i++){
			var extended = arguments[i] || {};
			for (var key in extended) original[key] = extended[key];
		}
		return original;
	}

});

// Object-less types

['Object', 'WhiteSpace', 'TextNode', 'Collection', 'Arguments'].each(function(name){
	new Type(name);
});

// Unique ID

var UID = Date.now();

String.extend('uniqueID', function(){
	return (UID++).toString(36);
});

//<1.2compat>

var Hash = this.Hash = new Type('Hash', function(object){
	if (typeOf(object) == 'hash') object = Object.clone(object.getClean());
	for (var key in object) this[key] = object[key];
	return this;
});

Hash.implement({

	forEach: function(fn, bind){
		Object.forEach(this, fn, bind);
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('each', 'forEach');

Object.type = Type.isObject;

var Native = this.Native = function(properties){
	return new Type(properties.name, properties.initialize);
};

Native.type = Type.type;

Native.implement = function(objects, methods){
	for (var i = 0; i < objects.length; i++) objects[i].implement(methods);
	return Native;
};

var arrayType = Array.type;
Array.type = function(item){
	return instanceOf(item, Array) || arrayType(item);
};

this.$A = function(item){
	return Array.from(item).slice();
};

this.$arguments = function(i){
	return function(){
		return arguments[i];
	};
};

this.$chk = function(obj){
	return !!(obj || obj === 0);
};

this.$clear = function(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

this.$defined = function(obj){
	return (obj != null);
};

this.$each = function(iterable, fn, bind){
	var type = typeOf(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array' || type == 'elements') ? Array : Object).each(iterable, fn, bind);
};

this.$empty = function(){};

this.$extend = function(original, extended){
	return Object.append(original, extended);
};

this.$H = function(object){
	return new Hash(object);
};

this.$merge = function(){
	var args = Array.slice(arguments);
	args.unshift({});
	return Object.merge.apply(null, args);
};

this.$lambda = Function.from;
this.$mixin = Object.merge;
this.$random = Number.random;
this.$splat = Array.from;
this.$time = Date.now;

this.$type = function(object){
	var type = typeOf(object);
	if (type == 'elements') return 'array';
	return (type == 'null') ? false : type;
};

this.$unlink = function(object){
	switch (typeOf(object)){
		case 'object': return Object.clone(object);
		case 'array': return Array.clone(object);
		case 'hash': return new Hash(object);
		default: return object;
	}
};

//</1.2compat>

})();

/*
---

name: Array

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires: [Type]

provides: Array

...
*/

Array.implement({

	/*<!ES5>*/
	every: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var value, i = 0, l = this.length >>> 0; i < l; i++) if (i in this){
			value = this[i];
			if (fn.call(bind, value, i, this)) results.push(value);
		}
		return results;
	},

	indexOf: function(item, from){
		var length = this.length >>> 0;
		for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var length = this.length >>> 0, results = Array(length);
		for (var i = 0; i < length; i++){
			if (i in this) results[i] = fn.call(bind, this[i], i, this);
		}
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},
	/*</!ES5>*/

	clean: function(){
		return this.filter(function(item){
			return item != null;
		});
	},

	invoke: function(methodName){
		var args = Array.slice(arguments, 1);
		return this.map(function(item){
			return item[methodName].apply(item, args);
		});
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	append: function(array){
		this.push.apply(this, array);
		return this;
	},

	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[Number.random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--;){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = typeOf(this[i]);
			if (type == 'null') continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments' || instanceOf(this[i], Array)) ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	pick: function(){
		for (var i = 0, l = this.length; i < l; i++){
			if (this[i] != null) return this[i];
		}
		return null;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return parseInt(value, 16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});

//<1.2compat>

Array.alias('extend', 'append');

var $pick = function(){
	return Array.from(arguments).pick();
};

//</1.2compat>

/*
---

name: String

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires: [Type, Array]

provides: String

...
*/

String.implement({

	//<!ES6>
	contains: function(string, index){
		return (index ? String(this).slice(index) : String(this)).indexOf(string) > -1;
	},
	//</!ES6>

	test: function(regex, params){
		return ((typeOf(regex) == 'regexp') ? regex : new RegExp('' + regex, params)).test(this);
	},

	trim: function(){
		return String(this).replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return String(this).replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return String(this).replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return String(this).replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return String(this).replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return String(this).replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = String(this).match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = String(this).match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	substitute: function(object, regexp){
		return String(this).replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != null) ? object[name] : '';
		});
	}

});

//<1.4compat>
String.prototype.contains = function(string, separator){
	return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : String(this).indexOf(string) > -1;
};
//</1.4compat>

/*
---

name: Function

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires: Type

provides: Function

...
*/

Function.extend({

	attempt: function(){
		for (var i = 0, l = arguments.length; i < l; i++){
			try {
				return arguments[i]();
			} catch (e){}
		}
		return null;
	}

});

Function.implement({

	attempt: function(args, bind){
		try {
			return this.apply(bind, Array.from(args));
		} catch (e){}

		return null;
	},

	/*<!ES5-bind>*/
	bind: function(that){
		var self = this,
			args = arguments.length > 1 ? Array.slice(arguments, 1) : null,
			F = function(){};

		var bound = function(){
			var context = that, length = arguments.length;
			if (this instanceof bound){
				F.prototype = self.prototype;
				context = new F;
			}
			var result = (!args && !length)
				? self.call(context)
				: self.apply(context, args && length ? args.concat(Array.slice(arguments)) : args || arguments);
			return context == that ? result : context;
		};
		return bound;
	},
	/*</!ES5-bind>*/

	pass: function(args, bind){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(){
			return self.apply(bind, args || arguments);
		};
	},

	delay: function(delay, bind, args){
		return setTimeout(this.pass((args == null ? [] : args), bind), delay);
	},

	periodical: function(periodical, bind, args){
		return setInterval(this.pass((args == null ? [] : args), bind), periodical);
	}

});

//<1.2compat>

delete Function.prototype.bind;

Function.implement({

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != null) ? Array.from(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return Function.attempt(returns);
			return returns();
		};
	},

	bind: function(bind, args){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(){
			return self.apply(bind, args || arguments);
		};
	},

	bindWithEvent: function(bind, args){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(event){
			return self.apply(bind, (args == null) ? arguments : [event].concat(args));
		};
	},

	run: function(args, bind){
		return this.apply(bind, Array.from(args));
	}

});

if (Object.create == Function.prototype.create) Object.create = null;

var $try = Function.attempt;

//</1.2compat>

/*
---

name: Number

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires: Type

provides: Number

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('each', 'times');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat(Array.from(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);

/*
---

name: Class

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires: [Array, String, Function, Number]

provides: Class

...
*/

(function(){

var Class = this.Class = new Type('Class', function(params){
	if (instanceOf(params, Function)) params = {initialize: params};

	var newClass = function(){
		reset(this);
		if (newClass.$prototyping) return this;
		this.$caller = null;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		this.$caller = this.caller = null;
		return value;
	}.extend(this).implement(params);

	newClass.$constructor = Class;
	newClass.prototype.$constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
});

var parent = function(){
	if (!this.$caller) throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name,
		parent = this.$caller.$owner.parent,
		previous = (parent) ? parent.prototype[name] : null;
	if (!previous) throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};

var reset = function(object){
	for (var key in object){
		var value = object[key];
		switch (typeOf(value)){
			case 'object':
				var F = function(){};
				F.prototype = value;
				object[key] = reset(new F);
			break;
			case 'array': object[key] = value.clone(); break;
		}
	}
	return object;
};

var wrap = function(self, key, method){
	if (method.$origin) method = method.$origin;
	var wrapper = function(){
		if (method.$protected && this.$caller == null) throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current; this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current; this.caller = caller;
		return result;
	}.extend({$owner: self, $origin: method, $name: key});
	return wrapper;
};

var implement = function(key, value, retain){
	if (Class.Mutators.hasOwnProperty(key)){
		value = Class.Mutators[key].call(this, value);
		if (value == null) return this;
	}

	if (typeOf(value) == 'function'){
		if (value.$hidden) return this;
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		Object.merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass){
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

Class.implement('implement', implement.overloadSetter());

Class.Mutators = {

	Extends: function(parent){
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements: function(items){
		Array.from(items).each(function(item){
			var instance = new item;
			for (var key in instance) implement.call(this, key, instance[key], true);
		}, this);
	}
};

})();

/*
---

name: Class.Extras

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires: Class

provides: [Class.Extras, Chain, Events, Options]

...
*/

(function(){

this.Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.append(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

this.Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = removeOn(type);

		/*<1.2compat>*/
		if (fn == $empty) return this;
		/*</1.2compat>*/

		this.$events[type] = (this.$events[type] || []).include(fn);
		if (internal) fn.internal = true;
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = removeOn(type);
		var events = this.$events[type];
		if (!events) return this;
		args = Array.from(args);
		events.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = removeOn(type);
		var events = this.$events[type];
		if (events && !fn.internal){
			var index =  events.indexOf(fn);
			if (index != -1) delete events[index];
		}
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--;) if (i in fns){
				this.removeEvent(type, fns[i]);
			}
		}
		return this;
	}

});

this.Options = new Class({

	setOptions: function(){
		var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments));
		if (this.addEvent) for (var option in options){
			if (typeOf(options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, options[option]);
			delete options[option];
		}
		return this;
	}

});

})();

/*
---

name: Browser

description: The Browser Object. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: [Array, Function, Number, String]

provides: [Browser, Window, Document]

...
*/

(function(){

var document = this.document;
var window = document.window = this;

var parse = function(ua, platform){
	ua = ua.toLowerCase();
	platform = (platform ? platform.toLowerCase() : '');

	var UA = ua.match(/(opera|ie|firefox|chrome|trident|crios|version)[\s\/:]([\w\d\.]+)?.*?(safari|(?:rv[\s\/:]|version[\s\/:])([\w\d\.]+)|$)/) || [null, 'unknown', 0];

	if (UA[1] == 'trident'){
		UA[1] = 'ie';
		if (UA[4]) UA[2] = UA[4];
	} else if (UA[1] == 'crios') {
		UA[1] = 'chrome';
	}

	var platform = ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0];
	if (platform == 'win') platform = 'windows';

	return {
		extend: Function.prototype.extend,
		name: (UA[1] == 'version') ? UA[3] : UA[1],
		version: parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]),
		platform: platform
	};
};

var Browser = this.Browser = parse(navigator.userAgent, navigator.platform);

if (Browser.ie){
	Browser.version = document.documentMode;
}

Browser.extend({
	Features: {
		xpath: !!(document.evaluate),
		air: !!(window.runtime),
		query: !!(document.querySelector),
		json: !!(window.JSON)
	},
	parseUA: parse
});

//<1.4compat>
Browser[Browser.name] = true;
Browser[Browser.name + parseInt(Browser.version, 10)] = true;

if (Browser.name == 'ie' && Browser.version >= '11') {
	delete Browser.ie;
}

var platform = Browser.platform;
if (platform == 'windows'){
	platform = 'win';
}
Browser.Platform = {
	name: platform
};
Browser.Platform[platform] = true;
//</1.4compat>

// Request

Browser.Request = (function(){

	var XMLHTTP = function(){
		return new XMLHttpRequest();
	};

	var MSXML2 = function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	};

	var MSXML = function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	};

	return Function.attempt(function(){
		XMLHTTP();
		return XMLHTTP;
	}, function(){
		MSXML2();
		return MSXML2;
	}, function(){
		MSXML();
		return MSXML;
	});

})();

Browser.Features.xhr = !!(Browser.Request);

//<1.4compat>

// Flash detection

var version = (Function.attempt(function(){
	return navigator.plugins['Shockwave Flash'].description;
}, function(){
	return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
}) || '0 r0').match(/\d+/g);

Browser.Plugins = {
	Flash: {
		version: Number(version[0] || '0.' + version[1]) || 0,
		build: Number(version[2]) || 0
	}
};

//</1.4compat>

// String scripts

Browser.exec = function(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.text = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

String.implement('stripScripts', function(exec){
	var scripts = '';
	var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(all, code){
		scripts += code + '\n';
		return '';
	});
	if (exec === true) Browser.exec(scripts);
	else if (typeOf(exec) == 'function') exec(scripts, text);
	return text;
});

// Window, Document

Browser.extend({
	Document: this.Document,
	Window: this.Window,
	Element: this.Element,
	Event: this.Event
});

this.Window = this.$constructor = new Type('Window', function(){});

this.$family = Function.from('window').hide();

Window.mirror(function(name, method){
	window[name] = method;
});

this.Document = document.$constructor = new Type('Document', function(){});

document.$family = Function.from('document').hide();

Document.mirror(function(name, method){
	document[name] = method;
});

document.html = document.documentElement;
if (!document.head) document.head = document.getElementsByTagName('head')[0];

if (document.execCommand) try {
	document.execCommand("BackgroundImageCache", false, true);
} catch (e){}

/*<ltIE9>*/
if (this.attachEvent && !this.addEventListener){
	var unloadEvent = function(){
		this.detachEvent('onunload', unloadEvent);
		document.head = document.html = document.window = null;
	};
	this.attachEvent('onunload', unloadEvent);
}

// IE fails on collections and <select>.options (refers to <select>)
var arrayFrom = Array.from;
try {
	arrayFrom(document.html.childNodes);
} catch(e){
	Array.from = function(item){
		if (typeof item != 'string' && Type.isEnumerable(item) && typeOf(item) != 'array'){
			var i = item.length, array = new Array(i);
			while (i--) array[i] = item[i];
			return array;
		}
		return arrayFrom(item);
	};

	var prototype = Array.prototype,
		slice = prototype.slice;
	['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice'].each(function(name){
		var method = prototype[name];
		Array[name] = function(item){
			return method.apply(Array.from(item), slice.call(arguments, 1));
		};
	});
}
/*</ltIE9>*/

//<1.2compat>

if (Browser.Platform.ios) Browser.Platform.ipod = true;

Browser.Engine = {};

var setEngine = function(name, version){
	Browser.Engine.name = name;
	Browser.Engine[name + version] = true;
	Browser.Engine.version = version;
};

if (Browser.ie){
	Browser.Engine.trident = true;

	switch (Browser.version){
		case 6: setEngine('trident', 4); break;
		case 7: setEngine('trident', 5); break;
		case 8: setEngine('trident', 6);
	}
}

if (Browser.firefox){
	Browser.Engine.gecko = true;

	if (Browser.version >= 3) setEngine('gecko', 19);
	else setEngine('gecko', 18);
}

if (Browser.safari || Browser.chrome){
	Browser.Engine.webkit = true;

	switch (Browser.version){
		case 2: setEngine('webkit', 419); break;
		case 3: setEngine('webkit', 420); break;
		case 4: setEngine('webkit', 525);
	}
}

if (Browser.opera){
	Browser.Engine.presto = true;

	if (Browser.version >= 9.6) setEngine('presto', 960);
	else if (Browser.version >= 9.5) setEngine('presto', 950);
	else setEngine('presto', 925);
}

if (Browser.name == 'unknown'){
	switch ((navigator.userAgent.toLowerCase().match(/(?:webkit|khtml|gecko)/) || [])[0]){
		case 'webkit':
		case 'khtml':
			Browser.Engine.webkit = true;
		break;
		case 'gecko':
			Browser.Engine.gecko = true;
	}
}

this.$exec = Browser.exec;

//</1.2compat>

})();

/*
---

name: Object

description: Object generic methods

license: MIT-style license.

requires: Type

provides: [Object, Hash]

...
*/

(function(){

var hasOwnProperty = Object.prototype.hasOwnProperty;

Object.extend({

	subset: function(object, keys){
		var results = {};
		for (var i = 0, l = keys.length; i < l; i++){
			var k = keys[i];
			if (k in object) results[k] = object[k];
		}
		return results;
	},

	map: function(object, fn, bind){
		var results = {};
		for (var key in object){
			if (hasOwnProperty.call(object, key)) results[key] = fn.call(bind, object[key], key, object);
		}
		return results;
	},

	filter: function(object, fn, bind){
		var results = {};
		for (var key in object){
			var value = object[key];
			if (hasOwnProperty.call(object, key) && fn.call(bind, value, key, object)) results[key] = value;
		}
		return results;
	},

	every: function(object, fn, bind){
		for (var key in object){
			if (hasOwnProperty.call(object, key) && !fn.call(bind, object[key], key)) return false;
		}
		return true;
	},

	some: function(object, fn, bind){
		for (var key in object){
			if (hasOwnProperty.call(object, key) && fn.call(bind, object[key], key)) return true;
		}
		return false;
	},

	keys: function(object){
		var keys = [];
		for (var key in object){
			if (hasOwnProperty.call(object, key)) keys.push(key);
		}
		return keys;
	},

	values: function(object){
		var values = [];
		for (var key in object){
			if (hasOwnProperty.call(object, key)) values.push(object[key]);
		}
		return values;
	},

	getLength: function(object){
		return Object.keys(object).length;
	},

	keyOf: function(object, value){
		for (var key in object){
			if (hasOwnProperty.call(object, key) && object[key] === value) return key;
		}
		return null;
	},

	contains: function(object, value){
		return Object.keyOf(object, value) != null;
	},

	toQueryString: function(object, base){
		var queryString = [];

		Object.each(object, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch (typeOf(value)){
				case 'object': result = Object.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Object.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != null) queryString.push(result);
		});

		return queryString.join('&');
	}

});

})();

//<1.2compat>

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		return Object.keyOf(this, value);
	},

	hasValue: function(value){
		return Object.contains(this, value);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == null) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		return new Hash(Object.map(this, fn, bind));
	},

	filter: function(fn, bind){
		return new Hash(Object.filter(this, fn, bind));
	},

	every: function(fn, bind){
		return Object.every(this, fn, bind);
	},

	some: function(fn, bind){
		return Object.some(this, fn, bind);
	},

	getKeys: function(){
		return Object.keys(this);
	},

	getValues: function(){
		return Object.values(this);
	},

	toQueryString: function(base){
		return Object.toQueryString(this, base);
	}

});

Hash.extend = Object.append;

Hash.alias({indexOf: 'keyOf', contains: 'hasValue'});

//</1.2compat>

/*
---
name: Slick.Parser
description: Standalone CSS3 Selector parser
provides: Slick.Parser
...
*/

;(function(){

var parsed,
	separatorIndex,
	combinatorIndex,
	reversed,
	cache = {},
	reverseCache = {},
	reUnescape = /\\/g;

var parse = function(expression, isReversed){
	if (expression == null) return null;
	if (expression.Slick === true) return expression;
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {
		Slick: true,
		expressions: [],
		raw: expression,
		reverse: function(){
			return parse(this.raw, true);
		}
	};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}

		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
		return '\\' + match;
	});
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
	.replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,

	separator,
	combinator,
	combinatorChildren,

	tagName,
	id,
	className,

	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,

	pseudoMarker,
	pseudoClass,
	pseudoQuote,
	pseudoClassQuotedValue,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}

	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
	}

	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(reUnescape, '');

	} else if (id){
		currentParsed.id = id.replace(reUnescape, '');

	} else if (className){
		className = className.replace(reUnescape, '');

		if (!currentParsed.classList) currentParsed.classList = [];
		if (!currentParsed.classes) currentParsed.classes = [];
		currentParsed.classList.push(className);
		currentParsed.classes.push({
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		});

	} else if (pseudoClass){
		pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
		pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		currentParsed.pseudos.push({
			key: pseudoClass.replace(reUnescape, ''),
			value: pseudoClassValue,
			type: pseudoMarker.length == 1 ? 'class' : 'element'
		});

	} else if (attributeKey){
		attributeKey = attributeKey.replace(reUnescape, '');
		attributeValue = (attributeValue || '').replace(reUnescape, '');

		var test, regexp;

		switch (attributeOperator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attributeValue) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attributeValue) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attributeValue == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attributeValue) > -1;
			}; break;
			case '!=' : test = function(value){
				return attributeValue != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}

		if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function(){
			return false;
		};

		if (!test) test = function(value){
			return value && regexp.test(value);
		};

		if (!currentParsed.attributes) currentParsed.attributes = [];
		currentParsed.attributes.push({
			key: attributeKey,
			operator: attributeOperator,
			value: attributeValue,
			test: test
		});

	}

	return '';
};

// Slick NS

var Slick = (this.Slick || {});

Slick.parse = function(expression){
	return parse(expression);
};

Slick.escapeRegExp = escapeRegExp;

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);

/*
---
name: Slick.Finder
description: The new, superfast css selector engine.
provides: Slick.Finder
requires: Slick.Parser
...
*/

;(function(){

var local = {},
	featuresCache = {},
	toString = Object.prototype.toString;

// Feature / Bug detection

local.isNativeCode = function(fn){
	return (/\{\s*\[native code\]\s*\}/).test('' + fn);
};

local.isXML = function(document){
	return (!!document.xmlVersion) || (!!document.xml) || (toString.call(document) == '[object XMLDocument]') ||
	(document.nodeType == 9 && document.documentElement.nodeName != 'HTML');
};

local.setDocument = function(document){

	// convert elements / window arguments to document. if document cannot be extrapolated, the function returns.
	var nodeType = document.nodeType;
	if (nodeType == 9); // document
	else if (nodeType) document = document.ownerDocument; // node
	else if (document.navigator) document = document.document; // window
	else return;

	// check if it's the old document

	if (this.document === document) return;
	this.document = document;

	// check if we have done feature detection on this document before

	var root = document.documentElement,
		rootUid = this.getUIDXML(root),
		features = featuresCache[rootUid],
		feature;

	if (features){
		for (feature in features){
			this[feature] = features[feature];
		}
		return;
	}

	features = featuresCache[rootUid] = {};

	features.root = root;
	features.isXMLDocument = this.isXML(document);

	features.brokenStarGEBTN
	= features.starSelectsClosedQSA
	= features.idGetsName
	= features.brokenMixedCaseQSA
	= features.brokenGEBCN
	= features.brokenCheckedQSA
	= features.brokenEmptyAttributeQSA
	= features.isHTMLDocument
	= features.nativeMatchesSelector
	= false;

	var starSelectsClosed, starSelectsComments,
		brokenSecondClassNameGEBCN, cachedGetElementsByClassName,
		brokenFormAttributeGetter;

	var selected, id = 'slick_uniqueid';
	var testNode = document.createElement('div');

	var testRoot = document.body || document.getElementsByTagName('body')[0] || root;
	testRoot.appendChild(testNode);

	// on non-HTML documents innerHTML and getElementsById doesnt work properly
	try {
		testNode.innerHTML = '<a id="'+id+'"></a>';
		features.isHTMLDocument = !!document.getElementById(id);
	} catch(e){};

	if (features.isHTMLDocument){

		testNode.style.display = 'none';

		// IE returns comment nodes for getElementsByTagName('*') for some documents
		testNode.appendChild(document.createComment(''));
		starSelectsComments = (testNode.getElementsByTagName('*').length > 1);

		// IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
		try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.getElementsByTagName('*');
			starSelectsClosed = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};

		features.brokenStarGEBTN = starSelectsComments || starSelectsClosed;

		// IE returns elements with the name instead of just id for getElementsById for some documents
		try {
			testNode.innerHTML = '<a name="'+ id +'"></a><b id="'+ id +'"></b>';
			features.idGetsName = document.getElementById(id) === testNode.firstChild;
		} catch(e){};

		if (testNode.getElementsByClassName){

			// Safari 3.2 getElementsByClassName caches results
			try {
				testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
				testNode.getElementsByClassName('b').length;
				testNode.firstChild.className = 'b';
				cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
			} catch(e){};

			// Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
			try {
				testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
				brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
			} catch(e){};

			features.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
		}

		if (testNode.querySelectorAll){
			// IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
			try {
				testNode.innerHTML = 'foo</foo>';
				selected = testNode.querySelectorAll('*');
				features.starSelectsClosedQSA = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
			} catch(e){};

			// Safari 3.2 querySelectorAll doesnt work with mixedcase on quirksmode
			try {
				testNode.innerHTML = '<a class="MiX"></a>';
				features.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiX').length;
			} catch(e){};

			// Webkit and Opera dont return selected options on querySelectorAll
			try {
				testNode.innerHTML = '<select><option selected="selected">a</option></select>';
				features.brokenCheckedQSA = (testNode.querySelectorAll(':checked').length == 0);
			} catch(e){};

			// IE returns incorrect results for attr[*^$]="" selectors on querySelectorAll
			try {
				testNode.innerHTML = '<a class=""></a>';
				features.brokenEmptyAttributeQSA = (testNode.querySelectorAll('[class*=""]').length != 0);
			} catch(e){};

		}

		// IE6-7, if a form has an input of id x, form.getAttribute(x) returns a reference to the input
		try {
			testNode.innerHTML = '<form action="s"><input id="action"/></form>';
			brokenFormAttributeGetter = (testNode.firstChild.getAttribute('action') != 's');
		} catch(e){};

		// native matchesSelector function

		features.nativeMatchesSelector = root.matches || /*root.msMatchesSelector ||*/ root.mozMatchesSelector || root.webkitMatchesSelector;
		if (features.nativeMatchesSelector) try {
			// if matchesSelector trows errors on incorrect sintaxes we can use it
			features.nativeMatchesSelector.call(root, ':slick');
			features.nativeMatchesSelector = null;
		} catch(e){};

	}

	try {
		root.slick_expando = 1;
		delete root.slick_expando;
		features.getUID = this.getUIDHTML;
	} catch(e) {
		features.getUID = this.getUIDXML;
	}

	testRoot.removeChild(testNode);
	testNode = selected = testRoot = null;

	// getAttribute

	features.getAttribute = (features.isHTMLDocument && brokenFormAttributeGetter) ? function(node, name){
		var method = this.attributeGetters[name];
		if (method) return method.call(node);
		var attributeNode = node.getAttributeNode(name);
		return (attributeNode) ? attributeNode.nodeValue : null;
	} : function(node, name){
		var method = this.attributeGetters[name];
		return (method) ? method.call(node) : node.getAttribute(name);
	};

	// hasAttribute

	features.hasAttribute = (root && this.isNativeCode(root.hasAttribute)) ? function(node, attribute) {
		return node.hasAttribute(attribute);
	} : function(node, attribute) {
		node = node.getAttributeNode(attribute);
		return !!(node && (node.specified || node.nodeValue));
	};

	// contains
	// FIXME: Add specs: local.contains should be different for xml and html documents?
	var nativeRootContains = root && this.isNativeCode(root.contains),
		nativeDocumentContains = document && this.isNativeCode(document.contains);

	features.contains = (nativeRootContains && nativeDocumentContains) ? function(context, node){
		return context.contains(node);
	} : (nativeRootContains && !nativeDocumentContains) ? function(context, node){
		// IE8 does not have .contains on document.
		return context === node || ((context === document) ? document.documentElement : context).contains(node);
	} : (root && root.compareDocumentPosition) ? function(context, node){
		return context === node || !!(context.compareDocumentPosition(node) & 16);
	} : function(context, node){
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	};

	// document order sorting
	// credits to Sizzle (http://sizzlejs.com/)

	features.documentSorter = (root.compareDocumentPosition) ? function(a, b){
		if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
		return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
	} : ('sourceIndex' in root) ? function(a, b){
		if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
	} : (document.createRange) ? function(a, b){
		if (!a.ownerDocument || !b.ownerDocument) return 0;
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
	} : null ;

	root = null;

	for (feature in features){
		this[feature] = features[feature];
	}
};

// Main Method

var reSimpleSelector = /^([#.]?)((?:[\w-]+|\*))$/,
	reEmptyAttribute = /\[.+[*$^]=(?:""|'')?\]/,
	qsaFailExpCache = {};

local.search = function(context, expression, append, first){

	var found = this.found = (first) ? null : (append || []);

	if (!context) return found;
	else if (context.navigator) context = context.document; // Convert the node from a window to a document
	else if (!context.nodeType) return found;

	// setup

	var parsed, i,
		uniques = this.uniques = {},
		hasOthers = !!(append && append.length),
		contextIsDocument = (context.nodeType == 9);

	if (this.document !== (contextIsDocument ? context : context.ownerDocument)) this.setDocument(context);

	// avoid duplicating items already in the append array
	if (hasOthers) for (i = found.length; i--;) uniques[this.getUID(found[i])] = true;

	// expression checks

	if (typeof expression == 'string'){ // expression is a string

		/*<simple-selectors-override>*/
		var simpleSelector = expression.match(reSimpleSelector);
		simpleSelectors: if (simpleSelector) {

			var symbol = simpleSelector[1],
				name = simpleSelector[2],
				node, nodes;

			if (!symbol){

				if (name == '*' && this.brokenStarGEBTN) break simpleSelectors;
				nodes = context.getElementsByTagName(name);
				if (first) return nodes[0] || null;
				for (i = 0; node = nodes[i++];){
					if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
				}

			} else if (symbol == '#'){

				if (!this.isHTMLDocument || !contextIsDocument) break simpleSelectors;
				node = context.getElementById(name);
				if (!node) return found;
				if (this.idGetsName && node.getAttributeNode('id').nodeValue != name) break simpleSelectors;
				if (first) return node || null;
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);

			} else if (symbol == '.'){

				if (!this.isHTMLDocument || ((!context.getElementsByClassName || this.brokenGEBCN) && context.querySelectorAll)) break simpleSelectors;
				if (context.getElementsByClassName && !this.brokenGEBCN){
					nodes = context.getElementsByClassName(name);
					if (first) return nodes[0] || null;
					for (i = 0; node = nodes[i++];){
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				} else {
					var matchClass = new RegExp('(^|\\s)'+ Slick.escapeRegExp(name) +'(\\s|$)');
					nodes = context.getElementsByTagName('*');
					for (i = 0; node = nodes[i++];){
						className = node.className;
						if (!(className && matchClass.test(className))) continue;
						if (first) return node;
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				}

			}

			if (hasOthers) this.sort(found);
			return (first) ? null : found;

		}
		/*</simple-selectors-override>*/

		/*<query-selector-override>*/
		querySelector: if (context.querySelectorAll) {

			if (!this.isHTMLDocument
				|| qsaFailExpCache[expression]
				//TODO: only skip when expression is actually mixed case
				|| this.brokenMixedCaseQSA
				|| (this.brokenCheckedQSA && expression.indexOf(':checked') > -1)
				|| (this.brokenEmptyAttributeQSA && reEmptyAttribute.test(expression))
				|| (!contextIsDocument //Abort when !contextIsDocument and...
					//  there are multiple expressions in the selector
					//  since we currently only fix non-document rooted QSA for single expression selectors
					&& expression.indexOf(',') > -1
				)
				|| Slick.disableQSA
			) break querySelector;

			var _expression = expression, _context = context;
			if (!contextIsDocument){
				// non-document rooted QSA
				// credits to Andrew Dupont
				var currentId = _context.getAttribute('id'), slickid = 'slickid__';
				_context.setAttribute('id', slickid);
				_expression = '#' + slickid + ' ' + _expression;
				context = _context.parentNode;
			}

			try {
				if (first) return context.querySelector(_expression) || null;
				else nodes = context.querySelectorAll(_expression);
			} catch(e) {
				qsaFailExpCache[expression] = 1;
				break querySelector;
			} finally {
				if (!contextIsDocument){
					if (currentId) _context.setAttribute('id', currentId);
					else _context.removeAttribute('id');
					context = _context;
				}
			}

			if (this.starSelectsClosedQSA) for (i = 0; node = nodes[i++];){
				if (node.nodeName > '@' && !(hasOthers && uniques[this.getUID(node)])) found.push(node);
			} else for (i = 0; node = nodes[i++];){
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
			}

			if (hasOthers) this.sort(found);
			return found;

		}
		/*</query-selector-override>*/

		parsed = this.Slick.parse(expression);
		if (!parsed.length) return found;
	} else if (expression == null){ // there is no expression
		return found;
	} else if (expression.Slick){ // expression is a parsed Slick object
		parsed = expression;
	} else if (this.contains(context.documentElement || context, expression)){ // expression is a node
		(found) ? found.push(expression) : found = expression;
		return found;
	} else { // other junk
		return found;
	}

	/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

	// cache elements for the nth selectors

	this.posNTH = {};
	this.posNTHLast = {};
	this.posNTHType = {};
	this.posNTHTypeLast = {};

	/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

	// if append is null and there is only a single selector with one expression use pushArray, else use pushUID
	this.push = (!hasOthers && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) ? this.pushArray : this.pushUID;

	if (found == null) found = [];

	// default engine

	var j, m, n;
	var combinator, tag, id, classList, classes, attributes, pseudos;
	var currentItems, currentExpression, currentBit, lastBit, expressions = parsed.expressions;

	search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++){

		combinator = 'combinator:' + currentBit.combinator;
		if (!this[combinator]) continue search;

		tag        = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
		id         = currentBit.id;
		classList  = currentBit.classList;
		classes    = currentBit.classes;
		attributes = currentBit.attributes;
		pseudos    = currentBit.pseudos;
		lastBit    = (j === (currentExpression.length - 1));

		this.bitUniques = {};

		if (lastBit){
			this.uniques = uniques;
			this.found = found;
		} else {
			this.uniques = {};
			this.found = [];
		}

		if (j === 0){
			this[combinator](context, tag, id, classes, attributes, pseudos, classList);
			if (first && lastBit && found.length) break search;
		} else {
			if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++){
				this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
				if (found.length) break search;
			} else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
		}

		currentItems = this.found;
	}

	// should sort if there are nodes in append and if you pass multiple expressions.
	if (hasOthers || (parsed.expressions.length > 1)) this.sort(found);

	return (first) ? (found[0] || null) : found;
};

// Utils

local.uidx = 1;
local.uidk = 'slick-uniqueid';

local.getUIDXML = function(node){
	var uid = node.getAttribute(this.uidk);
	if (!uid){
		uid = this.uidx++;
		node.setAttribute(this.uidk, uid);
	}
	return uid;
};

local.getUIDHTML = function(node){
	return node.uniqueNumber || (node.uniqueNumber = this.uidx++);
};

// sort based on the setDocument documentSorter method.

local.sort = function(results){
	if (!this.documentSorter) return results;
	results.sort(this.documentSorter);
	return results;
};

/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

local.cacheNTH = {};

local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

local.parseNTHArgument = function(argument){
	var parsed = argument.match(this.matchNTH);
	if (!parsed) return false;
	var special = parsed[2] || false;
	var a = parsed[1] || 1;
	if (a == '-') a = -1;
	var b = +parsed[3] || 0;
	parsed =
		(special == 'n')	? {a: a, b: b} :
		(special == 'odd')	? {a: 2, b: 1} :
		(special == 'even')	? {a: 2, b: 0} : {a: 0, b: a};

	return (this.cacheNTH[argument] = parsed);
};

local.createNTHPseudo = function(child, sibling, positions, ofType){
	return function(node, argument){
		var uid = this.getUID(node);
		if (!this[positions][uid]){
			var parent = node.parentNode;
			if (!parent) return false;
			var el = parent[child], count = 1;
			if (ofType){
				var nodeName = node.nodeName;
				do {
					if (el.nodeName != nodeName) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			} else {
				do {
					if (el.nodeType != 1) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			}
		}
		argument = argument || 'n';
		var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
		if (!parsed) return false;
		var a = parsed.a, b = parsed.b, pos = this[positions][uid];
		if (a == 0) return b == pos;
		if (a > 0){
			if (pos < b) return false;
		} else {
			if (b < pos) return false;
		}
		return ((pos - b) % a) == 0;
	};
};

/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

local.pushArray = function(node, tag, id, classes, attributes, pseudos){
	if (this.matchSelector(node, tag, id, classes, attributes, pseudos)) this.found.push(node);
};

local.pushUID = function(node, tag, id, classes, attributes, pseudos){
	var uid = this.getUID(node);
	if (!this.uniques[uid] && this.matchSelector(node, tag, id, classes, attributes, pseudos)){
		this.uniques[uid] = true;
		this.found.push(node);
	}
};

local.matchNode = function(node, selector){
	if (this.isHTMLDocument && this.nativeMatchesSelector){
		try {
			return this.nativeMatchesSelector.call(node, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
		} catch(matchError) {}
	}

	var parsed = this.Slick.parse(selector);
	if (!parsed) return true;

	// simple (single) selectors
	var expressions = parsed.expressions, simpleExpCounter = 0, i;
	for (i = 0; (currentExpression = expressions[i]); i++){
		if (currentExpression.length == 1){
			var exp = currentExpression[0];
			if (this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.classes, exp.attributes, exp.pseudos)) return true;
			simpleExpCounter++;
		}
	}

	if (simpleExpCounter == parsed.length) return false;

	var nodes = this.search(this.document, parsed), item;
	for (i = 0; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
};

local.matchPseudo = function(node, name, argument){
	var pseudoName = 'pseudo:' + name;
	if (this[pseudoName]) return this[pseudoName](node, argument);
	var attribute = this.getAttribute(node, name);
	return (argument) ? argument == attribute : !!attribute;
};

local.matchSelector = function(node, tag, id, classes, attributes, pseudos){
	if (tag){
		var nodeName = (this.isXMLDocument) ? node.nodeName : node.nodeName.toUpperCase();
		if (tag == '*'){
			if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
		} else {
			if (nodeName != tag) return false;
		}
	}

	if (id && node.getAttribute('id') != id) return false;

	var i, part, cls;
	if (classes) for (i = classes.length; i--;){
		cls = this.getAttribute(node, 'class');
		if (!(cls && classes[i].regexp.test(cls))) return false;
	}
	if (attributes) for (i = attributes.length; i--;){
		part = attributes[i];
		if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
	}
	if (pseudos) for (i = pseudos.length; i--;){
		part = pseudos[i];
		if (!this.matchPseudo(node, part.key, part.value)) return false;
	}
	return true;
};

var combinators = {

	' ': function(node, tag, id, classes, attributes, pseudos, classList){ // all child nodes, any level

		var i, item, children;

		if (this.isHTMLDocument){
			getById: if (id){
				item = this.document.getElementById(id);
				if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)){
					// all[id] returns all the elements with that name or id inside node
					// if theres just one it will return the element, else it will be a collection
					children = node.all[id];
					if (!children) return;
					if (!children[0]) children = [children];
					for (i = 0; item = children[i++];){
						var idNode = item.getAttributeNode('id');
						if (idNode && idNode.nodeValue == id){
							this.push(item, tag, null, classes, attributes, pseudos);
							break;
						}
					}
					return;
				}
				if (!item){
					// if the context is in the dom we return, else we will try GEBTN, breaking the getById label
					if (this.contains(this.root, node)) return;
					else break getById;
				} else if (this.document !== node && !this.contains(node, item)) return;
				this.push(item, tag, null, classes, attributes, pseudos);
				return;
			}
			getByClass: if (classes && node.getElementsByClassName && !this.brokenGEBCN){
				children = node.getElementsByClassName(classList.join(' '));
				if (!(children && children.length)) break getByClass;
				for (i = 0; item = children[i++];) this.push(item, tag, id, null, attributes, pseudos);
				return;
			}
		}
		getByTag: {
			children = node.getElementsByTagName(tag);
			if (!(children && children.length)) break getByTag;
			if (!this.brokenStarGEBTN) tag = null;
			for (i = 0; item = children[i++];) this.push(item, tag, id, classes, attributes, pseudos);
		}
	},

	'>': function(node, tag, id, classes, attributes, pseudos){ // direct children
		if ((node = node.firstChild)) do {
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
		} while ((node = node.nextSibling));
	},

	'+': function(node, tag, id, classes, attributes, pseudos){ // next sibling
		while ((node = node.nextSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'^': function(node, tag, id, classes, attributes, pseudos){ // first child
		node = node.firstChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'~': function(node, tag, id, classes, attributes, pseudos){ // next siblings
		while ((node = node.nextSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	},

	'++': function(node, tag, id, classes, attributes, pseudos){ // next sibling and previous sibling
		this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
	},

	'~~': function(node, tag, id, classes, attributes, pseudos){ // next siblings and previous siblings
		this['combinator:~'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!~'](node, tag, id, classes, attributes, pseudos);
	},

	'!': function(node, tag, id, classes, attributes, pseudos){ // all parent nodes up to document
		while ((node = node.parentNode)) if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!>': function(node, tag, id, classes, attributes, pseudos){ // direct parent (one level)
		node = node.parentNode;
		if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!+': function(node, tag, id, classes, attributes, pseudos){ // previous sibling
		while ((node = node.previousSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'!^': function(node, tag, id, classes, attributes, pseudos){ // last child
		node = node.lastChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'!~': function(node, tag, id, classes, attributes, pseudos){ // previous siblings
		while ((node = node.previousSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	}

};

for (var c in combinators) local['combinator:' + c] = combinators[c];

var pseudos = {

	/*<pseudo-selectors>*/

	'empty': function(node){
		var child = node.firstChild;
		return !(child && child.nodeType == 1) && !(node.innerText || node.textContent || '').length;
	},

	'not': function(node, expression){
		return !this.matchNode(node, expression);
	},

	'contains': function(node, text){
		return (node.innerText || node.textContent || '').indexOf(text) > -1;
	},

	'first-child': function(node){
		while ((node = node.previousSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'last-child': function(node){
		while ((node = node.nextSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'only-child': function(node){
		var prev = node;
		while ((prev = prev.previousSibling)) if (prev.nodeType == 1) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeType == 1) return false;
		return true;
	},

	/*<nth-pseudo-selectors>*/

	'nth-child': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTH'),

	'nth-last-child': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHLast'),

	'nth-of-type': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTHType', true),

	'nth-last-of-type': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHTypeLast', true),

	'index': function(node, index){
		return this['pseudo:nth-child'](node, '' + (index + 1));
	},

	'even': function(node){
		return this['pseudo:nth-child'](node, '2n');
	},

	'odd': function(node){
		return this['pseudo:nth-child'](node, '2n+1');
	},

	/*</nth-pseudo-selectors>*/

	/*<of-type-pseudo-selectors>*/

	'first-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.previousSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'last-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.nextSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'only-of-type': function(node){
		var prev = node, nodeName = node.nodeName;
		while ((prev = prev.previousSibling)) if (prev.nodeName == nodeName) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeName == nodeName) return false;
		return true;
	},

	/*</of-type-pseudo-selectors>*/

	// custom pseudos

	'enabled': function(node){
		return !node.disabled;
	},

	'disabled': function(node){
		return node.disabled;
	},

	'checked': function(node){
		return node.checked || node.selected;
	},

	'focus': function(node){
		return this.isHTMLDocument && this.document.activeElement === node && (node.href || node.type || this.hasAttribute(node, 'tabindex'));
	},

	'root': function(node){
		return (node === this.root);
	},

	'selected': function(node){
		return node.selected;
	}

	/*</pseudo-selectors>*/
};

for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

var attributeGetters = local.attributeGetters = {

	'for': function(){
		return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
	},

	'href': function(){
		return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
	},

	'style': function(){
		return (this.style) ? this.style.cssText : this.getAttribute('style');
	},

	'tabindex': function(){
		var attributeNode = this.getAttributeNode('tabindex');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	},

	'type': function(){
		return this.getAttribute('type');
	},

	'maxlength': function(){
		var attributeNode = this.getAttributeNode('maxLength');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	}

};

attributeGetters.MAXLENGTH = attributeGetters.maxLength = attributeGetters.maxlength;

// Slick

var Slick = local.Slick = (this.Slick || {});

Slick.version = '1.1.7';

// Slick finder

Slick.search = function(context, expression, append){
	return local.search(context, expression, append);
};

Slick.find = function(context, expression){
	return local.search(context, expression, null, true);
};

// Slick containment checker

Slick.contains = function(container, node){
	local.setDocument(container);
	return local.contains(container, node);
};

// Slick attribute getter

Slick.getAttribute = function(node, name){
	local.setDocument(node);
	return local.getAttribute(node, name);
};

Slick.hasAttribute = function(node, name){
	local.setDocument(node);
	return local.hasAttribute(node, name);
};

// Slick matcher

Slick.match = function(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	local.setDocument(node);
	return local.matchNode(node, selector);
};

// Slick attribute accessor

Slick.defineAttributeGetter = function(name, fn){
	local.attributeGetters[name] = fn;
	return this;
};

Slick.lookupAttributeGetter = function(name){
	return local.attributeGetters[name];
};

// Slick pseudo accessor

Slick.definePseudo = function(name, fn){
	local['pseudo:' + name] = function(node, argument){
		return fn.call(node, argument);
	};
	return this;
};

Slick.lookupPseudo = function(name){
	var pseudo = local['pseudo:' + name];
	if (pseudo) return function(argument){
		return pseudo.call(this, argument);
	};
	return null;
};

// Slick overrides accessor

Slick.override = function(regexp, fn){
	local.override(regexp, fn);
	return this;
};

Slick.isXML = local.isXML;

Slick.uidOf = function(node){
	return local.getUIDHTML(node);
};

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);

/*
---

name: Element

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires: [Window, Document, Array, String, Function, Object, Number, Slick.Parser, Slick.Finder]

provides: [Element, Elements, $, $$, IFrame, Selectors]

...
*/

var Element = this.Element = function(tag, props){
	var konstructor = Element.Constructors[tag];
	if (konstructor) return konstructor(props);
	if (typeof tag != 'string') return document.id(tag).set(props);

	if (!props) props = {};

	if (!(/^[\w-]+$/).test(tag)){
		var parsed = Slick.parse(tag).expressions[0][0];
		tag = (parsed.tag == '*') ? 'div' : parsed.tag;
		if (parsed.id && props.id == null) props.id = parsed.id;

		var attributes = parsed.attributes;
		if (attributes) for (var attr, i = 0, l = attributes.length; i < l; i++){
			attr = attributes[i];
			if (props[attr.key] != null) continue;

			if (attr.value != null && attr.operator == '=') props[attr.key] = attr.value;
			else if (!attr.value && !attr.operator) props[attr.key] = true;
		}

		if (parsed.classList && props['class'] == null) props['class'] = parsed.classList.join(' ');
	}

	return document.newElement(tag, props);
};


if (Browser.Element){
	Element.prototype = Browser.Element.prototype;
	// IE8 and IE9 require the wrapping.
	Element.prototype._fireEvent = (function(fireEvent){
		return function(type, event){
			return fireEvent.call(this, type, event);
		};
	})(Element.prototype.fireEvent);
}

new Type('Element', Element).mirror(function(name){
	if (Array.prototype[name]) return;

	var obj = {};
	obj[name] = function(){
		var results = [], args = arguments, elements = true;
		for (var i = 0, l = this.length; i < l; i++){
			var element = this[i], result = results[i] = element[name].apply(element, args);
			elements = (elements && typeOf(result) == 'element');
		}
		return (elements) ? new Elements(results) : results;
	};

	Elements.implement(obj);
});

if (!Browser.Element){
	Element.parent = Object;

	Element.Prototype = {
		'$constructor': Element,
		'$family': Function.from('element').hide()
	};

	Element.mirror(function(name, method){
		Element.Prototype[name] = method;
	});
}

Element.Constructors = {};

//<1.2compat>

Element.Constructors = new Hash;

//</1.2compat>

var IFrame = new Type('IFrame', function(){
	var params = Array.link(arguments, {
		properties: Type.isObject,
		iframe: function(obj){
			return (obj != null);
		}
	});

	var props = params.properties || {}, iframe;
	if (params.iframe) iframe = document.id(params.iframe);
	var onload = props.onload || function(){};
	delete props.onload;
	props.id = props.name = [props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + String.uniqueID()].pick();
	iframe = new Element(iframe || 'iframe', props);

	var onLoad = function(){
		onload.call(iframe.contentWindow);
	};

	if (window.frames[props.id]) onLoad();
	else iframe.addListener('load', onLoad);
	return iframe;
});

var Elements = this.Elements = function(nodes){
	if (nodes && nodes.length){
		var uniques = {}, node;
		for (var i = 0; node = nodes[i++];){
			var uid = Slick.uidOf(node);
			if (!uniques[uid]){
				uniques[uid] = true;
				this.push(node);
			}
		}
	}
};

Elements.prototype = {length: 0};
Elements.parent = Array;

new Type('Elements', Elements).implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeOf(filter) == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}.protect(),

	push: function(){
		var length = this.length;
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) this[length++] = item;
		}
		return (this.length = length);
	}.protect(),

	unshift: function(){
		var items = [];
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) items.push(item);
		}
		return Array.prototype.unshift.apply(this, items);
	}.protect(),

	concat: function(){
		var newElements = new Elements(this);
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = arguments[i];
			if (Type.isEnumerable(item)) newElements.append(item);
			else newElements.push(item);
		}
		return newElements;
	}.protect(),

	append: function(collection){
		for (var i = 0, l = collection.length; i < l; i++) this.push(collection[i]);
		return this;
	}.protect(),

	empty: function(){
		while (this.length) delete this[--this.length];
		return this;
	}.protect()

});

//<1.2compat>

Elements.alias('extend', 'append');

//</1.2compat>

(function(){

// FF, IE
var splice = Array.prototype.splice, object = {'0': 0, '1': 1, length: 2};

splice.call(object, 1, 1);
if (object[1] == 1) Elements.implement('splice', function(){
	var length = this.length;
	var result = splice.apply(this, arguments);
	while (length >= this.length) delete this[length--];
	return result;
}.protect());

Array.forEachMethod(function(method, name){
	Elements.implement(name, method);
});

Array.mirror(Elements);

/*<ltIE8>*/
var createElementAcceptsHTML;
try {
	createElementAcceptsHTML = (document.createElement('<input name=x>').name == 'x');
} catch (e){}

var escapeQuotes = function(html){
	return ('' + html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
};
/*</ltIE8>*/

Document.implement({

	newElement: function(tag, props){
		if (props && props.checked != null) props.defaultChecked = props.checked;
		/*<ltIE8>*/// Fix for readonly name and type properties in IE < 8
		if (createElementAcceptsHTML && props){
			tag = '<' + tag;
			if (props.name) tag += ' name="' + escapeQuotes(props.name) + '"';
			if (props.type) tag += ' type="' + escapeQuotes(props.type) + '"';
			tag += '>';
			delete props.name;
			delete props.type;
		}
		/*</ltIE8>*/
		return this.id(this.createElement(tag)).set(props);
	}

});

})();

(function(){

Slick.uidOf(window);
Slick.uidOf(document);

Document.implement({

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},

	id: (function(){

		var types = {

			string: function(id, nocash, doc){
				id = Slick.find(doc, '#' + id.replace(/(\W)/g, '\\$1'));
				return (id) ? types.element(id, nocash) : null;
			},

			element: function(el, nocash){
				Slick.uidOf(el);
				if (!nocash && !el.$family && !(/^(?:object|embed)$/i).test(el.tagName)){
					var fireEvent = el.fireEvent;
					// wrapping needed in IE7, or else crash
					el._fireEvent = function(type, event){
						return fireEvent(type, event);
					};
					Object.append(el, Element.Prototype);
				}
				return el;
			},

			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}

		};

		types.textnode = types.whitespace = types.window = types.document = function(zero){
			return zero;
		};

		return function(el, nocash, doc){
			if (el && el.$family && el.uniqueNumber) return el;
			var type = typeOf(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement('$', function(el, nc){
	return document.id(el, nc, this.document);
});

Window.implement({

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

[Document, Element].invoke('implement', {

	getElements: function(expression){
		return Slick.search(this, expression, new Elements);
	},

	getElement: function(expression){
		return document.id(Slick.find(this, expression));
	}

});

var contains = {contains: function(element){
	return Slick.contains(this, element);
}};

if (!document.contains) Document.implement(contains);
if (!document.createElement('div').contains) Element.implement(contains);

//<1.2compat>

Element.implement('hasChild', function(element){
	return this !== element && this.contains(element);
});

(function(search, find, match){

	this.Selectors = {};
	var pseudos = this.Selectors.Pseudo = new Hash();

	var addSlickPseudos = function(){
		for (var name in pseudos) if (pseudos.hasOwnProperty(name)){
			Slick.definePseudo(name, pseudos[name]);
			delete pseudos[name];
		}
	};

	Slick.search = function(context, expression, append){
		addSlickPseudos();
		return search.call(this, context, expression, append);
	};

	Slick.find = function(context, expression){
		addSlickPseudos();
		return find.call(this, context, expression);
	};

	Slick.match = function(node, selector){
		addSlickPseudos();
		return match.call(this, node, selector);
	};

})(Slick.search, Slick.find, Slick.match);

//</1.2compat>

// tree walking

var injectCombinator = function(expression, combinator){
	if (!expression) return combinator;

	expression = Object.clone(Slick.parse(expression));

	var expressions = expression.expressions;
	for (var i = expressions.length; i--;)
		expressions[i][0].combinator = combinator;

	return expression;
};

Object.forEach({
	getNext: '~',
	getPrevious: '!~',
	getParent: '!'
}, function(combinator, method){
	Element.implement(method, function(expression){
		return this.getElement(injectCombinator(expression, combinator));
	});
});

Object.forEach({
	getAllNext: '~',
	getAllPrevious: '!~',
	getSiblings: '~~',
	getChildren: '>',
	getParents: '!'
}, function(combinator, method){
	Element.implement(method, function(expression){
		return this.getElements(injectCombinator(expression, combinator));
	});
});

Element.implement({

	getFirst: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>'))[0]);
	},

	getLast: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>')).getLast());
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id){
		return document.id(Slick.find(this, '#' + ('' + id).replace(/(\W)/g, '\\$1')));
	},

	match: function(expression){
		return !expression || Slick.match(this, expression);
	}

});

//<1.2compat>

if (window.$$ == null) Window.implement('$$', function(selector){
	var elements = new Elements;
	if (arguments.length == 1 && typeof selector == 'string') return Slick.search(this.document, selector, elements);
	var args = Array.flatten(arguments);
	for (var i = 0, l = args.length; i < l; i++){
		var item = args[i];
		switch (typeOf(item)){
			case 'element': elements.push(item); break;
			case 'string': Slick.search(this.document, item, elements);
		}
	}
	return elements;
});

//</1.2compat>

if (window.$$ == null) Window.implement('$$', function(selector){
	if (arguments.length == 1){
		if (typeof selector == 'string') return Slick.search(this.document, selector, new Elements);
		else if (Type.isEnumerable(selector)) return new Elements(selector);
	}
	return new Elements(arguments);
});

// Inserters

var inserters = {

	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}

};

inserters.inside = inserters.bottom;

//<1.2compat>

Object.each(inserters, function(inserter, where){

	where = where.capitalize();

	var methods = {};

	methods['inject' + where] = function(el){
		inserter(this, document.id(el, true));
		return this;
	};

	methods['grab' + where] = function(el){
		inserter(document.id(el, true), this);
		return this;
	};

	Element.implement(methods);

});

//</1.2compat>

// getProperty / setProperty

var propertyGetters = {}, propertySetters = {};

// properties

var properties = {};
Array.forEach([
	'type', 'value', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan',
	'frameBorder', 'rowSpan', 'tabIndex', 'useMap'
], function(property){
	properties[property.toLowerCase()] = property;
});

properties.html = 'innerHTML';
properties.text = (document.createElement('div').textContent == null) ? 'innerText': 'textContent';

Object.forEach(properties, function(real, key){
	propertySetters[key] = function(node, value){
		node[real] = value;
	};
	propertyGetters[key] = function(node){
		return node[real];
	};
});

// Booleans

var bools = [
	'compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked',
	'disabled', 'readOnly', 'multiple', 'selected', 'noresize',
	'defer', 'defaultChecked', 'autofocus', 'controls', 'autoplay',
	'loop'
];

var booleans = {};
Array.forEach(bools, function(bool){
	var lower = bool.toLowerCase();
	booleans[lower] = bool;
	propertySetters[lower] = function(node, value){
		node[bool] = !!value;
	};
	propertyGetters[lower] = function(node){
		return !!node[bool];
	};
});

// Special cases

Object.append(propertySetters, {

	'class': function(node, value){
		('className' in node) ? node.className = (value || '') : node.setAttribute('class', value);
	},

	'for': function(node, value){
		('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
	},

	'style': function(node, value){
		(node.style) ? node.style.cssText = value : node.setAttribute('style', value);
	},

	'value': function(node, value){
		node.value = (value != null) ? value : '';
	}

});

propertyGetters['class'] = function(node){
	return ('className' in node) ? node.className || null : node.getAttribute('class');
};

/* <webkit> */
var el = document.createElement('button');
// IE sets type as readonly and throws
try { el.type = 'button'; } catch(e){}
if (el.type != 'button') propertySetters.type = function(node, value){
	node.setAttribute('type', value);
};
el = null;
/* </webkit> */

/*<IE>*/
var input = document.createElement('input');
input.value = 't';
input.type = 'submit';
if (input.value != 't') propertySetters.type = function(node, type){
	var value = node.value;
	node.type = type;
	node.value = value;
};
input = null;
/*</IE>*/

/* getProperty, setProperty */

/* <ltIE9> */
var pollutesGetAttribute = (function(div){
	div.random = 'attribute';
	return (div.getAttribute('random') == 'attribute');
})(document.createElement('div'));

var hasCloneBug = (function(test){
	test.innerHTML = '<object><param name="should_fix" value="the unknown"></object>';
	return test.cloneNode(true).firstChild.childNodes.length != 1;
})(document.createElement('div'));
/* </ltIE9> */

var hasClassList = !!document.createElement('div').classList;

var classes = function(className){
	var classNames = (className || '').clean().split(" "), uniques = {};
	return classNames.filter(function(className){
		if (className !== "" && !uniques[className]) return uniques[className] = className;
	});
};

var addToClassList = function(name){
	this.classList.add(name);
};

var removeFromClassList = function(name){
	this.classList.remove(name);
};

Element.implement({

	setProperty: function(name, value){
		var setter = propertySetters[name.toLowerCase()];
		if (setter){
			setter(this, value);
		} else {
			/* <ltIE9> */
			var attributeWhiteList;
			if (pollutesGetAttribute) attributeWhiteList = this.retrieve('$attributeWhiteList', {});
			/* </ltIE9> */

			if (value == null){
				this.removeAttribute(name);
				/* <ltIE9> */
				if (pollutesGetAttribute) delete attributeWhiteList[name];
				/* </ltIE9> */
			} else {
				this.setAttribute(name, '' + value);
				/* <ltIE9> */
				if (pollutesGetAttribute) attributeWhiteList[name] = true;
				/* </ltIE9> */
			}
		}
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(name){
		var getter = propertyGetters[name.toLowerCase()];
		if (getter) return getter(this);
		/* <ltIE9> */
		if (pollutesGetAttribute){
			var attr = this.getAttributeNode(name), attributeWhiteList = this.retrieve('$attributeWhiteList', {});
			if (!attr) return null;
			if (attr.expando && !attributeWhiteList[name]){
				var outer = this.outerHTML;
				// segment by the opening tag and find mention of attribute name
				if (outer.substr(0, outer.search(/\/?['"]?>(?![^<]*<['"])/)).indexOf(name) < 0) return null;
				attributeWhiteList[name] = true;
			}
		}
		/* </ltIE9> */
		var result = Slick.getAttribute(this, name);
		return (!result && !Slick.hasAttribute(this, name)) ? null : result;
	},

	getProperties: function(){
		var args = Array.from(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(name){
		return this.setProperty(name, null);
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	set: function(prop, value){
		var property = Element.Properties[prop];
		(property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
	}.overloadSetter(),

	get: function(prop){
		var property = Element.Properties[prop];
		return (property && property.get) ? property.get.apply(this) : this.getProperty(prop);
	}.overloadGetter(),

	erase: function(prop){
		var property = Element.Properties[prop];
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	hasClass: hasClassList ? function(className){
		return this.classList.contains(className);
	} : function(className){
		return this.className.clean().contains(className, ' ');
	},

	addClass: hasClassList ? function(className){
		classes(className).forEach(addToClassList, this);
		return this;
	} : function(className){
		this.className = classes(className + ' ' + this.className).join(' ');
		return this;
	},

	removeClass: hasClassList ? function(className){
		classes(className).forEach(removeFromClassList, this);
		return this;
	} : function(className){
		var classNames = classes(this.className);
		classes(className).forEach(classNames.erase, classNames);
		this.className = classNames.join(' ');
		return this;
	},

	toggleClass: function(className, force){
		if (force == null) force = !this.hasClass(className);
		return (force) ? this.addClass(className) : this.removeClass(className);
	},

	adopt: function(){
		var parent = this, fragment, elements = Array.flatten(arguments), length = elements.length;
		if (length > 1) parent = fragment = document.createDocumentFragment();

		for (var i = 0; i < length; i++){
			var element = document.id(elements[i], true);
			if (element) parent.appendChild(element);
		}

		if (fragment) this.appendChild(fragment);

		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getSelected: function(){
		this.selectedIndex; // Safari 3.2.1
		return new Elements(Array.from(this.options).filter(function(option){
			return option.selected;
		}));
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea').each(function(el){
			var type = el.type;
			if (!el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

			var value = (el.get('tag') == 'select') ? el.getSelected().map(function(opt){
				// IE
				return document.id(opt).get('value');
			}) : ((type == 'radio' || type == 'checkbox') && !el.checked) ? null : el.get('value');

			Array.from(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	}

});


// appendHTML

var appendInserters = {
	before: 'beforeBegin',
	after: 'afterEnd',
	bottom: 'beforeEnd',
	top: 'afterBegin',
	inside: 'beforeEnd'
};

Element.implement('appendHTML', ('insertAdjacentHTML' in document.createElement('div')) ? function(html, where){
	this.insertAdjacentHTML(appendInserters[where || 'bottom'], html);
	return this;
} : function(html, where){
	var temp = new Element('div', {html: html}),
		children = temp.childNodes,
		fragment = temp.firstChild;

	if (!fragment) return this;
	if (children.length > 1){
		fragment = document.createDocumentFragment();
		for (var i = 0, l = children.length; i < l; i++){
			fragment.appendChild(children[i]);
		}
	}

	inserters[where || 'bottom'](fragment, this);
	return this;
});

var collected = {}, storage = {};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item){
	var uid = item.uniqueNumber;
	if (item.removeEvents) item.removeEvents();
	if (item.clearAttributes) item.clearAttributes();
	if (uid != null){
		delete collected[uid];
		delete storage[uid];
	}
	return item;
};

var formProps = {input: 'checked', option: 'selected', textarea: 'value'};

Element.implement({

	destroy: function(){
		var children = clean(this).getElementsByTagName('*');
		Array.each(children, clean);
		Element.dispose(this);
		return null;
	},

	empty: function(){
		Array.from(this.childNodes).each(Element.dispose);
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents), ce = [clone], te = [this], i;

		if (contents){
			ce.append(Array.from(clone.getElementsByTagName('*')));
			te.append(Array.from(this.getElementsByTagName('*')));
		}

		for (i = ce.length; i--;){
			var node = ce[i], element = te[i];
			if (!keepid) node.removeAttribute('id');
			/*<ltIE9>*/
			if (node.clearAttributes){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uniqueNumber');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			/*</ltIE9>*/
			var prop = formProps[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		}

		/*<ltIE9>*/
		if (hasCloneBug){
			var co = clone.getElementsByTagName('object'), to = this.getElementsByTagName('object');
			for (i = co.length; i--;) co[i].outerHTML = to[i].outerHTML;
		}
		/*</ltIE9>*/
		return document.id(clone);
	}

});

[Element, Window, Document].invoke('implement', {

	addListener: function(type, fn){
		if (window.attachEvent && !window.addEventListener){
			collected[Slick.uidOf(this)] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, !!arguments[2]);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, !!arguments[2]);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(Slick.uidOf(this)), prop = storage[property];
		if (dflt != null && prop == null) prop = storage[property] = dflt;
		return prop != null ? prop : null;
	},

	store: function(property, value){
		var storage = get(Slick.uidOf(this));
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(Slick.uidOf(this));
		delete storage[property];
		return this;
	}

});

/*<ltIE9>*/
if (window.attachEvent && !window.addEventListener){
	var gc = function(){
		Object.each(collected, clean);
		if (window.CollectGarbage) CollectGarbage();
		window.removeListener('unload', gc);
	}
	window.addListener('unload', gc);
}
/*</ltIE9>*/

Element.Properties = {};

//<1.2compat>

Element.Properties = new Hash;

//</1.2compat>

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = {

	set: function(html){
		if (html == null) html = '';
		else if (typeOf(html) == 'array') html = html.join('');
		this.innerHTML = html;
	},

	erase: function(){
		this.innerHTML = '';
	}

};

var supportsHTML5Elements = true, supportsTableInnerHTML = true, supportsTRInnerHTML = true;

/*<ltIE9>*/
// technique by jdbarlett - http://jdbartlett.com/innershiv/
var div = document.createElement('div');
div.innerHTML = '<nav></nav>';
supportsHTML5Elements = (div.childNodes.length == 1);
if (!supportsHTML5Elements){
	var tags = 'abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video'.split(' '),
		fragment = document.createDocumentFragment(), l = tags.length;
	while (l--) fragment.createElement(tags[l]);
}
div = null;
/*</ltIE9>*/

/*<IE>*/
supportsTableInnerHTML = Function.attempt(function(){
	var table = document.createElement('table');
	table.innerHTML = '<tr><td></td></tr>';
	return true;
});

/*<ltFF4>*/
var tr = document.createElement('tr'), html = '<td></td>';
tr.innerHTML = html;
supportsTRInnerHTML = (tr.innerHTML == html);
tr = null;
/*</ltFF4>*/

if (!supportsTableInnerHTML || !supportsTRInnerHTML || !supportsHTML5Elements){

	Element.Properties.html.set = (function(set){

		var translations = {
			table: [1, '<table>', '</table>'],
			select: [1, '<select>', '</select>'],
			tbody: [2, '<table><tbody>', '</tbody></table>'],
			tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
		};

		translations.thead = translations.tfoot = translations.tbody;

		return function(html){
			var wrap = translations[this.get('tag')];
			if (!wrap && !supportsHTML5Elements) wrap = [0, '', ''];
			if (!wrap) return set.call(this, html);

			var level = wrap[0], wrapper = document.createElement('div'), target = wrapper;
			if (!supportsHTML5Elements) fragment.appendChild(wrapper);
			wrapper.innerHTML = [wrap[1], html, wrap[2]].flatten().join('');
			while (level--) target = target.firstChild;
			this.empty().adopt(target.childNodes);
			if (!supportsHTML5Elements) fragment.removeChild(wrapper);
			wrapper = null;
		};

	})(Element.Properties.html.set);
}
/*</IE>*/

/*<ltIE9>*/
var testForm = document.createElement('form');
testForm.innerHTML = '<select><option>s</option></select>';

if (testForm.firstChild.value != 's') Element.Properties.value = {

	set: function(value){
		var tag = this.get('tag');
		if (tag != 'select') return this.setProperty('value', value);
		var options = this.getElements('option');
		value = String(value);
		for (var i = 0; i < options.length; i++){
			var option = options[i],
				attr = option.getAttributeNode('value'),
				optionValue = (attr && attr.specified) ? option.value : option.get('text');
			if (optionValue === value) return option.selected = true;
		}
	},

	get: function(){
		var option = this, tag = option.get('tag');

		if (tag != 'select' && tag != 'option') return this.getProperty('value');

		if (tag == 'select' && !(option = option.getSelected()[0])) return '';

		var attr = option.getAttributeNode('value');
		return (attr && attr.specified) ? option.value : option.get('text');
	}

};
testForm = null;
/*</ltIE9>*/

/*<IE>*/
if (document.createElement('div').getAttributeNode('id')) Element.Properties.id = {
	set: function(id){
		this.id = this.getAttributeNode('id').value = id;
	},
	get: function(){
		return this.id || null;
	},
	erase: function(){
		this.id = this.getAttributeNode('id').value = '';
	}
};
/*</IE>*/

})();

/*
---

name: Event

description: Contains the Event Type, to make the event object cross-browser.

license: MIT-style license.

requires: [Window, Document, Array, Function, String, Object]

provides: Event

...
*/

(function() {

var _keys = {};

var DOMEvent = this.DOMEvent = new Type('DOMEvent', function(event, win){
	if (!win) win = window;
	event = event || win.event;
	if (event.$extended) return event;
	this.event = event;
	this.$extended = true;
	this.shift = event.shiftKey;
	this.control = event.ctrlKey;
	this.alt = event.altKey;
	this.meta = event.metaKey;
	var type = this.type = event.type;
	var target = event.target || event.srcElement;
	while (target && target.nodeType == 3) target = target.parentNode;
	this.target = document.id(target);

	if (type.indexOf('key') == 0){
		var code = this.code = (event.which || event.keyCode);
		this.key = _keys[code]/*<1.3compat>*/ || Object.keyOf(Event.Keys, code)/*</1.3compat>*/;
		if (type == 'keydown' || type == 'keyup'){
			if (code > 111 && code < 124) this.key = 'f' + (code - 111);
			else if (code > 95 && code < 106) this.key = code - 96;
		}
		if (this.key == null) this.key = String.fromCharCode(code).toLowerCase();
	} else if (type == 'click' || type == 'dblclick' || type == 'contextmenu' || type == 'DOMMouseScroll' || type.indexOf('mouse') == 0){
		var doc = win.document;
		doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
		this.page = {
			x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
			y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
		};
		this.client = {
			x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
			y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
		};
		if (type == 'DOMMouseScroll' || type == 'mousewheel')
			this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;

		this.rightClick = (event.which == 3 || event.button == 2);
		if (type == 'mouseover' || type == 'mouseout'){
			var related = event.relatedTarget || event[(type == 'mouseover' ? 'from' : 'to') + 'Element'];
			while (related && related.nodeType == 3) related = related.parentNode;
			this.relatedTarget = document.id(related);
		}
	} else if (type.indexOf('touch') == 0 || type.indexOf('gesture') == 0){
		this.rotation = event.rotation;
		this.scale = event.scale;
		this.targetTouches = event.targetTouches;
		this.changedTouches = event.changedTouches;
		var touches = this.touches = event.touches;
		if (touches && touches[0]){
			var touch = touches[0];
			this.page = {x: touch.pageX, y: touch.pageY};
			this.client = {x: touch.clientX, y: touch.clientY};
		}
	}

	if (!this.client) this.client = {};
	if (!this.page) this.page = {};
});

DOMEvent.implement({

	stop: function(){
		return this.preventDefault().stopPropagation();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});

DOMEvent.defineKey = function(code, key){
	_keys[code] = key;
	return this;
};

DOMEvent.defineKeys = DOMEvent.defineKey.overloadSetter(true);

DOMEvent.defineKeys({
	'38': 'up', '40': 'down', '37': 'left', '39': 'right',
	'27': 'esc', '32': 'space', '8': 'backspace', '9': 'tab',
	'46': 'delete', '13': 'enter'
});

})();

/*<1.3compat>*/
var Event = DOMEvent;
Event.Keys = {};
/*</1.3compat>*/

/*<1.2compat>*/

Event.Keys = new Hash(Event.Keys);

/*</1.2compat>*/

/*
---

name: Element.Event

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events, if necessary.

license: MIT-style license.

requires: [Element, Event]

provides: Element.Event

...
*/

(function(){

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

[Element, Window, Document].invoke('implement', {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		if (!events[type]) events[type] = {keys: [], values: []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type,
			custom = Element.Events[type],
			condition = fn,
			self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn, type);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event, type)) return fn.call(this, event);
					return true;
				};
			}
			if (custom.base) realType = Function.from(custom.base).call(this, type);
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new DOMEvent(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn, arguments[2]);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var list = events[type];
		var index = list.keys.indexOf(fn);
		if (index == -1) return this;
		var value = list.values[index];
		delete list.keys[index];
		delete list.values[index];
		var custom = Element.Events[type];
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn, type);
			if (custom.base) type = Function.from(custom.base).call(this, type);
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value, arguments[2]) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			attached[events].keys.each(function(fn){
				this.removeEvent(events, fn);
			}, this);
			delete attached[events];
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		args = Array.from(args);

		events[type].keys.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var events = from.retrieve('events');
		if (!events) return this;
		if (!type){
			for (var eventType in events) this.cloneEvents(from, eventType);
		} else if (events[type]){
			events[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	orientationchange: 2, // mobile
	touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
	gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, paste: 2, input: 2, //form elements
	load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	hashchange: 1, popstate: 2, // history
	error: 1, abort: 1, scroll: 1 //misc
};

Element.Events = {
	mousewheel: {
		base: 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll'
	}
};

var check = function(event){
	var related = event.relatedTarget;
	if (related == null) return true;
	if (!related) return false;
	return (related != this && related.prefix != 'xul' && typeOf(this) != 'document' && !this.contains(related));
};

if ('onmouseenter' in document.documentElement){
	Element.NativeEvents.mouseenter = Element.NativeEvents.mouseleave = 2;
	Element.MouseenterCheck = check;
} else {
	Element.Events.mouseenter = {
		base: 'mouseover',
		condition: check
	};

	Element.Events.mouseleave = {
		base: 'mouseout',
		condition: check
	};
}

/*<ltIE9>*/
if (!window.addEventListener){
	Element.NativeEvents.propertychange = 2;
	Element.Events.change = {
		base: function(){
			var type = this.type;
			return (this.get('tag') == 'input' && (type == 'radio' || type == 'checkbox')) ? 'propertychange' : 'change';
		},
		condition: function(event){
			return event.type != 'propertychange' || event.event.propertyName == 'checked';
		}
	};
}
/*</ltIE9>*/

//<1.2compat>

Element.Events = new Hash(Element.Events);

//</1.2compat>

})();

/*
---
name: Table
description: LUA-Style table implementation.
license: MIT-style license
authors:
  - Valerio Proietti
requires: [Core/Array]
provides: [Table]
...
*/

(function(){

var Table = this.Table = function(){

	this.length = 0;
	var keys = [],
	    values = [];
	
	this.set = function(key, value){
		var index = keys.indexOf(key);
		if (index == -1){
			var length = keys.length;
			keys[length] = key;
			values[length] = value;
			this.length++;
		} else {
			values[index] = value;
		}
		return this;
	};

	this.get = function(key){
		var index = keys.indexOf(key);
		return (index == -1) ? null : values[index];
	};

	this.erase = function(key){
		var index = keys.indexOf(key);
		if (index != -1){
			this.length--;
			keys.splice(index, 1);
			return values.splice(index, 1)[0];
		}
		return null;
	};

	this.each = this.forEach = function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, keys[i], values[i], this);
	};
	
};

if (this.Type) new Type('Table', Table);

})();

/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	version: '1.5.1',
	build: '2dd695ba957196ae4b0275a690765d6636a61ccd'
};

/*
---

name: Events.Pseudos

description: Adds the functionality to add pseudo events

license: MIT-style license

authors:
  - Arian Stolwijk

requires: [Core/Class.Extras, Core/Slick.Parser, MooTools.More]

provides: [Events.Pseudos]

...
*/

(function(){

Events.Pseudos = function(pseudos, addEvent, removeEvent){

	var storeKey = '_monitorEvents:';

	var storageOf = function(object){
		return {
			store: object.store ? function(key, value){
				object.store(storeKey + key, value);
			} : function(key, value){
				(object._monitorEvents || (object._monitorEvents = {}))[key] = value;
			},
			retrieve: object.retrieve ? function(key, dflt){
				return object.retrieve(storeKey + key, dflt);
			} : function(key, dflt){
				if (!object._monitorEvents) return dflt;
				return object._monitorEvents[key] || dflt;
			}
		};
	};

	var splitType = function(type){
		if (type.indexOf(':') == -1 || !pseudos) return null;

		var parsed = Slick.parse(type).expressions[0][0],
			parsedPseudos = parsed.pseudos,
			l = parsedPseudos.length,
			splits = [];

		while (l--){
			var pseudo = parsedPseudos[l].key,
				listener = pseudos[pseudo];
			if (listener != null) splits.push({
				event: parsed.tag,
				value: parsedPseudos[l].value,
				pseudo: pseudo,
				original: type,
				listener: listener
			});
		}
		return splits.length ? splits : null;
	};

	return {

		addEvent: function(type, fn, internal){
			var split = splitType(type);
			if (!split) return addEvent.call(this, type, fn, internal);

			var storage = storageOf(this),
				events = storage.retrieve(type, []),
				eventType = split[0].event,
				args = Array.slice(arguments, 2),
				stack = fn,
				self = this;

			split.each(function(item){
				var listener = item.listener,
					stackFn = stack;
				if (listener == false) eventType += ':' + item.pseudo + '(' + item.value + ')';
				else stack = function(){
					listener.call(self, item, stackFn, arguments, stack);
				};
			});

			events.include({type: eventType, event: fn, monitor: stack});
			storage.store(type, events);

			if (type != eventType) addEvent.apply(this, [type, fn].concat(args));
			return addEvent.apply(this, [eventType, stack].concat(args));
		},

		removeEvent: function(type, fn){
			var split = splitType(type);
			if (!split) return removeEvent.call(this, type, fn);

			var storage = storageOf(this),
				events = storage.retrieve(type);
			if (!events) return this;

			var args = Array.slice(arguments, 2);

			removeEvent.apply(this, [type, fn].concat(args));
			events.each(function(monitor, i){
				if (!fn || monitor.event == fn) removeEvent.apply(this, [monitor.type, monitor.monitor].concat(args));
				delete events[i];
			}, this);

			storage.store(type, events);
			return this;
		}

	};

};

var pseudos = {

	once: function(split, fn, args, monitor){
		fn.apply(this, args);
		this.removeEvent(split.event, monitor)
			.removeEvent(split.original, fn);
	},

	throttle: function(split, fn, args){
		if (!fn._throttled){
			fn.apply(this, args);
			fn._throttled = setTimeout(function(){
				fn._throttled = false;
			}, split.value || 250);
		}
	},

	pause: function(split, fn, args){
		clearTimeout(fn._pause);
		fn._pause = fn.delay(split.value || 250, this, args);
	}

};

Events.definePseudo = function(key, listener){
	pseudos[key] = listener;
	return this;
};

Events.lookupPseudo = function(key){
	return pseudos[key];
};

var proto = Events.prototype;
Events.implement(Events.Pseudos(pseudos, proto.addEvent, proto.removeEvent));

['Request', 'Fx'].each(function(klass){
	if (this[klass]) this[klass].implement(Events.prototype);
});

})();

/*
---

name: JSON

description: JSON encoder and decoder.

license: MIT-style license.

SeeAlso: <http://www.json.org/>

requires: [Array, String, Number, Function]

provides: JSON

...
*/

if (typeof JSON == 'undefined') this.JSON = {};

//<1.2compat>

JSON = new Hash({
	stringify: JSON.stringify,
	parse: JSON.parse
});

//</1.2compat>

(function(){

var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};

var escape = function(chr){
	return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
};

JSON.validate = function(string){
	string = string.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
					replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
					replace(/(?:^|:|,)(?:\s*\[)+/g, '');

	return (/^[\],:{}\s]*$/).test(string);
};

JSON.encode = JSON.stringify ? function(obj){
	return JSON.stringify(obj);
} : function(obj){
	if (obj && obj.toJSON) obj = obj.toJSON();

	switch (typeOf(obj)){
		case 'string':
			return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
		case 'array':
			return '[' + obj.map(JSON.encode).clean() + ']';
		case 'object': case 'hash':
			var string = [];
			Object.each(obj, function(value, key){
				var json = JSON.encode(value);
				if (json) string.push(JSON.encode(key) + ':' + json);
			});
			return '{' + string + '}';
		case 'number': case 'boolean': return '' + obj;
		case 'null': return 'null';
	}

	return null;
};

JSON.secure = true;
//<1.4compat>
JSON.secure = false;
//</1.4compat>

JSON.decode = function(string, secure){
	if (!string || typeOf(string) != 'string') return null;
    
	if (secure == null) secure = JSON.secure; 
	if (secure){
		if (JSON.parse) return JSON.parse(string);
		if (!JSON.validate(string)) throw new Error('JSON could not decode the input; security is enabled and the value is not secure.');
	}

	return eval('(' + string + ')');
};

})();

/*
---
name: Element.Data
description: Stores data in HTML5 data properties
requires: [Core/Element, Core/JSON]
provides: [Element.Data]
script: Element.Data.js
...
*/
(function(){

	JSON.isSecure = function(string){
		//this verifies that the string is parsable JSON and not malicious (borrowed from JSON.js in MooTools, which in turn borrowed it from Crockford)
		//this version is a little more permissive, as it allows single quoted attributes because forcing the use of double quotes
		//is a pain when this stuff is used as HTML properties
		return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '').replace(/'[^'\\\n\r]*'/g, ''));
	};

	Element.implement({
		/*
			sets an HTML5 data property.
			arguments:
				name - (string) the data name to store; will be automatically prefixed with 'data-'.
				value - (string, number) the value to store.
		*/
		setData: function(name, value){
			return this.set('data-' + name.hyphenate(), value);
		},

		getData: function(name, defaultValue){
			var value = this.get('data-' + name.hyphenate());
			if (value != undefined){
				return value;
			} else if (defaultValue != undefined){
				this.setData(name, defaultValue);
				return defaultValue;
			}
		},

		/*
			arguments:
				name - (string) the data name to store; will be automatically prefixed with 'data-'
				value - (string, array, or object) if an object or array the object will be JSON encoded; otherwise stored as provided.
		*/
		setJSONData: function(name, value){
			return this.setData(name, JSON.encode(value));
		},

		/*
			retrieves a property from HTML5 data property you specify

			arguments:
				name - (retrieve) the data name to store; will be automatically prefixed with 'data-'
				strict - (boolean) if true, will set the JSON.decode's secure flag to true; otherwise the value is still tested but allows single quoted attributes.
				defaultValue - (string, array, or object) the value to set if no value is found (see storeData above)
		*/
		getJSONData: function(name, strict, defaultValue){
			strict = strict === undefined ? false : strict;
			var value = this.get('data-' + name);
			if (value != undefined){
				if (value && JSON.isSecure(value)) {
					return JSON.decode(value, strict);
				} else {
					return value;
				}
			} else if (defaultValue != undefined){
				this.setJSONData(name, defaultValue);
				return defaultValue;
			}
		}

	});

})();

/*
---
name: BehaviorAPI
description: HTML getters for Behavior's API model.
requires: [Core/Class, /Element.Data]
provides: [BehaviorAPI]
...
*/


(function(){
	//see Docs/BehaviorAPI.md for documentation of public methods.

	var reggy = /[^a-z0-9\-]/gi,
	    dots = /\./g;

	window.BehaviorAPI = new Class({
		element: null,
		prefix: '',
		defaults: {},

		initialize: function(element, prefix){
			this.element = element;
			this.prefix = prefix.toLowerCase().replace(dots, '-').replace(reggy, '');
		},

		/******************
		 * PUBLIC METHODS
		 ******************/

		get: function(/* name[, name, name, etc] */){
			if (arguments.length > 1) return this._getObj(Array.from(arguments));
			return this._getValue(arguments[0]);
		},

		getAs: function(/*returnType, name, defaultValue OR {name: returnType, name: returnType, etc}*/){
			if (typeOf(arguments[0]) == 'object') return this._getValuesAs.apply(this, arguments);
			return this._getValueAs.apply(this, arguments);
		},

		require: function(/* name[, name, name, etc] */){
			for (var i = 0; i < arguments.length; i++){
				if (this._getValue(arguments[i]) == undefined) throw new Error('Could not retrieve ' + this.prefix + '-' + arguments[i] + ' option from element.');
			}
			return this;
		},

		requireAs: function(returnType, name /* OR {name: returnType, name: returnType, etc}*/){
			var val;
			if (typeOf(arguments[0]) == 'object'){
				for (var objName in arguments[0]){
					val = this._getValueAs(arguments[0][objName], objName);
					if (val === undefined || val === null) throw new Error("Could not retrieve " + this.prefix + '-' + objName + " option from element.");
				}
			} else {
				val = this._getValueAs(returnType, name);
				if (val === undefined || val === null) throw new Error("Could not retrieve " + this.prefix + '-' + name + " option from element.");
			}
			return this;
		},

		setDefault: function(name, value /* OR {name: value, name: value, etc }*/){
			if (typeOf(arguments[0]) == 'object'){
				for (var objName in arguments[0]){
					this.setDefault(objName, arguments[0][objName]);
				}
				return this;
			}
			name = name.camelCase();

			switch (typeOf(value)){
				case 'object': value = Object.clone(value); break;
				case 'array': value = Array.clone(value); break;
				case 'hash': value = new Hash(value); break;
			}

			this.defaults[name] = value;
			var setValue = this._getValue(name);
			var options = this._getOptions();
			if (setValue == null){
				options[name] = value;
			} else if (typeOf(setValue) == 'object' && typeOf(value) == 'object') {
				options[name] = Object.merge({}, value, setValue);
			}
			return this;
		},

		refreshAPI: function(){
			delete this.options;
			this.setDefault(this.defaults);
			return;
		},

		/******************
		 * PRIVATE METHODS
		 ******************/

		//given an array of names, returns an object of key/value pairs for each name
		_getObj: function(names){
			var obj = {};
			names.each(function(name){
				var value = this._getValue(name);
				if (value !== undefined) obj[name] = value;
			}, this);
			return obj;
		},
		//gets the data-behaviorname-options object and parses it as JSON
		_getOptions: function(){
			try {
				if (!this.options){
					var options = this.element.getData(this.prefix + '-options', '{}').trim();
					if (options === "") return this.options = {};
					if (options && options.substring(0,1) != '{') options = '{' + options + '}';
					var isSecure = JSON.isSecure(options);
					if (!isSecure) throw new Error('warning, options value for element is not parsable, check your JSON format for quotes, etc.');
					this.options = isSecure ? JSON.decode(options, false) : {};
					for (option in this.options) {
						this.options[option.camelCase()] = this.options[option];
					}
				}
			} catch (e){
				throw new Error('Could not get options from element; check your syntax. ' + this.prefix + '-options: "' + this.element.getData(this.prefix + '-options', '{}') + '"');
			}
			return this.options;
		},
		//given a name (string) returns the value for it
		_getValue: function(name){
			name = name.camelCase();
			var options = this._getOptions();
			if (!options.hasOwnProperty(name)){
				var inline = this.element.getData(this.prefix + '-' + name.hyphenate());
				if (inline) options[name] = inline;
			}
			return options[name];
		},
		//given a Type and a name (string) returns the value for it coerced to that type if possible
		//else returns the defaultValue or null
		_getValueAs: function(returnType, name, defaultValue){
			var value = this._getValue(name);
			if (value == null || value == undefined) return defaultValue;
			var coerced = this._coerceFromString(returnType, value);
			if (coerced == null) throw new Error("Could not retrieve value '" + name + "' as the specified type. Its value is: " + value);
			return coerced;
		},
		//given an object of name/Type pairs, returns those as an object of name/value (as specified Type) pairs
		_getValuesAs: function(obj){
			var returnObj = {};
			for (var name in obj){
				returnObj[name] = this._getValueAs(obj[name], name);
			}
			return returnObj;
		},
		//attempts to run a value through the JSON parser. If the result is not of that type returns null.
		_coerceFromString: function(toType, value){
			if (typeOf(value) == 'string' && toType != String){
				if (JSON.isSecure(value)) value = JSON.decode(value, false);
			}
			if (instanceOf(value, toType)) return value;
			return null;
		}
	});

})();

/*
---
name: Behavior
description: Auto-instantiates widgets/classes based on parsed, declarative HTML.
requires: [Core/Class.Extras, Core/Element.Event, Core/Selectors, More/Table, More/Events.Pseudos, /Element.Data, /BehaviorAPI]
provides: [Behavior]
...
*/

(function(){

	var getLog = function(method){
		return function(){
			if (window.console && console[method]){
				if(console[method].apply) console[method].apply(console, arguments);
				else console[method](Array.from(arguments).join(' '));
			}
		};
	};

	var checkOverflow = function(el) {
	  return (el.offsetHeight < el.scrollHeight || el.offsetWidth < el.scrollWidth) &&
	  			 (['auto', 'scroll'].contains(el.getStyle('overflow')) || ['auto', 'scroll'].contains(el.getStyle('overflow-y')));
	};

	var PassMethods = new Class({
		//pass a method pointer through to a filter
		//by default the methods for add/remove events are passed to the filter
		//pointed to this instance of behavior. you could use this to pass along
		//other methods to your filters. For example, a method to close a popup
		//for filters presented inside popups.
		passMethod: function(method, fn){
			if (this.API.prototype[method]) throw new Error('Cannot overwrite API method ' + method + ' as it already exists');
			this.API.implement(method, fn);
			return this;
		},

		passMethods: function(methods){
			for (var method in methods) this.passMethod(method, methods[method]);
			return this;
		}

	});



	var GetAPI = new Class({
		_getAPI: function(element, filter){
			var api = new this.API(element, filter.name);
			var getElements = function(apiKey, warnOrFail, multi){
				var method = warnOrFail || "fail";
				var selector = api.get(apiKey);
				if (!selector) api[method]("Could not find selector for " + apiKey);

				var result = Behavior[multi ? 'getTargets' : 'getTarget'](element, selector);
				if (!result || (multi && !result.length)) api[method]("Could not find any elements for target '" + apiKey + "' using selector '" + selector + "'");
				return result;
			};
			api.getElement = function(apiKey, warnOrFail){
				return getElements(apiKey, warnOrFail);
			};
			api.getElements = function(apiKey, warnOrFail){
				return getElements(apiKey, warnOrFail, true);
			};
			return api;
		}
	});

	var spaceOrCommaRegex = /\s*,\s*|\s+/g;

	BehaviorAPI.implement({
		deprecate: function(deprecated, asJSON){
			var set,
			    values = {};
			Object.each(deprecated, function(prop, key){
				var value = this.element[ asJSON ? 'getJSONData' : 'getData'](prop, false);
				if (value !== undefined){
					set = true;
					values[key] = value;
				}
			}, this);
			this.setDefault(values);
			return this;
		}
	});

	this.Behavior = new Class({

		Implements: [Options, Events, PassMethods, GetAPI],

		options: {
			//by default, errors thrown by filters are caught; the onError event is fired.
			//set this to *true* to NOT catch these errors to allow them to be handled by the browser.
			// breakOnErrors: false,
			// container: document.body,
			// onApply: function(elements){},
			//default error behavior when a filter cannot be applied
			onLog: getLog('info'),
			onError: getLog('error'),
			onWarn: getLog('warn'),
			enableDeprecation: true,
			selector: '[data-behavior]'
		},

		initialize: function(options){
			this.setOptions(options);
			this.API = new Class({ Extends: BehaviorAPI });
			this.passMethods({
				getDelegator: this.getDelegator.bind(this),
				getBehavior: Function.from(this),
				addEvent: this.addEvent.bind(this),
				removeEvent: this.removeEvent.bind(this),
				addEvents: this.addEvents.bind(this),
				removeEvents: this.removeEvents.bind(this),
				fireEvent: this.fireEvent.bind(this),
				applyFilters: this.apply.bind(this),
				applyFilter: this.applyFilter.bind(this),
				getContentElement: this.getContentElement.bind(this),
				cleanup: this.cleanup.bind(this),
				getContainerSize: function(){
					return this.getContentElement().measure(function(){
						return this.getSize();
					});
				}.bind(this),
				error: function(){ this.fireEvent('error', arguments); }.bind(this),
				fail: function(){
					var msg = Array.join(arguments, ' ');
					throw new Error(msg);
				},
				warn: function(){
					this.fireEvent('warn', arguments);
				}.bind(this)
			});

			if (window.Fx && Fx.Scroll){
				this.passMethods({
					getScroller: function(el){
						var par = (el || this.element).getParent();
						while (par != document.body && !checkOverflow(par)){
							par = par.getParent();
						}
						var fx = par.retrieve('behaviorScroller');
						if (!fx) fx = new Fx.Scroll(par);
						if (this.get('scrollerOptions')) fx.setOptions(this.get('scrollerOptions'));
						return fx;
					}
				});
			}

			this.addEvents({
				destroyDom: function(elements){
					Array.from(elements).each(function(element){
						this.cleanup(element);
					}, this);
				}.bind(this),
				ammendDom: function(container){
					this.apply(container);
				}.bind(this)
			});
			if (window.history && 'pushState' in history){
				this.addEvent('updateHistory', function(url){
					history.pushState(null, null, url);
				});
			}
		},

		getDelegator: function(){
			return this.delegator;
		},

		setDelegator: function(delegator){
			if (!instanceOf(delegator, Delegator)) throw new Error('Behavior.setDelegator only accepts instances of Delegator.');
			this.delegator = delegator;
			return this;
		},

		getContentElement: function(){
			return this.options.container || document.body;
		},

		//Applies all the behavior filters for an element.
		//container - (element) an element to apply the filters registered with this Behavior instance to.
		//force - (boolean; optional) passed through to applyFilter (see it for docs)
		apply: function(container, force){
			var elements = this._getElements(container).each(function(element){
				var plugins = [];
				element.getBehaviors().each(function(name){
					var filter = this.getFilter(name);
					if (!filter){
						this.fireEvent('error', ['There is no filter registered with this name: ', name, element]);
					} else {
						var config = filter.config;
						if (config.delay !== undefined){
							this.applyFilter.delay(filter.config.delay, this, [element, filter, force]);
						} else if(config.delayUntil){
							this._delayFilterUntil(element, filter, force);
						} else if(config.initializer){
							this._customInit(element, filter, force);
						} else {
							plugins.append(this.applyFilter(element, filter, force, true));
						}
					}
				}, this);
				plugins.each(function(plugin){
					if (this.options.verbose) this.fireEvent('log', ['Firing plugin...']);
					plugin();
				}, this);
			}, this);
			this.fireEvent('apply', [elements]);
			return this;
		},

		_getElements: function(container){
			if (typeOf(this.options.selector) == 'function') return this.options.selector(container);
			else return document.id(container).getElements(this.options.selector);
		},

		//delays a filter until the event specified in filter.config.delayUntil is fired on the element
		_delayFilterUntil: function(element, filter, force){
			var events = filter.config.delayUntil.split(','),
			    attached = {},
			    inited = false;
			var clear = function(){
				events.each(function(event){
					element.removeEvent(event, attached[event]);
				});
				clear = function(){};
			};
			events.each(function(event){
				var init = function(e){
					clear();
					if (inited) return;
					inited = true;
					var setup = filter.setup;
					filter.setup = function(element, api, _pluginResult){
						api.event = e;
						return setup.apply(filter, [element, api, _pluginResult]);
					};
					this.applyFilter(element, filter, force);
					filter.setup = setup;
				}.bind(this);
				element.addEvent(event, init);
				attached[event] = init;
			}, this);
		},

		//runs custom initiliazer defined in filter.config.initializer
		_customInit: function(element, filter, force){
			var api = this._getAPI(element, filter);
			api.runSetup = this.applyFilter.pass([element, filter, force], this);
			filter.config.initializer(element, api);
		},

		//Applies a specific behavior to a specific element.
		//element - the element to which to apply the behavior
		//filter - (object) a specific behavior filter, typically one registered with this instance or registered globally.
		//force - (boolean; optional) apply the behavior to each element it matches, even if it was previously applied. Defaults to *false*.
		//_returnPlugins - (boolean; optional; internal) if true, plugins are not rendered but instead returned as an array of functions
		//_pluginTargetResult - (obj; optional internal) if this filter is a plugin for another, this is whatever that target filter returned
		//                      (an instance of a class for example)
		applyFilter: function(element, filter, force, _returnPlugins, _pluginTargetResult){
			var pluginsToReturn = [];
			if (this.options.breakOnErrors){
				pluginsToReturn = this._applyFilter.apply(this, arguments);
			} else {
				try {
					pluginsToReturn = this._applyFilter.apply(this, arguments);
				} catch (e){
					this.fireEvent('error', ['Could not apply the behavior ' + filter.name, e.message]);
				}
			}
			return _returnPlugins ? pluginsToReturn : this;
		},

		//see argument list above for applyFilter
		_applyFilter: function(element, filter, force, _returnPlugins, _pluginTargetResult){
			var pluginsToReturn = [];
			element = document.id(element);
			//get the filters already applied to this element
			var applied = getApplied(element);
			//if this filter is not yet applied to the element, or we are forcing the filter
			if (!applied[filter.name] || force){
				if (this.options.verbose) this.fireEvent('log', ['Applying behavior: ', filter.name, element]);
				//if it was previously applied, garbage collect it
				if (applied[filter.name]) applied[filter.name].cleanup(element);
				var api = this._getAPI(element, filter);

				//deprecated
				api.markForCleanup = filter.markForCleanup.bind(filter);
				api.onCleanup = function(fn){
					filter.markForCleanup(element, fn);
				};

				if (filter.config.deprecated && this.options.enableDeprecation) api.deprecate(filter.config.deprecated);
				if (filter.config.deprecateAsJSON && this.options.enableDeprecation) api.deprecate(filter.config.deprecatedAsJSON, true);

				//deal with requirements and defaults
				if (filter.config.requireAs){
					api.requireAs(filter.config.requireAs);
				} else if (filter.config.require){
					api.require.apply(api, Array.from(filter.config.require));
				}

				if (filter.config.defaults) api.setDefault(filter.config.defaults);

				//apply the filter
				if (Behavior.debugging && Behavior.debugging.contains(filter.name)) debugger;
				var result = filter.setup(element, api, _pluginTargetResult);
				if (filter.config.returns && !instanceOf(result, filter.config.returns)){
					throw new Error("Filter " + filter.name + " did not return a valid instance.");
				}
				element.store('Behavior Filter result:' + filter.name, result);
				if (this.options.verbose){
					if (result && !_pluginTargetResult) this.fireEvent('log', ['Successfully applied behavior: ', filter.name, element, result]);
					else this.fireEvent('warn', ['Behavior applied, but did not return result: ', filter.name, element, result]);
				}

				//and mark it as having been previously applied
				applied[filter.name] = filter;
				//apply all the plugins for this filter
				var plugins = this.getPlugins(filter.name);
				if (plugins){
					for (var name in plugins){
						if (_returnPlugins){
							pluginsToReturn.push(this.applyFilter.pass([element, plugins[name], force, null, result], this));
						} else {
							this.applyFilter(element, plugins[name], force, null, result);
						}
					}
				}
			}
			return pluginsToReturn;
		},

		//given a name, returns a registered behavior
		getFilter: function(name){
			return this._registered[name] || Behavior.getFilter(name);
		},

		getPlugins: function(name){
			return this._plugins[name] || Behavior._plugins[name];
		},

		//Garbage collects all applied filters for an element and its children.
		//element - (*element*) container to cleanup
		//ignoreChildren - (*boolean*; optional) if *true* only the element will be cleaned, otherwise the element and all the
		//	  children with filters applied will be cleaned. Defaults to *false*.
		cleanup: function(element, ignoreChildren){
			element = document.id(element);
			var applied = getApplied(element);
			for (var filter in applied){
				applied[filter].cleanup(element);
				element.eliminate('Behavior Filter result:' + filter);
				delete applied[filter];
			}
			if (!ignoreChildren) this._getElements(element).each(this.cleanup, this);
			return this;
		}

	});

	//Export these for use elsewhere (notabily: Delegator).
	Behavior.getLog = getLog;
	Behavior.PassMethods = PassMethods;
	Behavior.GetAPI = GetAPI;


	//Returns the applied behaviors for an element.
	var getApplied = function(el){
		return el.retrieve('_appliedBehaviors', {});
	};

	//Registers a behavior filter.
	//name - the name of the filter
	//fn - a function that applies the filter to the given element
	//overwrite - (boolean) if true, will overwrite existing filter if one exists; defaults to false.
	var addFilter = function(name, fn, overwrite){
		if (!this._registered[name] || overwrite) this._registered[name] = new Behavior.Filter(name, fn);
		else throw new Error('Could not add the Behavior filter "' + name  +'" as a previous trigger by that same name exists.');
	};

	var addFilters = function(obj, overwrite){
		for (var name in obj){
			addFilter.apply(this, [name, obj[name], overwrite]);
		}
	};

	//Registers a behavior plugin
	//filterName - (*string*) the filter (or plugin) this is a plugin for
	//name - (*string*) the name of this plugin
	//setup - a function that applies the filter to the given element
	var addPlugin = function(filterName, name, setup, overwrite){
		if (!this._plugins[filterName]) this._plugins[filterName] = {};
		if (!this._plugins[filterName][name] || overwrite) this._plugins[filterName][name] = new Behavior.Filter(name, setup);
		else throw new Error('Could not add the Behavior filter plugin "' + name  +'" as a previous trigger by that same name exists.');
	};

	var addPlugins = function(obj, overwrite){
		for (var name in obj){
			addPlugin.apply(this, [obj[name].fitlerName, obj[name].name, obj[name].setup], overwrite);
		}
	};

	var setFilterDefaults = function(name, defaults){
		var filter = this.getFilter(name);
		if (!filter.config.defaults) filter.config.defaults = {};
		Object.append(filter.config.defaults, defaults);
	};

	var cloneFilter = function(name, newName, defaults){
		var filter = Object.clone(this.getFilter(name));
		addFilter.apply(this, [newName, filter.config]);
		this.setFilterDefaults(newName, defaults);
	};

	//Add methods to the Behavior namespace for global registration.
	Object.append(Behavior, {
		_registered: {},
		_plugins: {},
		addGlobalFilter: addFilter,
		addGlobalFilters: addFilters,
		addGlobalPlugin: addPlugin,
		addGlobalPlugins: addPlugins,
		setFilterDefaults: setFilterDefaults,
		cloneFilter: cloneFilter,
		getFilter: function(name){
			return this._registered[name];
		}
	});
	//Add methods to the Behavior class for instance registration.
	Behavior.implement({
		_registered: {},
		_plugins: {},
		addFilter: addFilter,
		addFilters: addFilters,
		addPlugin: addPlugin,
		addPlugins: addPlugins,
		cloneFilter: cloneFilter,
		setFilterDefaults: setFilterDefaults
	});

	//This class is an actual filter that, given an element, alters it with specific behaviors.
	Behavior.Filter = new Class({

		config: {
			/**
				returns: Foo,
				require: ['req1', 'req2'],
				//or
				requireAs: {
					req1: Boolean,
					req2: Number,
					req3: String
				},
				defaults: {
					opt1: false,
					opt2: 2
				},
				//simple example:
				setup: function(element, API){
					var kids = element.getElements(API.get('selector'));
					//some validation still has to occur here
					if (!kids.length) API.fail('there were no child elements found that match ', API.get('selector'));
					if (kids.length < 2) API.warn("there weren't more than 2 kids that match", API.get('selector'));
					var fooInstance = new Foo(kids, API.get('opt1', 'opt2'));
					API.onCleanup(function(){
						fooInstance.destroy();
					});
					return fooInstance;
				},
				delayUntil: 'mouseover',
				//OR
				delay: 100,
				//OR
				initializer: function(element, API){
					element.addEvent('mouseover', API.runSetup); //same as specifying event
					//or
					API.runSetup.delay(100); //same as specifying delay
					//or something completely esoteric
					var timer = (function(){
						if (element.hasClass('foo')){
							clearInterval(timer);
							API.runSetup();
						}
					}).periodical(100);
					//or
					API.addEvent('someBehaviorEvent', API.runSetup);
				});
				*/
		},

		//Pass in an object with the following properties:
		//name - the name of this filter
		//setup - a function that applies the filter to the given element
		initialize: function(name, setup){
			this.name = name;
			if (typeOf(setup) == "function"){
				this.setup = setup;
			} else {
				Object.append(this.config, setup);
				this.setup = this.config.setup;
			}
			this._cleanupFunctions = new Table();
		},

		//Stores a garbage collection pointer for a specific element.
		//Example: if your filter enhances all the inputs in the container
		//you might have a function that removes that enhancement for garbage collection.
		//You would mark each input matched with its own cleanup function.
		//NOTE: this MUST be the element passed to the filter - the element with this filters
		//      name in its data-behavior property. I.E.:
		//<form data-behavior="FormValidator">
		//  <input type="text" name="email"/>
		//</form>
		//If this filter is FormValidator, you can mark the form for cleanup, but not, for example
		//the input. Only elements that match this filter can be marked.
		markForCleanup: function(element, fn){
			var functions = this._cleanupFunctions.get(element);
			if (!functions) functions = [];
			functions.include(fn);
			this._cleanupFunctions.set(element, functions);
			return this;
		},

		//Garbage collect a specific element.
		//NOTE: this should be an element that has a data-behavior property that matches this filter.
		cleanup: function(element){
			var marks = this._cleanupFunctions.get(element);
			if (marks){
				marks.each(function(fn){ fn(); });
				this._cleanupFunctions.erase(element);
			}
			return this;
		}

	});

	Behavior.debug = function(name){
		if (!Behavior.debugging) Behavior.debugging = [];
		Behavior.debugging.push(name);
	};

	Behavior.elementDataProperty = 'behavior';

	// element fetching

	/*
		private method
		given an element and a selector, fetches elements relative to
		that element. boolean 'multi' determines if its getElement or getElements
		special cases for when the selector == 'window' (returns the window)
		and selector == 'self' (returns the element)
		- for both of those, if multi is true returns
		  new Elements([self]) or new Elements([window])
	*/
	var getTargets = function(element, selector, multi){
		// get the targets
		if (selector && selector != 'self' && selector != 'window') return element[multi ? 'getElements' : 'getElement'](selector);
		if (selector == 'window') return multi ? new Elements([window]) : window;
		return multi ? new Elements([element]) : element;
	};

	/*
		see above; public interface for getting a single element
	*/
	Behavior.getTarget = function(element, selector){
		return getTargets(element, selector, false);
	};

	/*
		see above; public interface for getting numerous elements
	*/
	Behavior.getTargets = function(element, selector){
		return getTargets(element, selector, true);
	};

	Element.implement({

		addBehaviorFilter: function(name){
			return this.setData(Behavior.elementDataProperty, this.getBehaviors().include(name).join(' '));
		},

		removeBehaviorFilter: function(name){
			return this.setData(Behavior.elementDataProperty, this.getBehaviors().erase(name).join(' '));
		},

		getBehaviors: function(){
			var filters = this.getData(Behavior.elementDataProperty);
			if (!filters) return [];
			return filters.trim().split(spaceOrCommaRegex);
		},

		hasBehavior: function(name){
			return this.getBehaviors().contains(name);
		},

		getBehaviorResult: function(name){
			return this.retrieve('Behavior Filter result:' + name);
		}

	});


})();

/*
---

name: Fx

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires: [Chain, Events, Options]

provides: Fx

...
*/

(function(){

var Fx = this.Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: nil,
		onCancel: nil,
		onComplete: nil,
		*/
		fps: 60,
		unit: false,
		duration: 500,
		frames: null,
		frameSkip: true,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(now){
		if (this.options.frameSkip){
			var diff = (this.time != null) ? (now - this.time) : 0, frames = diff / this.frameInterval;
			this.time = now;
			this.frame += frames;
		} else {
			this.frame++;
		}

		if (this.frame < this.frames){
			var delta = this.transition(this.frame / this.frames);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.frame = this.frames;
			this.set(this.compute(this.from, this.to, 1));
			this.stop();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.isRunning()) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.frame = (this.options.frameSkip) ? 0 : -1;
		this.time = null;
		this.transition = this.getTransition();
		var frames = this.options.frames, fps = this.options.fps, duration = this.options.duration;
		this.duration = Fx.Durations[duration] || duration.toInt();
		this.frameInterval = 1000 / fps;
		this.frames = frames || Math.round(this.duration / this.frameInterval);
		this.fireEvent('start', this.subject);
		pushInstance.call(this, fps);
		return this;
	},

	stop: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			if (this.frames == this.frame){
				this.fireEvent('complete', this.subject);
				if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
			} else {
				this.fireEvent('stop', this.subject);
			}
		}
		return this;
	},

	cancel: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			this.frame = this.frames;
			this.fireEvent('cancel', this.subject).clearChain();
		}
		return this;
	},

	pause: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
		}
		return this;
	},

	resume: function(){
		if (this.isPaused()) pushInstance.call(this, this.options.fps);
		return this;
	},

	isRunning: function(){
		var list = instances[this.options.fps];
		return list && list.contains(this);
	},

	isPaused: function(){
		return (this.frame < this.frames) && !this.isRunning();
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};

// global timers

var instances = {}, timers = {};

var loop = function(){
	var now = Date.now();
	for (var i = this.length; i--;){
		var instance = this[i];
		if (instance) instance.step(now);
	}
};

var pushInstance = function(fps){
	var list = instances[fps] || (instances[fps] = []);
	list.push(this);
	if (!timers[fps]) timers[fps] = loop.periodical(Math.round(1000 / fps), list);
};

var pullInstance = function(fps){
	var list = instances[fps];
	if (list){
		list.erase(this);
		if (!list.length && timers[fps]){
			delete instances[fps];
			timers[fps] = clearInterval(timers[fps]);
		}
	}
};

})();

/*
---

name: Element.Style

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires: Element

provides: Element.Style

...
*/

(function(){

var html = document.html, el;

//<ltIE9>
// Check for oldIE, which does not remove styles when they're set to null
el = document.createElement('div');
el.style.color = 'red';
el.style.color = null;
var doesNotRemoveStyles = el.style.color == 'red';

// check for oldIE, which returns border* shorthand styles in the wrong order (color-width-style instead of width-style-color)
var border = '1px solid #123abc';
el.style.border = border;
var returnsBordersInWrongOrder = el.style.border != border;
el = null;
//</ltIE9>

var hasGetComputedStyle = !!window.getComputedStyle;

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

var hasOpacity = (html.style.opacity != null),
	hasFilter = (html.style.filter != null),
	reAlpha = /alpha\(opacity=([\d.]+)\)/i;

var setVisibility = function(element, opacity){
	element.store('$opacity', opacity);
	element.style.visibility = opacity > 0 || opacity == null ? 'visible' : 'hidden';
};

//<ltIE9>
var setFilter = function(element, regexp, value){
	var style = element.style,
		filter = style.filter || element.getComputedStyle('filter') || '';
	style.filter = (regexp.test(filter) ? filter.replace(regexp, value) : filter + ' ' + value).trim();
	if (!style.filter) style.removeAttribute('filter');
};
//</ltIE9>

var setOpacity = (hasOpacity ? function(element, opacity){
	element.style.opacity = opacity;
} : (hasFilter ? function(element, opacity){
	if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
	if (opacity == null || opacity == 1){
		setFilter(element, reAlpha, '');
		if (opacity == 1 && getOpacity(element) != 1) setFilter(element, reAlpha, 'alpha(opacity=100)');
	} else {
		setFilter(element, reAlpha, 'alpha(opacity=' + (opacity * 100).limit(0, 100).round() + ')');
	}
} : setVisibility));

var getOpacity = (hasOpacity ? function(element){
	var opacity = element.style.opacity || element.getComputedStyle('opacity');
	return (opacity == '') ? 1 : opacity.toFloat();
} : (hasFilter ? function(element){
	var filter = (element.style.filter || element.getComputedStyle('filter')),
		opacity;
	if (filter) opacity = filter.match(reAlpha);
	return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
} : function(element){
	var opacity = element.retrieve('$opacity');
	if (opacity == null) opacity = (element.style.visibility == 'hidden' ? 0 : 1);
	return opacity;
}));

var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat',
	namedPositions = {left: '0%', top: '0%', center: '50%', right: '100%', bottom: '100%'},
	hasBackgroundPositionXY = (html.style.backgroundPositionX != null);

//<ltIE9>
var removeStyle = function(style, property){
	if (property == 'backgroundPosition'){
		style.removeAttribute(property + 'X');
		property += 'Y';
	}
	style.removeAttribute(property);
};
//</ltIE9>

Element.implement({

	getComputedStyle: function(property){
		if (!hasGetComputedStyle && this.currentStyle) return this.currentStyle[property.camelCase()];
		var defaultView = Element.getDocument(this).defaultView,
			computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
		return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : property.hyphenate()) : '';
	},

	setStyle: function(property, value){
		if (property == 'opacity'){
			if (value != null) value = parseFloat(value);
			setOpacity(this, value);
			return this;
		}
		property = (property == 'float' ? floatName : property).camelCase();
		if (typeOf(value) != 'string'){
			var map = (Element.Styles[property] || '@').split(' ');
			value = Array.from(value).map(function(val, i){
				if (!map[i]) return '';
				return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		//<ltIE9>
		if ((value == '' || value == null) && doesNotRemoveStyles && this.style.removeAttribute){
			removeStyle(this.style, property);
		}
		//</ltIE9>
		return this;
	},

	getStyle: function(property){
		if (property == 'opacity') return getOpacity(this);
		property = (property == 'float' ? floatName : property).camelCase();
		var result = this.style[property];
		if (!result || property == 'zIndex'){
			if (Element.ShortStyles.hasOwnProperty(property)){
				result = [];
				for (var s in Element.ShortStyles[property]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (hasBackgroundPositionXY && /^backgroundPosition[XY]?$/.test(property)){
			return result.replace(/(top|right|bottom|left)/g, function(position){
				return namedPositions[position];
			}) || '0px';
		}
		if (!result && property == 'backgroundPosition') return '0px 0px';
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (!hasGetComputedStyle && !this.style[property]){
			if ((/^(height|width)$/).test(property) && !(/px$/.test(result))){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((/^border(.+)Width|margin|padding/).test(property) && isNaN(parseFloat(result))){
				return '0px';
			}
		}
		//<ltIE9>
		if (returnsBordersInWrongOrder && /^border(Top|Right|Bottom|Left)?$/.test(property) && /^#/.test(result)){
			return result.replace(/^(.+)\s(.+)\s(.+)$/, '$2 $3 $1');
		}
		//</ltIE9>
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = {
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundSize: '@px', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
};

//<1.3compat>

Element.implement({

	setOpacity: function(value){
		setOpacity(this, value);
		return this;
	},

	getOpacity: function(){
		return getOpacity(this);
	}

});

Element.Properties.opacity = {

	set: function(opacity){
		setOpacity(this, opacity);
		setVisibility(this, opacity);
	},

	get: function(){
		return getOpacity(this);
	}

};

//</1.3compat>

//<1.2compat>

Element.Styles = new Hash(Element.Styles);

//</1.2compat>

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});

if (hasBackgroundPositionXY) Element.ShortStyles.backgroundPosition = {backgroundPositionX: '@', backgroundPositionY: '@'};
})();

/*
---

name: Fx.CSS

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires: [Fx, Element.Style]

provides: Fx.CSS

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = Array.from(values);
		var from = values[0], to = values[1];
		if (to == null){
			to = from;
			from = element.getStyle(property);
			var unit = this.options.unit;
			// adapted from: https://github.com/ryanmorr/fx/blob/master/fx.js#L299
			if (unit && from && typeof from == 'string' && from.slice(-unit.length) != unit && parseFloat(from) != 0){
				element.setStyle(property, to + unit);
				var value = element.getComputedStyle(property);
				// IE and Opera support pixelLeft or pixelWidth
				if (!(/px$/.test(value))){
					value = element.style[('pixel-' + property).camelCase()];
					if (value == null){
						// adapted from Dean Edwards' http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
						var left = element.style.left;
						element.style.left = to + unit;
						value = element.style.pixelLeft;
						element.style.left = left;
					}
				}
				from = (to || 1) / (parseFloat(value) || 1) * (parseFloat(from) || 0);
				element.setStyle(property, from + unit);
			}
		}
		return {from: this.parse(from), to: this.parse(to)};
	},

	//parses a value into an array

	parse: function(value){
		value = Function.from(value)();
		value = (typeof value == 'string') ? value.split(' ') : Array.from(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Object.each(Fx.CSS.Parsers, function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if (parsed || parsed === 0) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = Function.from('fx:css:value');
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if (typeOf(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {}, selectorTest = new RegExp('^' + selector.escapeRegExp() + '$');

		var searchStyles = function(rules){
			Array.each(rules, function(rule, i){
				if (rule.media){
					searchStyles(rule.rules || rule.cssRules);
					return;
				}
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorTest.test(selectorText)) return;
				Object.each(Element.Styles, function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = ((/^rgb/).test(value)) ? value.rgbToHex() : value;
				});
			});
		};

		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.indexOf('://') > -1 && href.indexOf(document.domain) == -1) return;
			var rules = sheet.rules || sheet.cssRules;
			searchStyles(rules);
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = {

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: Function.from(false),
		compute: function(zero, one){
			return one;
		},
		serve: function(zero){
			return zero;
		}
	}

};

//<1.2compat>

Fx.CSS.Parsers = new Hash(Fx.CSS.Parsers);

//</1.2compat>

/*
---

script: Fx.Elements.js

name: Fx.Elements

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Fx.CSS
  - MooTools.More

provides: [Fx.Elements]

...
*/

Fx.Elements = new Class({

	Extends: Fx.CSS,

	initialize: function(elements, options){
		this.elements = this.subject = $$(elements);
		this.parent(options);
	},

	compute: function(from, to, delta){
		var now = {};

		for (var i in from){
			var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
			for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
		}

		return now;
	},

	set: function(now){
		for (var i in now){
			if (!this.elements[i]) continue;

			var iNow = now[i];
			for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
		}

		return this;
	},

	start: function(obj){
		if (!this.check(obj)) return this;
		var from = {}, to = {};

		for (var i in obj){
			if (!this.elements[i]) continue;

			var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};

			for (var p in iProps){
				var parsed = this.prepare(this.elements[i], p, iProps[p]);
				iFrom[p] = parsed.from;
				iTo[p] = parsed.to;
			}
		}

		return this.parent(from, to);
	}

});

/*
---

script: Fx.Accordion.js

name: Fx.Accordion

description: An Fx.Elements extension which allows you to easily create accordion type controls.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Element.Event
  - Fx.Elements

provides: [Fx.Accordion]

...
*/

Fx.Accordion = new Class({

	Extends: Fx.Elements,

	options: {/*
		onActive: function(toggler, section){},
		onBackground: function(toggler, section){},*/
		fixedHeight: false,
		fixedWidth: false,
		display: 0,
		show: false,
		height: true,
		width: false,
		opacity: true,
		alwaysHide: false,
		trigger: 'click',
		initialDisplayFx: true,
		resetHeight: true
	},

	initialize: function(){
		var defined = function(obj){
			return obj != null;
		};

		var params = Array.link(arguments, {
			'container': Type.isElement, //deprecated
			'options': Type.isObject,
			'togglers': defined,
			'elements': defined
		});
		this.parent(params.elements, params.options);

		var options = this.options,
			togglers = this.togglers = $$(params.togglers);

		this.previous = -1;
		this.internalChain = new Chain();

		if (options.alwaysHide) this.options.link = 'chain';

		if (options.show || this.options.show === 0){
			options.display = false;
			this.previous = options.show;
		}

		if (options.start){
			options.display = false;
			options.show = false;
		}

		var effects = this.effects = {};

		if (options.opacity) effects.opacity = 'fullOpacity';
		if (options.width) effects.width = options.fixedWidth ? 'fullWidth' : 'offsetWidth';
		if (options.height) effects.height = options.fixedHeight ? 'fullHeight' : 'scrollHeight';

		for (var i = 0, l = togglers.length; i < l; i++) this.addSection(togglers[i], this.elements[i]);

		this.elements.each(function(el, i){
			if (options.show === i){
				this.fireEvent('active', [togglers[i], el]);
			} else {
				for (var fx in effects) el.setStyle(fx, 0);
			}
		}, this);

		if (options.display || options.display === 0 || options.initialDisplayFx === false){
			this.display(options.display, options.initialDisplayFx);
		}

		if (options.fixedHeight !== false) options.resetHeight = false;
		this.addEvent('complete', this.internalChain.callChain.bind(this.internalChain));
	},

	addSection: function(toggler, element){
		toggler = document.id(toggler);
		element = document.id(element);
		this.togglers.include(toggler);
		this.elements.include(element);

		var togglers = this.togglers,
			options = this.options,
			test = togglers.contains(toggler),
			idx = togglers.indexOf(toggler),
			displayer = this.display.pass(idx, this);

		toggler.store('accordion:display', displayer)
			.addEvent(options.trigger, displayer);

		if (options.height) element.setStyles({'padding-top': 0, 'border-top': 'none', 'padding-bottom': 0, 'border-bottom': 'none'});
		if (options.width) element.setStyles({'padding-left': 0, 'border-left': 'none', 'padding-right': 0, 'border-right': 'none'});

		element.fullOpacity = 1;
		if (options.fixedWidth) element.fullWidth = options.fixedWidth;
		if (options.fixedHeight) element.fullHeight = options.fixedHeight;
		element.setStyle('overflow', 'hidden');

		if (!test) for (var fx in this.effects){
			element.setStyle(fx, 0);
		}
		return this;
	},

	removeSection: function(toggler, displayIndex){
		var togglers = this.togglers,
			idx = togglers.indexOf(toggler),
			element = this.elements[idx];

		var remover = function(){
			togglers.erase(toggler);
			this.elements.erase(element);
			this.detach(toggler);
		}.bind(this);

		if (this.now == idx || displayIndex != null){
			this.display(displayIndex != null ? displayIndex : (idx - 1 >= 0 ? idx - 1 : 0)).chain(remover);
		} else {
			remover();
		}
		return this;
	},

	detach: function(toggler){
		var remove = function(toggler){
			toggler.removeEvent(this.options.trigger, toggler.retrieve('accordion:display'));
		}.bind(this);

		if (!toggler) this.togglers.each(remove);
		else remove(toggler);
		return this;
	},

	display: function(index, useFx){
		if (!this.check(index, useFx)) return this;

		var obj = {},
			elements = this.elements,
			options = this.options,
			effects = this.effects;

		if (useFx == null) useFx = true;
		if (typeOf(index) == 'element') index = elements.indexOf(index);
		if (index == this.current && !options.alwaysHide) return this;

		if (options.resetHeight){
			var prev = elements[this.current];
			if (prev && !this.selfHidden){
				for (var fx in effects) prev.setStyle(fx, prev[effects[fx]]);
			}
		}

		if ((this.timer && options.link == 'chain') || (index === this.current && !options.alwaysHide)) return this;

		if (this.current != null) this.previous = this.current;
		this.current = index;
		this.selfHidden = false;

		elements.each(function(el, i){
			obj[i] = {};
			var hide;
			if (i != index){
				hide = true;
			} else if (options.alwaysHide && ((el.offsetHeight > 0 && options.height) || el.offsetWidth > 0 && options.width)){
				hide = true;
				this.selfHidden = true;
			}
			this.fireEvent(hide ? 'background' : 'active', [this.togglers[i], el]);
			for (var fx in effects) obj[i][fx] = hide ? 0 : el[effects[fx]];
			if (!useFx && !hide && options.resetHeight) obj[i].height = 'auto';
		}, this);

		this.internalChain.clearChain();
		this.internalChain.chain(function(){
			if (options.resetHeight && !this.selfHidden){
				var el = elements[index];
				if (el) el.setStyle('height', 'auto');
			}
		}.bind(this));

		return useFx ? this.start(obj) : this.set(obj).internalChain.callChain();
	}

});

/*<1.2compat>*/
/*
	Compatibility with 1.2.0
*/
var Accordion = new Class({

	Extends: Fx.Accordion,

	initialize: function(){
		this.parent.apply(this, arguments);
		var params = Array.link(arguments, {'container': Type.isElement});
		this.container = params.container;
	},

	addSection: function(toggler, element, pos){
		toggler = document.id(toggler);
		element = document.id(element);

		var test = this.togglers.contains(toggler);
		var len = this.togglers.length;
		if (len && (!test || pos)){
			pos = pos != null ? pos : len - 1;
			toggler.inject(this.togglers[pos], 'before');
			element.inject(toggler, 'after');
		} else if (this.container && !test){
			toggler.inject(this.container);
			element.inject(this.container);
		}
		return this.parent.apply(this, arguments);
	}

});
/*</1.2compat>*/

/*
---

script: Object.Extras.js

name: Object.Extras

description: Extra Object generics, like getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Object
  - MooTools.More

provides: [Object.Extras]

...
*/

(function(){

var defined = function(value){
	return value != null;
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

Object.extend({

	getFromPath: function(source, parts){
		if (typeof parts == 'string') parts = parts.split('.');
		for (var i = 0, l = parts.length; i < l; i++){
			if (hasOwnProperty.call(source, parts[i])) source = source[parts[i]];
			else return null;
		}
		return source;
	},

	cleanValues: function(object, method){
		method = method || defined;
		for (var key in object) if (!method(object[key])){
			delete object[key];
		}
		return object;
	},

	erase: function(object, key){
		if (hasOwnProperty.call(object, key)) delete object[key];
		return object;
	},

	run: function(object){
		var args = Array.slice(arguments, 1);
		for (var key in object) if (object[key].apply){
			object[key].apply(object, args);
		}
		return object;
	}

});

})();

/*
---
description: Creates an Fx.Accordion from any element with Accordion in its data-behavior property.
             Uses the .toggle elements within the element as the toggles and the .target elements as the targets.
provides: [Behavior.Accordion, Behavior.FxAccordion]
requires: [Behavior/Behavior, More/Fx.Accordion, Behavior/Element.Data, More/Object.Extras]
script: Behavior.Accordion.js
name: Behavior.Accordion
...
*/

Behavior.addGlobalFilter('Accordion', {
  deprecated: {
    headers:'toggler-elements',
    sections:'section-elements'
  },
  defaults: {
    // defaults from Fx.Accordion:
    display: 0,
    height: true,
    width: false,
    opacity: true,
    alwaysHide: false,
    trigger: 'click',
    initialDisplayFx: true,
    resetHeight: true,
    headers: '.header',
    sections: '.section'
  },
  returns: Fx.Accordion,
  setup: function(element, api){
    var options = Object.cleanValues(
      api.getAs({
        fixedHeight: Number,
        fixedWidth: Number,
        display: Number,
        show: Number,
        height: Boolean,
        width: Boolean,
        opacity: Boolean,
        alwaysHide: Boolean,
        trigger: String,
        initialDisplayFx: Boolean,
        resetHeight: Boolean
      })
    );
    var accordion = new Fx.Accordion(element.getElements(api.get('headers')), element.getElements(api.get('sections')), options);
    api.onCleanup(accordion.detach.bind(accordion));
    return accordion;
  }
});

/*
---

name: Request

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires: [Object, Element, Chain, Events, Options, Browser]

provides: Request

...
*/

(function(){

var empty = function(){},
	progressSupport = ('onprogress' in new Browser.Request);

var Request = this.Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: function(){},
		onLoadstart: function(event, xhr){},
		onProgress: function(event, xhr){},
		onComplete: function(){},
		onCancel: function(){},
		onSuccess: function(responseText, responseXML){},
		onFailure: function(xhr){},
		onException: function(headerName, value){},
		onTimeout: function(){},
		user: '',
		password: '',*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		timeout: 0,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.headers = this.options.headers;
	},

	onStateChange: function(){
		var xhr = this.xhr;
		if (xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		Function.attempt(function(){
			var status = xhr.status;
			this.status = (status == 1223) ? 204 : status;
		}.bind(this));
		xhr.onreadystatechange = empty;
		if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
		clearTimeout(this.timer);

		this.response = {text: this.xhr.responseText || '', xml: this.xhr.responseXML};
		if (this.options.isSuccess.call(this, this.status))
			this.success(this.response.text, this.response.xml);
		else
			this.failure();
	},

	isSuccess: function(){
		var status = this.status;
		return (status >= 200 && status < 300);
	},

	isRunning: function(){
		return !!this.running;
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return Browser.exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	loadstart: function(event){
		this.fireEvent('loadstart', [event, this.xhr]);
	},

	progress: function(event){
		this.fireEvent('progress', [event, this.xhr]);
	},

	timeout: function(){
		this.fireEvent('timeout', this.xhr);
	},

	setHeader: function(name, value){
		this.headers[name] = value;
		return this;
	},

	getHeader: function(name){
		return Function.attempt(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;

		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.running = true;

		var type = typeOf(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = Object.append({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch (typeOf(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Object.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && ['post', 'put'].contains(method)){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
		}

		if (!url) url = document.location.pathname;

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (this.options.noCache)
			url += (url.indexOf('?') > -1 ? '&' : '?') + String.uniqueID();

		if (data && (method == 'get' || method == 'delete')){
			url += (url.indexOf('?') > -1 ? '&' : '?') + data;
			data = null;
		}

		var xhr = this.xhr;
		if (progressSupport){
			xhr.onloadstart = this.loadstart.bind(this);
			xhr.onprogress = this.progress.bind(this);
		}

		xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
		if (this.options.user && 'withCredentials' in xhr) xhr.withCredentials = true;

		xhr.onreadystatechange = this.onStateChange.bind(this);

		Object.each(this.headers, function(value, key){
			try {
				xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		xhr.send(data);
		if (!this.options.async) this.onStateChange();
		else if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		var xhr = this.xhr;
		xhr.abort();
		clearTimeout(this.timer);
		xhr.onreadystatechange = empty;
		if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(data){
		var object = {
			method: method
		};
		if (data != null) object.data = data;
		return this.send(object);
	};
});

Request.implement(methods);

Element.Properties.send = {

	set: function(options){
		var send = this.get('send').cancel();
		send.setOptions(options);
		return this;
	},

	get: function(){
		var send = this.retrieve('send');
		if (!send){
			send = new Request({
				data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
			});
			this.store('send', send);
		}
		return send;
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});

})();

/*
---

script: Request.JSONP.js

name: Request.JSONP

description: Defines Request.JSONP, a class for cross domain javascript via script injection.

license: MIT-style license

authors:
  - Aaron Newton
  - Guillermo Rauch
  - Arian Stolwijk

requires:
  - Core/Element
  - Core/Request
  - MooTools.More

provides: [Request.JSONP]

...
*/

Request.JSONP = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: function(src, scriptElement){},
		onComplete: function(data){},
		onSuccess: function(data){},
		onCancel: function(){},
		onTimeout: function(){},
		onError: function(){}, */
		onRequest: function(src){
			if (this.options.log && window.console && console.log){
				console.log('JSONP retrieving script with url:' + src);
			}
		},
		onError: function(src){
			if (this.options.log && window.console && console.warn){
				console.warn('JSONP '+ src +' will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs');
			}
		},
		url: '',
		callbackKey: 'callback',
		injectScript: document.head,
		data: '',
		link: 'ignore',
		timeout: 0,
		log: false
	},

	initialize: function(options){
		this.setOptions(options);
	},

	send: function(options){
		if (!Request.prototype.check.call(this, options)) return this;
		this.running = true;

		var type = typeOf(options);
		if (type == 'string' || type == 'element') options = {data: options};
		options = Object.merge(this.options, options || {});

		var data = options.data;
		switch (typeOf(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Object.toQueryString(data);
		}

		var index = this.index = Request.JSONP.counter++;

		var src = options.url +
			(options.url.test('\\?') ? '&' :'?') +
			(options.callbackKey) +
			'=Request.JSONP.request_map.request_'+ index +
			(data ? '&' + data : '');

		if (src.length > 2083) this.fireEvent('error', src);

		Request.JSONP.request_map['request_' + index] = function(){
			this.success(arguments, index);
		}.bind(this);

		var script = this.getScript(src).inject(options.injectScript);
		this.fireEvent('request', [src, script]);

		if (options.timeout) this.timeout.delay(options.timeout, this);

		return this;
	},

	getScript: function(src){
		if (!this.script) this.script = new Element('script', {
			type: 'text/javascript',
			async: true,
			src: src
		});
		return this.script;
	},

	success: function(args, index){
		if (!this.running) return;
		this.clear()
			.fireEvent('complete', args).fireEvent('success', args)
			.callChain();
	},

	cancel: function(){
		if (this.running) this.clear().fireEvent('cancel');
		return this;
	},

	isRunning: function(){
		return !!this.running;
	},

	clear: function(){
		this.running = false;
		if (this.script){
			this.script.destroy();
			this.script = null;
		}
		return this;
	},

	timeout: function(){
		if (this.running){
			this.running = false;
			this.fireEvent('timeout', [this.script.get('src'), this.script]).fireEvent('failure').cancel();
		}
		return this;
	}

});

Request.JSONP.counter = 0;
Request.JSONP.request_map = {};

/*
---

name: Fx.Tween

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		this.get('tween').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var tween = this.retrieve('tween');
		if (!tween){
			tween = new Fx.Tween(this, {link: 'cancel'});
			this.store('tween', tween);
		}
		return tween;
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(property, from, to);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), method, args = ['opacity'].append(arguments), toggle;
		if (args[1] == null) args[1] = 'toggle';
		switch (args[1]){
			case 'in': method = 'start'; args[1] = 1; break;
			case 'out': method = 'start'; args[1] = 0; break;
			case 'show': method = 'set'; args[1] = 1; break;
			case 'hide': method = 'set'; args[1] = 0; break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.getStyle('opacity') == 1);
				method = 'start';
				args[1] = flag ? 0 : 1;
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: method = 'start';
		}
		if (!toggle) this.eliminate('fade:flag');
		fade[method].apply(fade, args);
		var to = args[args.length - 1];
		if (method == 'set' || to != 0) this.setStyle('visibility', to == 0 ? 'hidden' : 'visible');
		else fade.chain(function(){
			this.element.setStyle('visibility', 'hidden');
			this.callChain();
		});
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});

/*
---

script: String.Extras.js

name: String.Extras

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
  - Aaron Newton
  - Guillermo Rauch
  - Christopher Pitt

requires:
  - Core/String
  - Core/Array
  - MooTools.More

provides: [String.Extras]

...
*/

(function(){

var special = {
	'a': /[àáâãäåăą]/g,
	'A': /[ÀÁÂÃÄÅĂĄ]/g,
	'c': /[ćčç]/g,
	'C': /[ĆČÇ]/g,
	'd': /[ďđ]/g,
	'D': /[ĎÐ]/g,
	'e': /[èéêëěę]/g,
	'E': /[ÈÉÊËĚĘ]/g,
	'g': /[ğ]/g,
	'G': /[Ğ]/g,
	'i': /[ìíîï]/g,
	'I': /[ÌÍÎÏ]/g,
	'l': /[ĺľł]/g,
	'L': /[ĹĽŁ]/g,
	'n': /[ñňń]/g,
	'N': /[ÑŇŃ]/g,
	'o': /[òóôõöøő]/g,
	'O': /[ÒÓÔÕÖØ]/g,
	'r': /[řŕ]/g,
	'R': /[ŘŔ]/g,
	's': /[ššş]/g,
	'S': /[ŠŞŚ]/g,
	't': /[ťţ]/g,
	'T': /[ŤŢ]/g,
	'u': /[ùúûůüµ]/g,
	'U': /[ÙÚÛŮÜ]/g,
	'y': /[ÿý]/g,
	'Y': /[ŸÝ]/g,
	'z': /[žźż]/g,
	'Z': /[ŽŹŻ]/g,
	'th': /[þ]/g,
	'TH': /[Þ]/g,
	'dh': /[ð]/g,
	'DH': /[Ð]/g,
	'ss': /[ß]/g,
	'oe': /[œ]/g,
	'OE': /[Œ]/g,
	'ae': /[æ]/g,
	'AE': /[Æ]/g
},

tidy = {
	' ': /[\xa0\u2002\u2003\u2009]/g,
	'*': /[\xb7]/g,
	'\'': /[\u2018\u2019]/g,
	'"': /[\u201c\u201d]/g,
	'...': /[\u2026]/g,
	'-': /[\u2013]/g,
//	'--': /[\u2014]/g,
	'&raquo;': /[\uFFFD]/g
},

conversions = {
	ms: 1,
	s: 1000,
	m: 6e4,
	h: 36e5
},

findUnits = /(\d*.?\d+)([msh]+)/;

var walk = function(string, replacements){
	var result = string, key;
	for (key in replacements) result = result.replace(replacements[key], key);
	return result;
};

var getRegexForTag = function(tag, contents){
	tag = tag || '';
	var regstr = contents ? "<" + tag + "(?!\\w)[^>]*>([\\s\\S]*?)<\/" + tag + "(?!\\w)>" : "<\/?" + tag + "([^>]+)?>",
		reg = new RegExp(regstr, "gi");
	return reg;
};

String.implement({

	standardize: function(){
		return walk(this, special);
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, direction){
		if (this.length >= length) return this;

		var pad = (str == null ? ' ' : '' + str)
			.repeat(length - this.length)
			.substr(0, length - this.length);

		if (!direction || direction == 'right') return this + pad;
		if (direction == 'left') return pad + this;

		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegexForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegexForTag(tag, contents), '');
	},

	tidy: function(){
		return walk(this, tidy);
	},

	truncate: function(max, trail, atChar){
		var string = this;
		if (trail == null && arguments.length == 1) trail = '…';
		if (string.length > max){
			string = string.substring(0, max);
			if (atChar){
				var index = string.lastIndexOf(atChar);
				if (index != -1) string = string.substr(0, index);
			}
			if (trail) string += trail;
		}
		return string;
	},

	ms: function(){
	  // "Borrowed" from https://gist.github.com/1503944
		var units = findUnits.exec(this);
		if (units == null) return Number(this);
		return Number(units[1]) * conversions[units[2]];
	}

});

})();

/*
---

script: Element.Forms.js

name: Element.Forms

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element
  - String.Extras
  - MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function(){
		if (this.selectionStart != null){
			return {
				start: this.selectionStart,
				end: this.selectionEnd
			};
		}

		var pos = {
			start: 0,
			end: 0
		};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var duplicate = range.duplicate();

		if (this.type == 'text'){
			pos.start = 0 - duplicate.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			duplicate.moveToElementText(this);
			duplicate.setEndPoint('StartToEnd', range);
			if (duplicate.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - duplicate.text.length;
			duplicate.setEndPoint('StartToStart', range);
			pos.start = offset - duplicate.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange){
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if (select !== false) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = Object.append({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);

		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');

		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if (select !== false) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});

/*
---

name: Element.Dimensions

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
  - Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
  - Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires: [Element, Element.Style]

provides: [Element.Dimensions]

...
*/

(function(){

var element = document.createElement('div'),
	child = document.createElement('div');
element.style.height = '0';
element.appendChild(child);
var brokenOffsetParent = (child.offsetParent === element);
element = child = null;

var isOffset = function(el){
	return styleString(el, 'position') != 'static' || isBody(el);
};

var isOffsetStatic = function(el){
	return isOffset(el) || (/^(?:table|td|th)$/i).test(el.tagName);
};

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this.parentNode, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: brokenOffsetParent ? function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		var isOffsetCheck = (styleString(element, 'position') == 'static') ? isOffsetStatic : isOffset;
		while ((element = element.parentNode)){
			if (isOffsetCheck(element)) return element;
		}
		return null;
	} : function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		try {
			return element.offsetParent;
		} catch(e) {}
		return null;
	},

	getOffsets: function(){
		var hasGetBoundingClientRect = this.getBoundingClientRect;
//<1.4compat>
		hasGetBoundingClientRect = hasGetBoundingClientRect && !Browser.Platform.ios
//</1.4compat>
		if (hasGetBoundingClientRect){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;
//<1.4compat>
			if (Browser.firefox){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.safari){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}
//</1.4compat>
			element = element.offsetParent;
		}
//<1.4compat>
		if (Browser.firefox && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
//</1.4compat>
		return position;
	},

	getPosition: function(relative){
		var offset = this.getOffsets(),
			scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};

		if (relative && (relative = document.id(relative))){
			var relativePosition = relative.getPosition();
			return {x: position.x - relativePosition.x - leftBorder(relative), y: position.y - relativePosition.y - topBorder(relative)};
		}
		return position;
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
			size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


[Document, Window].invoke('implement', {

	getSize: function(){
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this),
			min = this.getSize(),
			body = this.getDocument().body;

		return {x: Math.max(doc.scrollWidth, body.scrollWidth, min.x), y: Math.max(doc.scrollHeight, body.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
}

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
}

function topBorder(element){
	return styleNumber(element, 'border-top-width');
}

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
}

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
}

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
}

})();

//aliases
Element.alias({position: 'setPosition'}); //compatability

[Window, Document, Element].invoke('implement', {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});

/*
---

script: Element.Measure.js

name: Element.Measure

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - Core/Element.Dimensions
  - MooTools.More

provides: [Element.Measure]

...
*/

(function(){

var getStylesList = function(styles, planes){
	var list = [];
	Object.each(planes, function(directions){
		Object.each(directions, function(edge){
			styles.each(function(style){
				list.push(style + '-' + edge + (style == 'border' ? '-width' : ''));
			});
		});
	});
	return list;
};

var calculateEdgeSize = function(edge, styles){
	var total = 0;
	Object.each(styles, function(value, style){
		if (style.test(edge)) total = total + value.toInt();
	});
	return total;
};

var isVisible = function(el){
	return !!(!el || el.offsetHeight || el.offsetWidth);
};


Element.implement({

	measure: function(fn){
		if (isVisible(this)) return fn.call(this);
		var parent = this.getParent(),
			toMeasure = [];
		while (!isVisible(parent) && parent != document.body){
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose(),
			result = fn.call(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return function(){};
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = Object.merge({computeSize: false}, options);
		var dim = {x: 0, y: 0};

		var getSize = function(el, options){
			return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
		};

		var parent = this.getParent('body');

		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		}

		return Object.append(dim, (dim.x || dim.x === 0) ? {
				width: dim.x,
				height: dim.y
			} : {
				x: dim.width,
				y: dim.height
			}
		);
	},

	getComputedSize: function(options){
		//<1.2compat>
		//legacy support for my stupid spelling error
		if (options && options.plains) options.planes = options.plains;
		//</1.2compat>

		options = Object.merge({
			styles: ['padding','border'],
			planes: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);

		var styles = {},
			size = {width: 0, height: 0},
			dimensions;

		if (options.mode == 'vertical'){
			delete size.width;
			delete options.planes.width;
		} else if (options.mode == 'horizontal'){
			delete size.height;
			delete options.planes.height;
		}

		getStylesList(options.styles, options.planes).each(function(style){
			styles[style] = this.getStyle(style).toInt();
		}, this);

		Object.each(options.planes, function(edges, plane){

			var capitalized = plane.capitalize(),
				style = this.getStyle(plane);

			if (style == 'auto' && !dimensions) dimensions = this.getDimensions();

			style = styles[plane] = (style == 'auto') ? dimensions[plane] : style.toInt();
			size['total' + capitalized] = style;

			edges.each(function(edge){
				var edgesize = calculateEdgeSize(edge, styles);
				size['computed' + edge.capitalize()] = edgesize;
				size['total' + capitalized] += edgesize;
			});

		}, this);

		return Object.append(size, styles);
	}

});

})();

/*
---

script: Element.Position.js

name: Element.Position

description: Extends the Element native object to include methods useful positioning elements relative to others.

license: MIT-style license

authors:
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/Options
  - Core/Element.Dimensions
  - Element.Measure

provides: [Element.Position]

...
*/

(function(original){

var local = Element.Position = {

	options: {/*
		edge: false,
		returnPos: false,
		minimum: {x: 0, y: 0},
		maximum: {x: 0, y: 0},
		relFixedPosition: false,
		ignoreMargins: false,
		ignoreScroll: false,
		allowNegative: false,*/
		relativeTo: document.body,
		position: {
			x: 'center', //left, center, right
			y: 'center' //top, center, bottom
		},
		offset: {x: 0, y: 0}
	},

	getOptions: function(element, options){
		options = Object.merge({}, local.options, options);
		local.setPositionOption(options);
		local.setEdgeOption(options);
		local.setOffsetOption(element, options);
		local.setDimensionsOption(element, options);
		return options;
	},

	setPositionOption: function(options){
		options.position = local.getCoordinateFromValue(options.position);
	},

	setEdgeOption: function(options){
		var edgeOption = local.getCoordinateFromValue(options.edge);
		options.edge = edgeOption ? edgeOption :
			(options.position.x == 'center' && options.position.y == 'center') ? {x: 'center', y: 'center'} :
			{x: 'left', y: 'top'};
	},

	setOffsetOption: function(element, options){
		var parentOffset = {x: 0, y: 0};
		var parentScroll = {x: 0, y: 0};
		var offsetParent = element.measure(function(){
			return document.id(this.getOffsetParent());
		});

		if (!offsetParent || offsetParent == element.getDocument().body) return;

		parentScroll = offsetParent.getScroll();
		parentOffset = offsetParent.measure(function(){
			var position = this.getPosition();
			if (this.getStyle('position') == 'fixed'){
				var scroll = window.getScroll();
				position.x += scroll.x;
				position.y += scroll.y;
			}
			return position;
		});

		options.offset = {
			parentPositioned: offsetParent != document.id(options.relativeTo),
			x: options.offset.x - parentOffset.x + parentScroll.x,
			y: options.offset.y - parentOffset.y + parentScroll.y
		};
	},

	setDimensionsOption: function(element, options){
		options.dimensions = element.getDimensions({
			computeSize: true,
			styles: ['padding', 'border', 'margin']
		});
	},

	getPosition: function(element, options){
		var position = {};
		options = local.getOptions(element, options);
		var relativeTo = document.id(options.relativeTo) || document.body;

		local.setPositionCoordinates(options, position, relativeTo);
		if (options.edge) local.toEdge(position, options);

		var offset = options.offset;
		position.left = ((position.x >= 0 || offset.parentPositioned || options.allowNegative) ? position.x : 0).toInt();
		position.top = ((position.y >= 0 || offset.parentPositioned || options.allowNegative) ? position.y : 0).toInt();

		local.toMinMax(position, options);

		if (options.relFixedPosition || relativeTo.getStyle('position') == 'fixed') local.toRelFixedPosition(relativeTo, position);
		if (options.ignoreScroll) local.toIgnoreScroll(relativeTo, position);
		if (options.ignoreMargins) local.toIgnoreMargins(position, options);

		position.left = Math.ceil(position.left);
		position.top = Math.ceil(position.top);
		delete position.x;
		delete position.y;

		return position;
	},

	setPositionCoordinates: function(options, position, relativeTo){
		var offsetY = options.offset.y,
			offsetX = options.offset.x,
			calc = (relativeTo == document.body) ? window.getScroll() : relativeTo.getPosition(),
			top = calc.y,
			left = calc.x,
			winSize = window.getSize();

		switch(options.position.x){
			case 'left': position.x = left + offsetX; break;
			case 'right': position.x = left + offsetX + relativeTo.offsetWidth; break;
			default: position.x = left + ((relativeTo == document.body ? winSize.x : relativeTo.offsetWidth) / 2) + offsetX; break;
		}

		switch(options.position.y){
			case 'top': position.y = top + offsetY; break;
			case 'bottom': position.y = top + offsetY + relativeTo.offsetHeight; break;
			default: position.y = top + ((relativeTo == document.body ? winSize.y : relativeTo.offsetHeight) / 2) + offsetY; break;
		}
	},

	toMinMax: function(position, options){
		var xy = {left: 'x', top: 'y'}, value;
		['minimum', 'maximum'].each(function(minmax){
			['left', 'top'].each(function(lr){
				value = options[minmax] ? options[minmax][xy[lr]] : null;
				if (value != null && ((minmax == 'minimum') ? position[lr] < value : position[lr] > value)) position[lr] = value;
			});
		});
	},

	toRelFixedPosition: function(relativeTo, position){
		var winScroll = window.getScroll();
		position.top += winScroll.y;
		position.left += winScroll.x;
	},

	toIgnoreScroll: function(relativeTo, position){
		var relScroll = relativeTo.getScroll();
		position.top -= relScroll.y;
		position.left -= relScroll.x;
	},

	toIgnoreMargins: function(position, options){
		position.left += options.edge.x == 'right'
			? options.dimensions['margin-right']
			: (options.edge.x != 'center'
				? -options.dimensions['margin-left']
				: -options.dimensions['margin-left'] + ((options.dimensions['margin-right'] + options.dimensions['margin-left']) / 2));

		position.top += options.edge.y == 'bottom'
			? options.dimensions['margin-bottom']
			: (options.edge.y != 'center'
				? -options.dimensions['margin-top']
				: -options.dimensions['margin-top'] + ((options.dimensions['margin-bottom'] + options.dimensions['margin-top']) / 2));
	},

	toEdge: function(position, options){
		var edgeOffset = {},
			dimensions = options.dimensions,
			edge = options.edge;

		switch(edge.x){
			case 'left': edgeOffset.x = 0; break;
			case 'right': edgeOffset.x = -dimensions.x - dimensions.computedRight - dimensions.computedLeft; break;
			// center
			default: edgeOffset.x = -(Math.round(dimensions.totalWidth / 2)); break;
		}

		switch(edge.y){
			case 'top': edgeOffset.y = 0; break;
			case 'bottom': edgeOffset.y = -dimensions.y - dimensions.computedTop - dimensions.computedBottom; break;
			// center
			default: edgeOffset.y = -(Math.round(dimensions.totalHeight / 2)); break;
		}

		position.x += edgeOffset.x;
		position.y += edgeOffset.y;
	},

	getCoordinateFromValue: function(option){
		if (typeOf(option) != 'string') return option;
		option = option.toLowerCase();

		return {
			x: option.test('left') ? 'left'
				: (option.test('right') ? 'right' : 'center'),
			y: option.test(/upper|top/) ? 'top'
				: (option.test('bottom') ? 'bottom' : 'center')
		};
	}

};

Element.implement({

	position: function(options){
		if (options && (options.x != null || options.y != null)){
			return (original ? original.apply(this, arguments) : this);
		}
		var position = this.setStyle('position', 'absolute').calculatePosition(options);
		return (options && options.returnPos) ? position : this.setStyles(position);
	},

	calculatePosition: function(options){
		return local.getPosition(this, options);
	}

});

})(Element.prototype.position);

/*
---
name: Autocompleter.Observer

description: Observe formelements for changes

version: 1.0rc3

license: MIT-style license
author: Harald Kirschner <mail [at] digitarald.de>
copyright: Author

requires: [Core/Class.Extras, Core/Element.Event, Core/JSON]

provides: [Autocompleter.Observer, Observer]

...
 */
var Observer = new Class({

  Implements: [Options, Events],

  options: {
    periodical: false,
    delay: 1000
  },

  initialize: function(el, onFired, options){
    this.setOptions(options);
    this.addEvent('onFired', onFired);
    this.element = document.id(el) || $$(el);
    /* Clientcide change */
    this.boundChange = this.changed.bind(this);
    this.resume();
  },

  changed: function(){
    var value = this.element.get('value');
    if ($equals(this.value, value)) return;
    this.clear();
    this.value = value;
    this.timeout = this.onFired.delay(this.options.delay, this);
  },

  setValue: function(value){
    this.value = value;
    this.element.set('value', value);
    return this.clear();
  },

  onFired: function(){
    this.fireEvent('onFired', [this.value, this.element]);
  },

  clear: function(){
    clearTimeout(this.timeout || null);
    return this;
  },
  /* Clientcide change */
  pause: function(){
    clearTimeout(this.timeout);
    clearTimeout(this.timer);
    this.element.removeEvent('keyup', this.boundChange);
    return this;
  },
  resume: function(){
    this.value = this.element.get('value');
    if (this.options.periodical) this.timer = this.changed.periodical(this.options.periodical, this);
    else this.element.addEvent('keyup', this.boundChange);
    return this;
  }

});

var $equals = function(obj1, obj2){
  return (obj1 == obj2 || JSON.encode(obj1) == JSON.encode(obj2));
};
/*
---
name: Autocompleter

description: An auto completer class from <a href=\"http://digitarald.de\">http://digitarald.de</a>.

version: 1.1.1

license: MIT-style license

author: Harald Kirschner <mail [at] digitarald.de>

copyright: Author

requires: [Core/Fx.Tween, More/Element.Forms, More/Element.Position, Autocompleter.Observer]

provides: [Autocompleter, Autocompleter.Base]

...
*/
var Autocompleter = {};

Autocompleter.Base = new Class({

  Implements: [Options, Events],

  options: {
    minLength: 1,
    markQuery: true,
    width: 'inherit',
    maxChoices: 10,
//    injectChoice: null,
//    customChoices: null,
    className: 'autocompleter-choices',
    zIndex: 42,
    delay: 400,
    observerOptions: {},
    fxOptions: {},
//    onSelection: function(){},
//    onShow: function(){},
//    onHide: function(){},
//    onBlur: function(){},
//    onFocus: function(){},
//    onChoiceConfirm: function(){},

    autoSubmit: false,
    overflow: false,
    overflowMargin: 25,
    selectFirst: false,
    filter: null,
    filterCase: false,
    filterSubset: false,
    forceSelect: false,
    selectMode: true,
    choicesMatch: null,

    multiple: false,
    separator: ', ',
    autoTrim: true,
    allowDupes: false,

    cache: true,
    relative: false
  },

  initialize: function(element, options){
    this.element = document.id(element);
    this.setOptions(options);
    this.options.separatorSplit = new RegExp("\s*["+
      this.options.separator == " " ? " " : this.options.separator.trim()+
      "]\s*/");
    this.build();
    this.observer = new Observer(this.element, this.prefetch.bind(this), Object.merge({
      'delay': this.options.delay
    }, this.options.observerOptions));
    this.queryValue = null;
    if (this.options.filter) this.filter = this.options.filter.bind(this);
    var mode = this.options.selectMode;
    this.typeAhead = (mode == 'type-ahead');
    this.selectMode = (mode === true) ? 'selection' : mode;
    this.cached = [];
  },

  /**
   * build - Initialize DOM
   *
   * Builds the html structure for choices and appends the events to the element.
   * Override this function to modify the html generation.
   */
  build: function(){
    if (document.id(this.options.customChoices)){
      this.choices = this.options.customChoices;
    } else {
      this.choices = new Element('ul', {
        'class': this.options.className,
        'styles': {
          'zIndex': this.options.zIndex
        }
      }).inject(document.body);
      this.relative = false;
      if (this.options.relative || this.element.getOffsetParent() != document.body){
        this.choices.inject(this.element, 'after');
        this.relative = this.element.getOffsetParent();
      }
    }
    if (!this.options.separator.test(this.options.separatorSplit)){
      this.options.separatorSplit = this.options.separator;
    }
    this.fx = (!this.options.fxOptions) ? null : new Fx.Tween(this.choices, Object.merge({
      'property': 'opacity',
      'link': 'cancel',
      'duration': 200
    }, this.options.fxOptions)).addEvent('onStart', Chain.prototype.clearChain).set(0);
    this.element.setProperty('autocomplete', 'off')
      .addEvent((Browser.ie || Browser.chrome || Browser.safari) ? 'keydown' : 'keypress', this.onCommand.bind(this))
      .addEvent('click', this.onCommand.bind(this, false))
      .addEvent('focus', function(){
        this.toggleFocus.delay(100, this, [true]);
      }.bind(this));
      //.addEvent('blur', this.toggleFocus.create({bind: this, arguments: false, delay: 100}));
    document.addEvent('click', function(e){
      if (e.target != this.choices) this.toggleFocus(false);
    }.bind(this));
  },

  destroy: function(){
    this.choices = this.selected = this.choices.destroy();
  },

  toggleFocus: function(state){
    this.focussed = state;
    if (!state) this.hideChoices(true);
    this.fireEvent((state) ? 'onFocus' : 'onBlur', [this.element]);
  },

  onCommand: function(e){
    if (!e && this.focussed) return this.prefetch();
    if (e && e.key && !e.shift){
      switch (e.key){
        case 'enter': case 'tab':
          if (this.element.value != this.opted) return true;
          if (this.selected && this.visible){
            this.choiceSelect(this.selected);
            this.fireEvent('choiceConfirm', this.selected);
            return !!(this.options.autoSubmit);
          }
          break;
        case 'up': case 'down':
          if (!this.prefetch() && this.queryValue !== null){
            var up = (e.key == 'up');
            this.choiceOver((this.selected || this.choices)[
              (this.selected) ? ((up) ? 'getPrevious' : 'getNext') : ((up) ? 'getLast' : 'getFirst')
            ](this.options.choicesMatch), true);
          }
          return false;
        case 'esc':
          this.hideChoices(true);
          break;
      }
    }
    return true;
  },

  setSelection: function(finish){
    var input = this.selected.inputValue, value = input;
    var start = this.queryValue.length, end = input.length;
    if (input.substr(0, start).toLowerCase() != this.queryValue.toLowerCase()) start = 0;
    if (this.options.multiple){
      var split = this.options.separatorSplit;
      value = this.element.value;
      start += this.queryIndex;
      end += this.queryIndex;
      var old = value.substr(this.queryIndex).split(split, 1)[0];
      value = value.substr(0, this.queryIndex) + input + value.substr(this.queryIndex + old.length);
      if (finish){
        var space = /[^\s,]+/;
        var tokens = value.split(this.options.separatorSplit).filter(space.test, space);
        if (!this.options.allowDupes) tokens = [].combine(tokens);
        var sep = this.options.separator;
        value = tokens.join(sep) + sep;
        end = value.length;
      }
    }
    this.observer.setValue(value);
    this.opted = value;
    if (finish || this.selectMode == 'pick') start = end;
    this.element.selectRange(start, end);
    this.fireEvent('onSelection', [this.element, this.selected, value, input]);
  },

  showChoices: function(){
    var match = this.options.choicesMatch, first = this.choices.getFirst(match);
    this.selected = this.selectedValue = null;
    if (!first) return;
    if (!this.visible){
      this.visible = true;
      this.choices.setStyle('display', '');
      if (this.fx) this.fx.start(1);
      this.fireEvent('onShow', [this.element, this.choices]);
    }
    if (this.options.selectFirst || this.typeAhead || first.inputValue == this.queryValue) this.choiceOver(first, this.typeAhead);
    var items = this.choices.getChildren(match), max = this.options.maxChoices;
    var styles = {'overflowY': 'hidden', 'height': ''};
    this.overflown = false;
    if (items.length > max){
      var item = items[max - 1];
      styles.overflowY = 'scroll';
      styles.height = item.getCoordinates(this.choices).bottom;
      this.overflown = true;
    };
    this.choices.setStyles(styles);
  },

  hideChoices: function(clear){
    if (clear){
      var value = this.element.value;
      if (this.options.forceSelect) value = this.opted;
      if (this.options.autoTrim){
        value = value.split(this.options.separatorSplit).filter(function(){ return arguments[0]; }).join(this.options.separator);
      }
      this.observer.setValue(value);
    }
    if (!this.visible) return;
    this.visible = false;
    this.observer.clear();
    var hide = function(){
      this.choices.setStyle('display', 'none');
    }.bind(this);
    if (this.fx) this.fx.start(0).chain(hide);
    else hide();
    this.fireEvent('onHide', [this.element, this.choices]);
  },

  prefetch: function(){
    var value = this.element.value, query = value;
    if (this.options.multiple){
      var split = this.options.separatorSplit;
      var values = value.split(split);
      var index = this.element.getCaretPosition();
      var toIndex = value.substr(0, index).split(split);
      var last = toIndex.length - 1;
      index -= toIndex[last].length;
      query = values[last];
    }
    if (query.length < this.options.minLength){
      this.hideChoices();
    } else {
      if (query === this.queryValue || (this.visible && query == this.selectedValue)){
        if (this.visible) return false;
        this.showChoices();
      } else {
        this.queryValue = query;
        this.queryIndex = index;
        if (!this.fetchCached()) this.query();
      }
    }
    return true;
  },

  fetchCached: function(){
    if (!this.options.cache
      || !this.cached
      || !this.cached.length
      || this.cached.length >= this.options.maxChoices
      || this.queryValue) return false;
    this.update(this.filter(this.cached));
    return true;
  },

  update: function(tokens){
    this.choices.empty();
    this.cached = tokens;
    if (!tokens || !tokens.length){
      this.hideChoices();
    } else {
      if (this.options.maxChoices < tokens.length && !this.options.overflow) tokens.length = this.options.maxChoices;
      tokens.each(this.options.injectChoice || function(token){
        var choice = new Element('li', {'html': this.markQueryValue(token)});
        choice.inputValue = token;
        this.addChoiceEvents(choice).inject(this.choices);
      }, this);
      this.showChoices();
    }
  },

  choiceOver: function(choice, selection){
    if (!choice || choice == this.selected) return;
    if (this.selected) this.selected.removeClass('autocompleter-selected');
    this.selected = choice.addClass('autocompleter-selected');
    this.fireEvent('onSelect', [this.element, this.selected, selection]);
    if (!selection) return;
    this.selectedValue = this.selected.inputValue;
    if (this.overflown){
      var coords = this.selected.getCoordinates(this.choices), margin = this.options.overflowMargin,
        top = this.choices.scrollTop, height = this.choices.offsetHeight, bottom = top + height;
      if (coords.top - margin < top && top) this.choices.scrollTop = Math.max(coords.top - margin, 0);
      else if (coords.bottom + margin > bottom) this.choices.scrollTop = Math.min(coords.bottom - height + margin, bottom);
    }
    if (this.selectMode) this.setSelection();
  },

  choiceSelect: function(choice){
    if (choice) this.choiceOver(choice);
    this.setSelection(true);
    this.queryValue = false;
    this.hideChoices();
  },

  filter: function(tokens){
    return (tokens || this.tokens).filter(function(token){
      return this.test(token);
    }, new RegExp(((this.options.filterSubset) ? '' : '^') + this.queryValue.escapeRegExp(), (this.options.filterCase) ? '' : 'i'));
  },

  /**
   * markQueryValue
   *
   * Marks the queried word in the given string with <span class="autocompleter-queried">*</span>
   * Call this i.e. from your custom parseChoices, same for addChoiceEvents
   *
   * @param    {String} Text
   * @return    {String} Text
   */
  markQueryValue: function(str){
    if (!this.options.markQuery || !this.queryValue) return str;
    var regex = new RegExp('(' + ((this.options.filterSubset) ? '' : '^') + this.queryValue.escapeRegExp() + ')', (this.options.filterCase) ? '' : 'i');
    return str.replace(regex, '<span class="autocompleter-queried">$1</span>');
  },

  /**
   * addChoiceEvents
   *
   * Appends the needed event handlers for a choice-entry to the given element.
   *
   * @param    {Element} Choice entry
   * @return    {Element} Choice entry
   */
  addChoiceEvents: function(el){
    return el.addEvents({
      'mouseover': this.choiceOver.bind(this, el),
      'click': function(){
        var result = this.choiceSelect(el);
        this.fireEvent('choiceConfirm', this.selected);
        return result;
      }.bind(this)
    });
  }
});

/*
---

name: Request.HTML

description: Extends the basic Request Class with additional methods for interacting with HTML responses.

license: MIT-style license.

requires: [Element, Request]

provides: Request.HTML

...
*/

Request.HTML = new Class({

	Extends: Request,

	options: {
		update: false,
		append: false,
		evalScripts: true,
		filter: false,
		headers: {
			Accept: 'text/html, application/xml, text/xml, */*'
		}
	},

	success: function(text){
		var options = this.options, response = this.response;

		response.html = text.stripScripts(function(script){
			response.javascript = script;
		});

		var match = response.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		if (match) response.html = match[1];
		var temp = new Element('div').set('html', response.html);

		response.tree = temp.childNodes;
		response.elements = temp.getElements(options.filter || '*');

		if (options.filter) response.tree = response.elements;
		if (options.update){
			var update = document.id(options.update).empty();
			if (options.filter) update.adopt(response.elements);
			else update.set('html', response.html);
		} else if (options.append){
			var append = document.id(options.append);
			if (options.filter) response.elements.reverse().inject(append);
			else append.adopt(temp.getChildren());
		}
		if (options.evalScripts) Browser.exec(response.javascript);

		this.onSuccess(response.tree, response.elements, response.html, response.javascript);
	}

});

Element.Properties.load = {

	set: function(options){
		var load = this.get('load').cancel();
		load.setOptions(options);
		return this;
	},

	get: function(){
		var load = this.retrieve('load');
		if (!load){
			load = new Request.HTML({data: this, link: 'cancel', update: this, method: 'get'});
			this.store('load', load);
		}
		return load;
	}

};

Element.implement({

	load: function(){
		this.get('load').send(Array.link(arguments, {data: Type.isObject, url: Type.isString}));
		return this;
	}

});

/*
---

name: Request.JSON

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires: [Request, JSON]

provides: Request.JSON

...
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		/*onError: function(text, error){},*/
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		Object.append(this.headers, {
			'Accept': 'application/json',
			'X-Request': 'JSON'
		});
	},

	success: function(text){
		var json;
		try {
			json = this.response.json = JSON.decode(text, this.options.secure);
		} catch (error){
			this.fireEvent('error', [text, error]);
			return;
		}
		if (json == null) this.onFailure();
		else this.onSuccess(json, text);
	}

});

/*
---
name: Autocompleter.Remote

version: 1.1.1

description: Autocompleter extensions that enable requests for JSON/XHTML data for input suggestions.

license: MIT-style license
author: Harald Kirschner <mail [at] digitarald.de>
copyright: Author

requires: [Autocompleter.Base, Core/Request.HTML, Core/Request.JSON]

provides: [Autocompleter.Remote, Autocompleter.Ajax, Autocompleter.Ajax.Base, Autocompleter.Ajax.Json, Autocompleter.Ajax.Xhtml]

...
 */

Autocompleter.Ajax = {};

Autocompleter.Ajax.Base = new Class({

  Extends: Autocompleter.Base,

  options: {
    // onRequest: function(){},
    // onComplete: function(){},
    postVar: 'value',
    postData: {},
    ajaxOptions: {}
  },

  initialize: function(element, options){
    this.parent(element, options);
    var indicator = document.id(this.options.indicator);
    if (indicator){
      this.addEvents({
        'onRequest': indicator.show.bind(indicator),
        'onComplete': indicator.hide.bind(indicator)
      }, true);
    }
  },

  query: function(){
    var data = Object.clone(this.options.postData);
    data[this.options.postVar] = this.queryValue;
    this.fireEvent('onRequest', [this.element, this.request, data, this.queryValue]);
    this.request.send({'data': data});
  },

  /**
   * queryResponse - abstract
   *
   * Inherated classes have to extend this function and use this.parent(resp)
   *
   * @param    {String} Response
   */
  queryResponse: function(){
    this.fireEvent('onComplete', [this.element, this.request, this.response]);
  }

});

Autocompleter.Ajax.Json = new Class({

  Extends: Autocompleter.Ajax.Base,

  initialize: function(el, url, options){
    this.parent(el, options);
    this.request = new Request.JSON(Object.merge({
      'url': url,
      'link': 'cancel'
    }, this.options.ajaxOptions)).addEvent('onComplete', this.queryResponse.bind(this));
  },

  queryResponse: function(response){
    this.parent();
    this.update(response);
  }

});

Autocompleter.Ajax.Xhtml = new Class({

  Extends: Autocompleter.Ajax.Base,

  initialize: function(el, url, options){
    this.parent(el, options);
    this.request = new Request.HTML(Object.merge({
      'url': url,
      'link': 'cancel',
      'update': this.choices
    }, this.options.ajaxOptions)).addEvent('onComplete', this.queryResponse.bind(this));
  },

  queryResponse: function(tree, elements){
    this.parent();
    if (!elements || !elements.length){
      this.hideChoices();
    } else {
      this.choices.getChildren(this.options.choicesMatch).each(this.options.injectChoice || function(choice){
        var value = choice.innerHTML;
        choice.inputValue = value;
        this.addChoiceEvents(choice.set('html', this.markQueryValue(value)));
      }, this);
      this.showChoices();
    }

  }

});

/*
---
name: Autocompleter.JSONP

description: Implements Request.JSONP support for the Autocompleter class.

license: MIT-Style License

requires: [More/Request.JSONP, Autocompleter.Remote]

provides: [Autocompleter.JSONP]
...
*/

Autocompleter.JSONP = new Class({

  Extends: Autocompleter.Ajax.Json,

  options: {
    postVar: 'query',
    jsonpOptions: {},
//    onRequest: function(){},
//    onComplete: function(){},
//    filterResponse: function(){},
    minLength: 1
  },

  initialize: function(el, url, options){
    this.url = url;
    this.setOptions(options);
    this.parent(el, options);
  },

  query: function(){
    var data = Object.clone(this.options.jsonpOptions.data||{});
    data[this.options.postVar] = this.queryValue;
    this.jsonp = new Request.JSONP(Object.merge({url: this.url, data: data},  this.options.jsonpOptions));
    this.jsonp.addEvent('onComplete', this.queryResponse.bind(this));
    this.fireEvent('onRequest', [this.element, this.jsonp, data, this.queryValue]);
    this.jsonp.send();
  },

  queryResponse: function(response){
    this.parent();
    var data = (this.options.filter)?this.options.filter.apply(this, [response]):response;
    this.update(data);
  }

});
Autocompleter.JsonP = Autocompleter.JSONP;
/*
---
name: Autocompleter.Local

description: Allows Autocompleter to use an object in memory for autocompletion (instead of retrieving via ajax).

version: 1.1.1

license: MIT-style license
author: Harald Kirschner <mail [at] digitarald.de>
copyright: Author

requires: [Autocompleter.Base]

provides: [Autocompleter.Local]
...
 */
Autocompleter.Local = new Class({

  Extends: Autocompleter.Base,

  options: {
    minLength: 0,
    delay: 200
  },

  initialize: function(element, tokens, options){
    this.parent(element, options);
    this.tokens = tokens;
  },

  query: function(){
    this.update(this.filter());
  }

});

/*
---
name: Behavior.Autocompleter
description: Adds support for Autocompletion on form inputs.
provides: [Behavior.Autocomplete, Behavior.Autocompleter]
requires: [Behavior/Behavior, /Autocompleter.Local, /Autocompleter.Remote, More/Object.Extras]
script: Behavior.Autocomplete.js

...
*/

Behavior.addGlobalFilters({

  /*
    takes elements (inputs) with the data filter "Autocomplete" and creates a autocompletion ui for them
    that either completes against a list of terms supplied as a property of the element (dtaa-autocomplete-tokens)
    or fetches them from a server. In both cases, the tokens must be an array of values. Example:

    <input data-behavior="Autocomplete" data-autocomplete-tokens="['foo', 'bar', 'baz']"/>

    Alternately, you can specify a url to submit the current typed token to get back a list of valid values in the
    same format (i.e. a JSON response; an array of strings). Example:

    <input data-behavior="Autocomplete" data-autocomplete-url="/some/API/for/autocomplete"/>

    When the values ar fetched from the server, the server is sent the current term (what the user is typing) as
    a post variable "term" as well as the entire contents of the input as "value".

    An additional data property for autocomplete-options can be specified; this must be a JSON encoded string
    of key/value pairs that configure the Autocompleter instance (see documentation for the Autocompleter classes
    online at http://www.clientcide.com/docs/3rdParty/Autocompleter but also available as a markdown file in the
    clientcide repo fetched by hue in the thirdparty directory).

    Note that this JSON string can't include functions as callbacks; if you require amore advanced usage you should
    write your own Behavior filter or filter plugin.

  */

  Autocomplete: {
    defaults: {
      minLength: 1,
      selectMode: 'type-ahead',
      overflow: true,
      selectFirst: true,
      multiple: true,
      separator: ' ',
      allowDupes: true,
      postVar: 'term'
    },
    returns: Autocompleter.Base,
    setup: function(element, api){
      var options = Object.cleanValues(
        api.getAs({
          minLength: Number,
          selectMode: String,
          overflow: Boolean,
          selectFirst: Boolean,
          multiple: Boolean,
          separator: String,
          allowDupes: Boolean,
          postVar: String
        })
      );

      if (element.getData('autocomplete-url')){
        var aaj = new Autocompleter.Ajax.Json(element, element.getData('autocomplete-url'), options);
        aaj.addEvent('request', function(el, req, data, value){
          data['value'] = el.get('value');
        });
        return aaj;
      } else {
        var tokens = api.getAs(Array, 'tokens');
        if (!tokens){
          dbug.warn('Could not set up autocompleter; no local tokens found.');
          return;
        }
        return new Autocompleter.Local(element, tokens, options);
      }
    }
  }

});

/*
---

script: Class.Binds.js

name: Class.Binds

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
	if (!this.prototype.initialize) this.implement('initialize', function(){});
	return Array.from(binds).concat(this.prototype.Binds || []);
};

Class.Mutators.initialize = function(initialize){
	return function(){
		Array.from(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};

/*
---

script: Class.Occlude.js

name: Class.Occlude

description: Prevents a class from being applied to a DOM element twice.

license: MIT-style license.

authors:
  - Aaron Newton

requires:
  - Core/Class
  - Core/Element
  - MooTools.More

provides: [Class.Occlude]

...
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !this.occluded)
			return (this.occluded = instance);

		this.occluded = false;
		element.store(property || this.property, this);
		return this.occluded;
	}

});

/*
---

script: Class.Refactor.js

name: Class.Refactor

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - MooTools.More

# Some modules declare themselves dependent on Class.Refactor
provides: [Class.refactor, Class.Refactor]

...
*/

Class.refactor = function(original, refactors){

	Object.each(refactors, function(item, name){
		var origin = original.prototype[name];
		origin = (origin && origin.$origin) || origin || function(){};
		original.implement(name, (typeof item == 'function') ? function(){
			var old = this.previous;
			this.previous = origin;
			var value = item.apply(this, arguments);
			this.previous = old;
			return value;
		} : item);
	});

	return original;

};

/*
---

script: IframeShim.js

name: IframeShim

description: Defines IframeShim, a class for obscuring select lists and flash objects in IE.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Event
  - Core/Element.Style
  - Core/Options
  - Core/Events
  - Element.Position
  - Class.Occlude

provides: [IframeShim]

...
*/

(function(){

var browsers = false;
//<1.4compat>
browsers = Browser.ie6 || (Browser.firefox && Browser.version < 3 && Browser.Platform.mac);
//</1.4compat>

this.IframeShim = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		className: 'iframeShim',
		src: 'javascript:false;document.write("");',
		display: false,
		zIndex: null,
		margin: 0,
		offset: {x: 0, y: 0},
		browsers: browsers
	},

	property: 'IframeShim',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.makeShim();
		return this;
	},

	makeShim: function(){
		if (this.options.browsers){
			var zIndex = this.element.getStyle('zIndex').toInt();

			if (!zIndex){
				zIndex = 1;
				var pos = this.element.getStyle('position');
				if (pos == 'static' || !pos) this.element.setStyle('position', 'relative');
				this.element.setStyle('zIndex', zIndex);
			}
			zIndex = ((this.options.zIndex != null || this.options.zIndex === 0) && zIndex > this.options.zIndex) ? this.options.zIndex : zIndex - 1;
			if (zIndex < 0) zIndex = 1;
			this.shim = new Element('iframe', {
				src: this.options.src,
				scrolling: 'no',
				frameborder: 0,
				styles: {
					zIndex: zIndex,
					position: 'absolute',
					border: 'none',
					filter: 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)'
				},
				'class': this.options.className
			}).store('IframeShim', this);
			var inject = (function(){
				this.shim.inject(this.element, 'after');
				this[this.options.display ? 'show' : 'hide']();
				this.fireEvent('inject');
			}).bind(this);
			if (!IframeShim.ready) window.addEvent('load', inject);
			else inject();
		} else {
			this.position = this.hide = this.show = this.dispose = Function.from(this);
		}
	},

	position: function(){
		if (!IframeShim.ready || !this.shim) return this;
		var size = this.element.measure(function(){
			return this.getSize();
		});
		if (this.options.margin != undefined){
			size.x = size.x - (this.options.margin * 2);
			size.y = size.y - (this.options.margin * 2);
			this.options.offset.x += this.options.margin;
			this.options.offset.y += this.options.margin;
		}
		this.shim.set({width: size.x, height: size.y}).position({
			relativeTo: this.element,
			offset: this.options.offset
		});
		return this;
	},

	hide: function(){
		if (this.shim) this.shim.setStyle('display', 'none');
		return this;
	},

	show: function(){
		if (this.shim) this.shim.setStyle('display', 'block');
		return this.position();
	},

	dispose: function(){
		if (this.shim) this.shim.dispose();
		return this;
	},

	destroy: function(){
		if (this.shim) this.shim.destroy();
		return this;
	}

});

})();

window.addEvent('load', function(){
	IframeShim.ready = true;
});

/*
---

script: Mask.js

name: Mask

description: Creates a mask element to cover another.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Event
  - Class.Binds
  - Element.Position
  - IframeShim

provides: [Mask]

...
*/

var Mask = new Class({

	Implements: [Options, Events],

	Binds: ['position'],

	options: {/*
		onShow: function(){},
		onHide: function(){},
		onDestroy: function(){},
		onClick: function(event){},
		inject: {
			where: 'after',
			target: null,
		},
		hideOnClick: false,
		id: null,
		destroyOnHide: false,*/
		style: {},
		'class': 'mask',
		maskMargins: false,
		useIframeShim: true,
		iframeShimOptions: {}
	},

	initialize: function(target, options){
		this.target = document.id(target) || document.id(document.body);
		this.target.store('mask', this);
		this.setOptions(options);
		this.render();
		this.inject();
	},

	render: function(){
		this.element = new Element('div', {
			'class': this.options['class'],
			id: this.options.id || 'mask-' + String.uniqueID(),
			styles: Object.merge({}, this.options.style, {
				display: 'none'
			}),
			events: {
				click: function(event){
					this.fireEvent('click', event);
					if (this.options.hideOnClick) this.hide();
				}.bind(this)
			}
		});

		this.hidden = true;
	},

	toElement: function(){
		return this.element;
	},

	inject: function(target, where){
		where = where || (this.options.inject ? this.options.inject.where : '') || (this.target == document.body ? 'inside' : 'after');
		target = target || (this.options.inject && this.options.inject.target) || this.target;

		this.element.inject(target, where);

		if (this.options.useIframeShim){
			this.shim = new IframeShim(this.element, this.options.iframeShimOptions);

			this.addEvents({
				show: this.shim.show.bind(this.shim),
				hide: this.shim.hide.bind(this.shim),
				destroy: this.shim.destroy.bind(this.shim)
			});
		}
	},

	position: function(){
		this.resize(this.options.width, this.options.height);

		this.element.position({
			relativeTo: this.target,
			position: 'topLeft',
			ignoreMargins: !this.options.maskMargins,
			ignoreScroll: this.target == document.body
		});

		return this;
	},

	resize: function(x, y){
		var opt = {
			styles: ['padding', 'border']
		};
		if (this.options.maskMargins) opt.styles.push('margin');

		var dim = this.target.getComputedSize(opt);
		if (this.target == document.body){
			this.element.setStyles({width: 0, height: 0});
			var win = window.getScrollSize();
			if (dim.totalHeight < win.y) dim.totalHeight = win.y;
			if (dim.totalWidth < win.x) dim.totalWidth = win.x;
		}
		this.element.setStyles({
			width: Array.pick([x, dim.totalWidth, dim.x]),
			height: Array.pick([y, dim.totalHeight, dim.y])
		});

		return this;
	},

	show: function(){
		if (!this.hidden) return this;

		window.addEvent('resize', this.position);
		this.position();
		this.showMask.apply(this, arguments);

		return this;
	},

	showMask: function(){
		this.element.setStyle('display', 'block');
		this.hidden = false;
		this.fireEvent('show');
	},

	hide: function(){
		if (this.hidden) return this;

		window.removeEvent('resize', this.position);
		this.hideMask.apply(this, arguments);
		if (this.options.destroyOnHide) return this.destroy();

		return this;
	},

	hideMask: function(){
		this.element.setStyle('display', 'none');
		this.hidden = true;
		this.fireEvent('hide');
	},

	toggle: function(){
		this[this.hidden ? 'show' : 'hide']();
	},

	destroy: function(){
		this.hide();
		this.element.destroy();
		this.fireEvent('destroy');
		this.target.eliminate('mask');
	}

});

Element.Properties.mask = {

	set: function(options){
		var mask = this.retrieve('mask');
		if (mask) mask.destroy();
		return this.eliminate('mask').store('mask:options', options);
	},

	get: function(){
		var mask = this.retrieve('mask');
		if (!mask){
			mask = new Mask(this, this.retrieve('mask:options'));
			this.store('mask', mask);
		}
		return mask;
	}

};

Element.implement({

	mask: function(options){
		if (options) this.set('mask', options);
		this.get('mask').show();
		return this;
	},

	unmask: function(){
		this.get('mask').hide();
		return this;
	}

});

/*
---

script: Spinner.js

name: Spinner

description: Adds a semi-transparent overlay over a dom element with a spinnin ajax icon.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Fx.Tween
  - Core/Request
  - Class.refactor
  - Mask

provides: [Spinner]

...
*/

var Spinner = new Class({

	Extends: Mask,

	Implements: Chain,

	options: {/*
		message: false,*/
		'class': 'spinner',
		containerPosition: {},
		content: {
			'class': 'spinner-content'
		},
		messageContainer: {
			'class': 'spinner-msg'
		},
		img: {
			'class': 'spinner-img'
		},
		fxOptions: {
			link: 'chain'
		}
	},

	initialize: function(target, options){
		this.target = document.id(target) || document.id(document.body);
		this.target.store('spinner', this);
		this.setOptions(options);
		this.render();
		this.inject();

		// Add this to events for when noFx is true; parent methods handle hide/show.
		var deactivate = function(){ this.active = false; }.bind(this);
		this.addEvents({
			hide: deactivate,
			show: deactivate
		});
	},

	render: function(){
		this.parent();

		this.element.set('id', this.options.id || 'spinner-' + String.uniqueID());

		this.content = document.id(this.options.content) || new Element('div', this.options.content);
		this.content.inject(this.element);

		if (this.options.message){
			this.msg = document.id(this.options.message) || new Element('p', this.options.messageContainer).appendText(this.options.message);
			this.msg.inject(this.content);
		}

		if (this.options.img){
			this.img = document.id(this.options.img) || new Element('div', this.options.img);
			this.img.inject(this.content);
		}

		this.element.set('tween', this.options.fxOptions);
	},

	show: function(noFx){
		if (this.active) return this.chain(this.show.bind(this));
		if (!this.hidden){
			this.callChain.delay(20, this);
			return this;
		}

		this.target.set('aria-busy', 'true');
		this.active = true;

		return this.parent(noFx);
	},

	showMask: function(noFx){
		var pos = function(){
			this.content.position(Object.merge({
				relativeTo: this.element
			}, this.options.containerPosition));
		}.bind(this);

		if (noFx){
			this.parent();
			pos();
		} else {
			if (!this.options.style.opacity) this.options.style.opacity = this.element.getStyle('opacity').toFloat();
			this.element.setStyles({
				display: 'block',
				opacity: 0
			}).tween('opacity', this.options.style.opacity);
			pos();
			this.hidden = false;
			this.fireEvent('show');
			this.callChain();
		}
	},

	hide: function(noFx){
		if (this.active) return this.chain(this.hide.bind(this));
		if (this.hidden){
			this.callChain.delay(20, this);
			return this;
		}

		this.target.set('aria-busy', 'false');
		this.active = true;

		return this.parent(noFx);
	},

	hideMask: function(noFx){
		if (noFx) return this.parent();
		this.element.tween('opacity', 0).get('tween').chain(function(){
			this.element.setStyle('display', 'none');
			this.hidden = true;
			this.fireEvent('hide');
			this.callChain();
		}.bind(this));
	},

	destroy: function(){
		this.content.destroy();
		this.parent();
		this.target.eliminate('spinner');
	}

});

Request = Class.refactor(Request, {

	options: {
		useSpinner: false,
		spinnerOptions: {},
		spinnerTarget: false
	},

	initialize: function(options){
		this._send = this.send;
		this.send = function(options){
			var spinner = this.getSpinner();
			if (spinner) spinner.chain(this._send.pass(options, this)).show();
			else this._send(options);
			return this;
		};
		this.previous(options);
	},

	getSpinner: function(){
		if (!this.spinner){
			var update = document.id(this.options.spinnerTarget) || document.id(this.options.update);
			if (this.options.useSpinner && update){
				update.set('spinner', this.options.spinnerOptions);
				var spinner = this.spinner = update.get('spinner');
				['complete', 'exception', 'cancel'].each(function(event){
					this.addEvent(event, spinner.hide.bind(spinner));
				}, this);
			}
		}
		return this.spinner;
	}

});

Element.Properties.spinner = {

	set: function(options){
		var spinner = this.retrieve('spinner');
		if (spinner) spinner.destroy();
		return this.eliminate('spinner').store('spinner:options', options);
	},

	get: function(){
		var spinner = this.retrieve('spinner');
		if (!spinner){
			spinner = new Spinner(this, this.retrieve('spinner:options'));
			this.store('spinner', spinner);
		}
		return spinner;
	}

};

Element.implement({

	spin: function(options){
		if (options) this.set('spinner', options);
		this.get('spinner').show();
		return this;
	},

	unspin: function(){
		this.get('spinner').hide();
		return this;
	}

});

/*
---

script: String.QueryString.js

name: String.QueryString

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
  - Sebastian Markbåge
  - Aaron Newton
  - Lennart Pilon
  - Valerio Proietti

requires:
  - Core/Array
  - Core/String
  - MooTools.More

provides: [String.QueryString]

...
*/

String.implement({

	parseQueryString: function(decodeKeys, decodeValues){
		if (decodeKeys == null) decodeKeys = true;
		if (decodeValues == null) decodeValues = true;

		var vars = this.split(/[&;]/),
			object = {};
		if (!vars.length) return object;

		vars.each(function(val){
			var index = val.indexOf('=') + 1,
				value = index ? val.substr(index) : '',
				keys = index ? val.substr(0, index - 1).match(/([^\]\[]+|(\B)(?=\]))/g) : [val],
				obj = object;
			if (!keys) return;
			if (decodeValues) value = decodeURIComponent(value);
			keys.each(function(key, i){
				if (decodeKeys) key = decodeURIComponent(key);
				var current = obj[key];

				if (i < keys.length - 1) obj = obj[key] = current || {};
				else if (typeOf(current) == 'array') current.push(value);
				else obj[key] = current != null ? [current, value] : value;
			});
		});

		return object;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(function(val){
			var index = val.indexOf('='),
				key = index < 0 ? '' : val.substr(0, index),
				value = val.substr(index + 1);

			return method ? method.call(null, key, value) : (value || value === 0);
		}).join('&');
	}

});

/*
---

name: Element.Delegation

description: Extends the Element native object to include the delegate method for more efficient event management.

license: MIT-style license.

requires: [Element.Event]

provides: [Element.Delegation]

...
*/

(function(){

var eventListenerSupport = !!window.addEventListener;

Element.NativeEvents.focusin = Element.NativeEvents.focusout = 2;

var bubbleUp = function(self, match, fn, event, target){
	while (target && target != self){
		if (match(target, event)) return fn.call(target, event, target);
		target = document.id(target.parentNode);
	}
};

var map = {
	mouseenter: {
		base: 'mouseover',
		condition: Element.MouseenterCheck
	},
	mouseleave: {
		base: 'mouseout',
		condition: Element.MouseenterCheck
	},
	focus: {
		base: 'focus' + (eventListenerSupport ? '' : 'in'),
		capture: true
	},
	blur: {
		base: eventListenerSupport ? 'blur' : 'focusout',
		capture: true
	}
};

/*<ltIE9>*/
var _key = '$delegation:';
var formObserver = function(type){

	return {

		base: 'focusin',

		remove: function(self, uid){
			var list = self.retrieve(_key + type + 'listeners', {})[uid];
			if (list && list.forms) for (var i = list.forms.length; i--;){
				list.forms[i].removeEvent(type, list.fns[i]);
			}
		},

		listen: function(self, match, fn, event, target, uid){
			var form = (target.get('tag') == 'form') ? target : event.target.getParent('form');
			if (!form) return;

			var listeners = self.retrieve(_key + type + 'listeners', {}),
				listener = listeners[uid] || {forms: [], fns: []},
				forms = listener.forms, fns = listener.fns;

			if (forms.indexOf(form) != -1) return;
			forms.push(form);

			var _fn = function(event){
				bubbleUp(self, match, fn, event, target);
			};
			form.addEvent(type, _fn);
			fns.push(_fn);

			listeners[uid] = listener;
			self.store(_key + type + 'listeners', listeners);
		}
	};
};

var inputObserver = function(type){
	return {
		base: 'focusin',
		listen: function(self, match, fn, event, target){
			var events = {blur: function(){
				this.removeEvents(events);
			}};
			events[type] = function(event){
				bubbleUp(self, match, fn, event, target);
			};
			event.target.addEvents(events);
		}
	};
};

if (!eventListenerSupport) Object.append(map, {
	submit: formObserver('submit'),
	reset: formObserver('reset'),
	change: inputObserver('change'),
	select: inputObserver('select')
});
/*</ltIE9>*/

var proto = Element.prototype,
	addEvent = proto.addEvent,
	removeEvent = proto.removeEvent;

var relay = function(old, method){
	return function(type, fn, useCapture){
		if (type.indexOf(':relay') == -1) return old.call(this, type, fn, useCapture);
		var parsed = Slick.parse(type).expressions[0][0];
		if (parsed.pseudos[0].key != 'relay') return old.call(this, type, fn, useCapture);
		var newType = parsed.tag;
		parsed.pseudos.slice(1).each(function(pseudo){
			newType += ':' + pseudo.key + (pseudo.value ? '(' + pseudo.value + ')' : '');
		});
		old.call(this, type, fn);
		return method.call(this, newType, parsed.pseudos[0].value, fn);
	};
};

var delegation = {

	addEvent: function(type, match, fn){
		var storage = this.retrieve('$delegates', {}), stored = storage[type];
		if (stored) for (var _uid in stored){
			if (stored[_uid].fn == fn && stored[_uid].match == match) return this;
		}

		var _type = type, _match = match, _fn = fn, _map = map[type] || {};
		type = _map.base || _type;

		match = function(target){
			return Slick.match(target, _match);
		};

		var elementEvent = Element.Events[_type];
		if (_map.condition || elementEvent && elementEvent.condition){
			var __match = match, condition = _map.condition || elementEvent.condition;
			match = function(target, event){
				return __match(target, event) && condition.call(target, event, type);
			};
		}

		var self = this, uid = String.uniqueID();
		var delegator = _map.listen ? function(event, target){
			if (!target && event && event.target) target = event.target;
			if (target) _map.listen(self, match, fn, event, target, uid);
		} : function(event, target){
			if (!target && event && event.target) target = event.target;
			if (target) bubbleUp(self, match, fn, event, target);
		};

		if (!stored) stored = {};
		stored[uid] = {
			match: _match,
			fn: _fn,
			delegator: delegator
		};
		storage[_type] = stored;
		return addEvent.call(this, type, delegator, _map.capture);
	},

	removeEvent: function(type, match, fn, _uid){
		var storage = this.retrieve('$delegates', {}), stored = storage[type];
		if (!stored) return this;

		if (_uid){
			var _type = type, delegator = stored[_uid].delegator, _map = map[type] || {};
			type = _map.base || _type;
			if (_map.remove) _map.remove(this, _uid);
			delete stored[_uid];
			storage[_type] = stored;
			return removeEvent.call(this, type, delegator, _map.capture);
		}

		var __uid, s;
		if (fn) for (__uid in stored){
			s = stored[__uid];
			if (s.match == match && s.fn == fn) return delegation.removeEvent.call(this, type, match, fn, __uid);
		} else for (__uid in stored){
			s = stored[__uid];
			if (s.match == match) delegation.removeEvent.call(this, type, match, s.fn, __uid);
		}
		return this;
	}

};

[Element, Window, Document].invoke('implement', {
	addEvent: relay(addEvent, delegation.addEvent),
	removeEvent: relay(removeEvent, delegation.removeEvent)
});

})();

/*
---

name: Element.Event.Pseudos

description: Adds the functionality to add pseudo events for Elements

license: MIT-style license

authors:
  - Arian Stolwijk

requires: [Core/Element.Event, Core/Element.Delegation, Events.Pseudos]

provides: [Element.Event.Pseudos, Element.Delegation.Pseudo]

...
*/

(function(){

var pseudos = {relay: false},
	copyFromEvents = ['once', 'throttle', 'pause'],
	count = copyFromEvents.length;

while (count--) pseudos[copyFromEvents[count]] = Events.lookupPseudo(copyFromEvents[count]);

DOMEvent.definePseudo = function(key, listener){
	pseudos[key] = listener;
	return this;
};

var proto = Element.prototype;
[Element, Window, Document].invoke('implement', Events.Pseudos(pseudos, proto.addEvent, proto.removeEvent));

})();

/*
---

script: Form.Request.js

name: Form.Request

description: Handles the basic functionality of submitting a form and updating a dom element with the result.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Request.HTML
  - Class.Binds
  - Class.Occlude
  - Spinner
  - String.QueryString
  - Element.Delegation.Pseudo

provides: [Form.Request]

...
*/

if (!window.Form) window.Form = {};

(function(){

	Form.Request = new Class({

		Binds: ['onSubmit', 'onFormValidate'],

		Implements: [Options, Events, Class.Occlude],

		options: {/*
			onFailure: function(){},
			onSuccess: function(){}, // aliased to onComplete,
			onSend: function(){}*/
			requestOptions: {
				evalScripts: true,
				useSpinner: true,
				emulation: false,
				link: 'ignore'
			},
			sendButtonClicked: true,
			extraData: {},
			resetForm: true
		},

		property: 'form.request',

		initialize: function(form, target, options){
			this.element = document.id(form);
			if (this.occlude()) return this.occluded;
			this.setOptions(options)
				.setTarget(target)
				.attach();
		},

		setTarget: function(target){
			this.target = document.id(target);
			if (!this.request){
				this.makeRequest();
			} else {
				this.request.setOptions({
					update: this.target
				});
			}
			return this;
		},

		toElement: function(){
			return this.element;
		},

		makeRequest: function(){
			var self = this;
			this.request = new Request.HTML(Object.merge({
					update: this.target,
					emulation: false,
					spinnerTarget: this.element,
					method: this.element.get('method') || 'post'
			}, this.options.requestOptions)).addEvents({
				success: function(tree, elements, html, javascript){
					['complete', 'success'].each(function(evt){
						self.fireEvent(evt, [self.target, tree, elements, html, javascript]);
					});
				},
				failure: function(){
					self.fireEvent('complete', arguments).fireEvent('failure', arguments);
				},
				exception: function(){
					self.fireEvent('failure', arguments);
				}
			});
			return this.attachReset();
		},

		attachReset: function(){
			if (!this.options.resetForm) return this;
			this.request.addEvent('success', function(){
				Function.attempt(function(){
					this.element.reset();
				}.bind(this));
				if (window.OverText) OverText.update();
			}.bind(this));
			return this;
		},

		attach: function(attach){
			var method = (attach != false) ? 'addEvent' : 'removeEvent';
			this.element[method]('click:relay(button, input[type=submit])', this.saveClickedButton.bind(this));

			var fv = this.element.retrieve('validator');
			if (fv) fv[method]('onFormValidate', this.onFormValidate);
			else this.element[method]('submit', this.onSubmit);

			return this;
		},

		detach: function(){
			return this.attach(false);
		},

		//public method
		enable: function(){
			return this.attach();
		},

		//public method
		disable: function(){
			return this.detach();
		},

		onFormValidate: function(valid, form, event){
			//if there's no event, then this wasn't a submit event
			if (!event) return;
			var fv = this.element.retrieve('validator');
			if (valid || (fv && !fv.options.stopOnFailure)){
				event.stop();
				this.send();
			}
		},

		onSubmit: function(event){
			var fv = this.element.retrieve('validator');
			if (fv){
				//form validator was created after Form.Request
				this.element.removeEvent('submit', this.onSubmit);
				fv.addEvent('onFormValidate', this.onFormValidate);
				fv.validate(event);
				return;
			}
			if (event) event.stop();
			this.send();
		},

		saveClickedButton: function(event, target){
			var targetName = target.get('name');
			if (!targetName || !this.options.sendButtonClicked) return;
			this.options.extraData[targetName] = target.get('value') || true;
			this.clickedCleaner = function(){
				delete this.options.extraData[targetName];
				this.clickedCleaner = function(){};
			}.bind(this);
		},

		clickedCleaner: function(){},

		send: function(){
			var str = this.element.toQueryString().trim(),
				data = Object.toQueryString(this.options.extraData);

			if (str) str += "&" + data;
			else str = data;

			this.fireEvent('send', [this.element, str.parseQueryString()]);
			this.request.send({
				data: str,
				url: this.options.requestOptions.url || this.element.get('action')
			});
			this.clickedCleaner();
			return this;
		}

	});

	Element.implement('formUpdate', function(update, options){
		var fq = this.retrieve('form.request');
		if (!fq){
			fq = new Form.Request(this, update, options);
		} else {
			if (update) fq.setTarget(update);
			if (options) fq.setOptions(options).makeRequest();
		}
		fq.send();
		return this;
	});

})();

/*
---

name: Behavior.config

description: Generic config file for pages that use behavior and delegator for their js invocation

requires:
 - Core/Request.HTML
 - More/Form.Request

provides: [Behavior.config]

...
*/


Request.HTML.implement({
  options: {
    evalScripts: false
  }
});

Form.Request.implement({
  options: {
    requestOptions: {
      evalScripts: false
    }
  }
});
/*
---
name: Event.Mock
description: Supplies a Mock Event object for use on fireEvent
license: MIT-style
authors:
 - Arieh Glazer
requires: [Core/Event]
provides: [Event.Mock]
...
*/

(function(window){
window.Event = window.Event || window.DOMEvent; //for 1.4 nocompat

/**
 * creates a Mock event to be used with fire event
 * @param Element target an element to set as the target of the event - not required
 *  @param string type the type of the event to be fired. Will not be used by IE - not required.
 *
 */
Event.Mock = function(target,type){
	type = type || 'click';

	var e = {
		type: type,
		target: target
	};

	if (document.createEvent){
		e = document.createEvent('HTMLEvents');
		e.initEvent(
			type //event type
			, false //bubbles - set to false because the event should like normal fireEvent
			, true //cancelable
		);
	}

	e = new Event(e);

	e.target = target;

	return e;
};

})(window);

/*
---
name: Delegator
description: Allows for the registration of delegated events on a container.
requires: [Core/Element.Delegation, Core/Options, Core/Events, /Event.Mock, /Behavior]
provides: [Delegator, Delegator.verifyTargets]
...
*/
(function(){

	var spaceOrCommaRegex = /\s*,\s*|\s+/g;

	var checkEvent = function(trigger, element, event){
		if (!event) return true;
		return trigger.types.some(function(type){
			var elementEvent = Element.Events[type];
			if (elementEvent && elementEvent.condition){
				return elementEvent.condition.call(element, event, type);
			} else {
				var eventType = elementEvent && elementEvent.base ? elementEvent.base : event.type;
				return eventType == type;
			}
		});
	};

	window.Delegator = new Class({

		Implements: [Options, Events, Behavior.PassMethods, Behavior.GetAPI],

		options: {
			// breakOnErrors: false,
			// onTrigger: function(trigger, element, event, result){},
			getBehavior: function(){},
			onLog: Behavior.getLog('info'),
			onError: Behavior.getLog('error'),
			onWarn: Behavior.getLog('warn')
		},

		initialize: function(options){
			this.setOptions(options);
			this._bound = {
				eventHandler: this._eventHandler.bind(this)
			};
			Delegator._instances.push(this);
			Object.each(Delegator._triggers, function(trigger){
				this._eventTypes.combine(trigger.types);
			}, this);
			this.API = new Class({ Extends: BehaviorAPI });
			this.passMethods({
				addEvent: this.addEvent.bind(this),
				removeEvent: this.removeEvent.bind(this),
				addEvents: this.addEvents.bind(this),
				removeEvents: this.removeEvents.bind(this),
				fireEvent: this.fireEvent.bind(this),
				attach: this.attach.bind(this),
				trigger: this.trigger.bind(this),
				error: function(){ this.fireEvent('error', arguments); }.bind(this),
				fail: function(){
					var msg = Array.join(arguments, ' ');
					throw new Error(msg);
				},
				warn: function(){
					this.fireEvent('warn', arguments);
				}.bind(this),
				getBehavior: function(){
					return this.options.getBehavior();
				}.bind(this),
				getDelegator: Function.from(this)
			});

			this.bindToBehavior(this.options.getBehavior());
		},

		/*
			given an instance of Behavior, binds this delegator instance
			to the behavior instance.
		*/
		bindToBehavior: function(behavior){
			if (!behavior) return;
			this.unbindFromBehavior();
			this._behavior = behavior;
			if (this._behavior.options.verbose) this.options.verbose = true;
			if (!this._behaviorEvents){
				var self = this;
				this._behaviorEvents = {
					destroyDom: function(elements){
						self._behavior.fireEvent('destroyDom', elements);
					},
					ammendDom: function(container){
						self._behavior.fireEvent('ammendDom', container);
					},
					updateHistory: function(url){
						self._behavior.fireEvent('updateHistory', url);
					}
				};
			}
			this.addEvents(this._behaviorEvents);
		},

		getBehavior: function(){
			return this._behavior;
		},

		unbindFromBehavior: function(){
			if (this._behaviorEvents && this._behavior){
				this._behavior.removeEvents(this._behaviorEvents);
				delete this._behavior;
			}
		},

		/*
			attaches this instance to a specified DOM element to
			monitor events to it and its children
		*/
		attach: function(target, _method){
			_method = _method || 'addEvent';
			target = document.id(target);
			if ((_method == 'addEvent' && this._attachedTo.contains(target)) ||
					(_method == 'removeEvent') && !this._attachedTo.contains(target)) return this;
			// iterate over all the event types for registered filters and attach listener for each
			this._eventTypes.each(function(event){
				target[_method](event + ':relay([data-trigger])', this._bound.eventHandler);
			}, this);
			if (_method == 'addEvent') this._attachedTo.push(target);
			else this._attachedTo.erase(target);
			return this;
		},


		/*
			detaches this instance of delegator from the target
		*/
		detach: function(target){
			if (target) this.attach(target, 'removeEvent');
			else this._attachedTo.each(this.detach, this);
			return this;
		},

		fireEventForElement: function(element, eventType, force){
			var e = new Event.Mock(element, eventType);
			element.getTriggers().each(function(triggerName){
			  var trigger = this.getTrigger(triggerName);
			  if (force || trigger.types.contains(eventType)){
			    this.trigger(triggerName, element, e);
			  }
			}, this);
			element.fireEvent(eventType, [e]);
		},

		/*
			invokes a specific trigger upon an element
		*/
		trigger: function(name, element, event, ignoreTypes, _api){
			var e = event;
			// if the event is a string, create an mock event object
			if (!e || typeOf(e) == "string") e = new Event.Mock(element, e);
			if (this.options.verbose) this.fireEvent('log', ['Applying trigger: ', name, element, event]);

			// if the trigger is of the special types handled by delegator itself,
			// run those and remove them from the list of triggers
			switch(name){
				case 'Stop':
					event.stop();
					return;
				case 'PreventDefault':
					event.preventDefault();
					return;
				case 'multi':
					this._handleMultiple(element, event);
					return;
				case 'any':
					this._runSwitch('any', element, event);
					return;
				case 'first':
					this._runSwitch('first', element, event, 'some');
					return;
				default:
					var result,
							trigger = this.getTrigger(name);
					// warn if the trigger isn't found and exit quietly
					if (!trigger){
						this.fireEvent('warn', 'Could not find a trigger by the name of ' + name);
					// check that the event type matches the types registered for the filter unless specifically ignoring types
					} else if (ignoreTypes || checkEvent(trigger, element, e)) {
						// invoke the trigger
						if (this.options.breakOnErrors){
							result = this._trigger(trigger, element, e, _api);
						} else {
							try {
								result = this._trigger(trigger, element, e, _api);
							} catch(error) {
								this.fireEvent('error', ['Could not apply the trigger', name, error.message]);
							}
						}
					}
					// log the event
					if (this.options.verbose && result) this.fireEvent('log', ['Successfully applied trigger: ', name, element, event]);
					else if (this.options.verbose) this.fireEvent('log', ['Trigger applied, but did not return a result: ', name, element, event]);
					// return the result of the trigger
					return result;
			}
		},

		// returns the trigger object for a given trigger name
		getTrigger: function(triggerName){
			return this._triggers[triggerName] || Delegator._triggers[triggerName];
		},

		// adds additional event types for a given trigger
		addEventTypes: function(triggerName, types){
			this.getTrigger(triggerName).types.combine(Array.from(types));
			return this;
		},

		/******************
		 * PRIVATE METHODS
		 ******************/

		/*
			invokes a trigger for a specified element
		*/
		_trigger: function(trigger, element, event, _api){
			// create an instance of the API if one not already passed in; atypical to specify one,
			// really only used for the multi trigger functionality to set defaults
			var api = _api || this._getAPI(element, trigger);

			// if we're debugging, stop
			if (Delegator.debugging && Delegator.debugging.contains(name)) debugger;

			// set defaults, check requirements
			if (trigger.defaults) api.setDefault(trigger.defaults);
			if (trigger.requireAs) api.requireAs(trigger.requireAs);
			if (trigger.require) api.require.apply(api, Array.from(trigger.require));

			// if the element is specified, check conditionals
			if (element && !this._checkConditionals(element, api)) return;

			// invoke the trigger, return result
			var result = trigger.handler.apply(this, [event, element, api]);
			this.fireEvent('trigger', [trigger, element, event, result]);
			return result;
		},

		/*
			checks the conditionals on a trigger. Example:

			// invoke the foo trigger if this link has the class "foo"
			// in this example, it will not
			<a data-trigger="foo" data-foo-options="
				'if': {
					'self::hasClass': ['foo']
				}
			">...</a>

			// inverse of above; invoke the foo trigger if the link
			// does NOT have the class "foo", which it doesn't, so
			// the trigger will be invoked
			<a data-trigger="foo" data-foo-options="
				'unless': {
					'self::hasClass': ['foo']
				}
			">...</a>

			this method is passed the element, the api instance, the conditional
			({ 'self::hasClass': ['foo'] }), and the type ('if' or 'unless').

			See: Delegator.verifyTargets for how examples of conditionals.
		*/
		_checkConditionals: function(element, api, _conditional){

			var conditionalIf, conditionalUnless, result = true;

			if (_conditional){
				conditionalIf = _conditional['if'];
				conditionalUnless = _conditional['unless'];
			} else {
				conditionalIf = api.get('if') ? api.getAs(Object, 'if') : null;
				conditionalUnless = api.get('unless') ? api.getAs(Object, 'unless') : null;
			}

			// no element? NO SOUP FOR YOU
			if (!element) result = false;
			// if this is an if conditional, fail if we don't verify
			if (conditionalIf && !Delegator.verifyTargets(element, conditionalIf, api)) result = false;
			// if this is an unless conditional, fail if we DO verify
			if (conditionalUnless && Delegator.verifyTargets(element, conditionalUnless, api)) result = false;

			// logging
			if (!result && this.options.verbose){
				this.fireEvent('log', ['Not executing trigger due to conditional', element, _conditional]);
			}

			return result;
		},

		/*
			event handler for all events we're monitoring on any of our attached DOM elements
		*/
		_eventHandler: function(event, target){
			// execute the triggers
			target.getTriggers().each(function(trigger){
				this.trigger(trigger, target, event);
			}, this);
		},

		/*
			iterates over the special "multi" trigger configuration and invokes them
		*/
		_handleMultiple: function(element, event){
			// make an api reader for the 'multi' options
			var api = this._getAPI(element, { name: 'multi' });

			if (!this._checkConditionals(element, api)) return;

			// get the triggers (required)
			var triggers = api.getAs(Array, 'triggers');
			// if there are triggers, run them
			if (triggers && triggers.length) this._runMultipleTriggers(element, event, triggers);
		},

		/*
			given an element, event, and an array of triggers, run them;
			only used by the 'multi', 'any', and 'first' special delegators
		*/
		_runMultipleTriggers: function(element, event, triggers){
			// iterate over the array of triggers
			triggers.each(function(trigger){
				// if it's a string, invoke it
				// example: '.selector::trigger' << finds .selector and calls 'trigger' delegator on it
				if (typeOf(trigger) == 'string'){
					this._invokeMultiTrigger(element, event, trigger);
				} else if (typeOf(trigger) == 'object'){
					// if it's an object, iterate over it's keys and config
					// example:
					// { '.selector::trigger': {'arg':'whatevs'} } << same as above, but passes ['arg'] as argument
					//                                                to the trigger as *defaults* for the trigger
					Object.each(trigger, function(config, key){
						this._invokeMultiTrigger(element, event, key, config);
					}, this);
				}
			}, this);
		},

		/*
			invokes a trigger with an optional default configuration for each target
			found for the trigger.
			trigger example: '.selector::trigger' << find .selector and invoke 'trigger' delegator
		*/
		_invokeMultiTrigger: function(element, event, trigger, config){
			// split the trigger name
			trigger = this._splitTriggerName(trigger);
			if (!trigger) return; //craps out if the trigger is mal-formed
			// get the targets specified by that trigger
			var targets = Behavior.getTargets(element, trigger.selector);
			// iterate over each target
			targets.each(function(target){
				var api;
				// create an api for the trigger/element combo and set defaults to the config (if config present)
				if (config) api = this._getAPI(target, trigger).setDefault(config);
				// invoke the trigger
				this.trigger(trigger.name, target, event, true, api);
			}, this);
		},

		/*
			given a trigger name string, split it on "::" and return the name and selector
			invokes
		*/
		_splitTriggerName: function(str){
			var split = str.split('::'),
					selector = split[0],
					name = split[1];
			if (!name || !selector){
				this.fireEvent('error', 'could not invoke multi delegator for ' + str +
					'; could not split on :: to derive selector and trigger name');
				return;
			}
			return {
				name: name,
				selector: selector
			};
		},

		/*
			Runs the custom switch triggers. Examples:

			the 'first' trigger runs through all the groups
			checking their conditions until it finds one that
			passes, then executes the driggers defined in it.
			if no conditional clause is defined, that counts
			as a pass.

			<a data-trigger="first" data-first-switches="
				[
					{
						'if': {
							'self::hasClass': ['foo']
						},
						'triggers': [
							'.seletor::triggerName',
							'...another'
						]
					},
					{
						'if': {
							'.someThingElse::hasClass': ['foo']
						},
						'triggers': [
							'.seletor::triggerName',
							'...another'
						]
					},
					{
						'triggers': [
							'.selector::triggerName'
						]
					}
				]
			">...</a>

		*/
		_runSwitch: function(switchName, element, event, method){
			method = method || 'each';
			// make an api reader for the switch options
			var api = this._getAPI(element, { name: switchName }),
					switches = api.getAs(Array, 'switches');

			if (!this._checkConditionals(element, api)) return;

			switches[method](function(config){
				if (this._checkConditionals(element, api, config)){
					this._runMultipleTriggers(element, event, config.triggers, method);
					return true;
				} else {
					return false;
				}
			}, this);
		},


		/*
			function that attaches listerners for each unique
			event type for filtesr as they're added (but only once)
		*/
		_onRegister: function(eventTypes){
			eventTypes.each(function(eventType){
				if (!this._eventTypes.contains(eventType)){
					this._attachedTo.each(function(element){
						element.addEvent(eventType + ':relay([data-trigger])', this._bound.eventHandler);
					}, this);
				}
				this._eventTypes.include(eventType);
			}, this);
		},

		_attachedTo: [],
		_eventTypes: [],
		_triggers: {}

	});

	Delegator._triggers = {};
	Delegator._instances = [];
	Delegator._onRegister = function(eventType){
		this._instances.each(function(instance){
			instance._onRegister(eventType);
		});
	};

	Delegator.register = function(eventTypes, name, handler, overwrite /** or eventType, obj, overwrite */){
		eventTypes = Array.from(eventTypes);
		if (typeOf(name) == "object"){
			var obj = name;
			for (name in obj){
				this.register.apply(this, [eventTypes, name, obj[name], handler]);
			}
			return this;
		}
		if (!this._triggers[name] || overwrite){
			if (typeOf(handler) == "function"){
				handler = {
					handler: handler
				};
			}
			handler.types = eventTypes;
			handler.name = name;
			this._triggers[name] = handler;
			this._onRegister(eventTypes);
		} else {
			throw new Error('Could add the trigger "' + name +'" as a previous trigger by that same name exists.');
		}
		return this;
	};

	Delegator.getTrigger = function(name){
		return this._triggers[name];
	};

	Delegator.addEventTypes = function(triggerName, types){
		var eventTypes = Array.from(types);
		var trigger = this.getTrigger(triggerName);
		if (trigger) trigger.types.combine(eventTypes);
		this._onRegister(eventTypes);
		return this;
	};

	Delegator.debug = function(name){
		if (!Delegator.debugging) Delegator.debugging = [];
		Delegator.debugging.push(name);
	};

	Delegator.setTriggerDefaults = function(name, defaults){
		var trigger = this.getTrigger(name);
		if (!trigger.defaults) trigger.defaults = {};
		Object.append(trigger.defaults, defaults);
	};

	Delegator.cloneTrigger = function(name, newName, defaults){
		var filter = Object.clone(this.getTrigger(name));
		this.register(filter.types, newName, filter);
		this.setTriggerDefaults(newName, defaults);
	};


	Delegator.implement('register', Delegator.register);

	Element.implement({

		addTrigger: function(name){
			return this.setData('trigger', this.getTriggers().include(name).join(' '));
		},

		removeTrigger: function(name){
			return this.setData('trigger', this.getTriggers().erase(name).join(' '));
		},

		getTriggers: function(){
			var triggers = this.getData('trigger');
			if (!triggers) return [];
			return triggers.trim().split(spaceOrCommaRegex);
		},

		hasTrigger: function(name){
			return this.getTriggers().contains(name);
		}

	});


	/*
		conditional = the parsed json conditional configuration. Examples:

		<a data-trigger="foo" data-foo-options="
			'if': {
				'self::hasClass': ['bar']
			}
		">
		This passes { 'self::hasClass': ['bar'] } through this parser
		which interpolates the 'self::hasClass' statement into an object that
		has the arguments specified below for verifyTargets, returning:
		{
			targets: 'self',
			method: 'hasClass',
			arguments: ['bar']
		}
	*/
	Delegator.parseConditional = function(conditional){
		Object.each(conditional, function(value, key){
			if (key.contains('::')){
				conditional.targets = key.split('::')[0];
				conditional.method = key.split('::')[1];
				conditional['arguments'] = value;
			}
		});
		if (conditional.value === undefined) conditional.value = true;
		return conditional;
	};

	/*
		Conditionals have the following properties:

		* target - (*string*) a css selector *relative to the element* to find a single element to test.
		* targets - (*string*) a css selector *relative to the element* to find a group of elements to test. If the conditional is true for any of them, the delegator is fired.
		* property - (*string*) a property of the target element to evaluate. Do not use with the `method` option.
		* method - (*string*) a method on the target element to invoke. Passed as arguments the `arguments` array (see below). Do not use with the `property` option.
		* arguments - (*array* of *strings*) arguments passed to the method of the target element specified in the `method` option. Ignored if the `property` option is used.
		* value - (*string*) A value to compare to either the value of the `property` of the target or the result of the `method` invoked upon it.
	*/
	Delegator.verifyTargets = function(el, conditional, api){
		conditional = Delegator.parseConditional(conditional);

		// get the targets
		var targets = Behavior.getTargets(el, conditional.targets || conditional.target);
		if (targets.length == 0) api.fail('could not find target(s): ', conditional.targets || conditional.target);
		// check the targets for the conditionals
		return targets.some(function(target){
			if (conditional.property) return target.get(conditional.property) === conditional.value;
			else if (conditional.method) return target[conditional.method].apply(target, Array.from(conditional['arguments'])) === conditional.value;
			else return !conditional.method && !conditional.property;
		});
	};

})();

/*
---

name: DOMReady

description: Contains the custom event domready.

license: MIT-style license.

requires: [Browser, Element, Element.Event]

provides: [DOMReady, DomReady]

...
*/

(function(window, document){

var ready,
	loaded,
	checks = [],
	shouldPoll,
	timer,
	testElement = document.createElement('div');

var domready = function(){
	clearTimeout(timer);
	if (ready) return;
	Browser.loaded = ready = true;
	document.removeListener('DOMContentLoaded', domready).removeListener('readystatechange', check);

	document.fireEvent('domready');
	window.fireEvent('domready');
};

var check = function(){
	for (var i = checks.length; i--;) if (checks[i]()){
		domready();
		return true;
	}
	return false;
};

var poll = function(){
	clearTimeout(timer);
	if (!check()) timer = setTimeout(poll, 10);
};

document.addListener('DOMContentLoaded', domready);

/*<ltIE8>*/
// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
// testElement.doScroll() throws when the DOM is not ready, only in the top window
var doScrollWorks = function(){
	try {
		testElement.doScroll();
		return true;
	} catch (e){}
	return false;
};
// If doScroll works already, it can't be used to determine domready
//   e.g. in an iframe
if (testElement.doScroll && !doScrollWorks()){
	checks.push(doScrollWorks);
	shouldPoll = true;
}
/*</ltIE8>*/

if (document.readyState) checks.push(function(){
	var state = document.readyState;
	return (state == 'loaded' || state == 'complete');
});

if ('onreadystatechange' in document) document.addListener('readystatechange', check);
else shouldPoll = true;

if (shouldPoll) poll();

Element.Events.domready = {
	onAdd: function(fn){
		if (ready) fn.call(this);
	}
};

// Make sure that domready fires before load
Element.Events.load = {
	base: 'load',
	onAdd: function(fn){
		if (loaded && this == window) fn.call(this);
	},
	condition: function(){
		if (this == window){
			domready();
			delete Element.Events.load;
		}
		return true;
	}
};

// This is based on the custom load event
window.addEvent('load', function(){
	loaded = true;
});

})(window, document);

/*
---

name: Behavior.init

description: Generic startup file for pages that use behavior and delegator for their js invocation.

requires:
 - Behavior/Behavior
 - Behavior/Delegator
 - Core/DomReady

provides: [Behavior.init]

...
*/

window.addEvent('domready', function(){
	window.behavior = new Behavior({
	  verbose: window.location.search.indexOf('verbose=true') >= 0 ||
	           window.location.search.indexOf('debug=true') >= 0,
	  breakOnErrors: window.location.search.indexOf('breakOnErrors=true') >= 0 ||
	           window.location.search.indexOf('debug=true') >= 0,
	});
	window.delegator = new Delegator({
	  getBehavior: function(){ return behavior; }
	}).attach(document.body);
	behavior.setDelegator(delegator).apply(document.body);
	window.fireEvent('behaviorInit', [behavior, delegator]);
});

/*
---

name: Bootstrap

description: The BootStrap namespace.

authors: [Aaron Newton]

license: MIT-style license.

provides: [Bootstrap]

...
*/
var Bootstrap = {
  version: 3
};
/*
---

name: Bootstrap.Affix

description: A MooTools implementation of Affix from Bootstrap; allows you to peg an element to a fixed position after scrolling.

authors: [Aaron Newton]

license: MIT-style license.

requires:
 - Core/Element.Dimensions
 - More/Object.Extras
 - More/Element.Event.Pseudos
 - Bootstrap

provides: [Bootstrap.Affix]

...
*/

Bootstrap.Affix = new Class({

  Implements: [Options, Events],

  options: {
    // onPin: function(){},
    // onUnPin: function(isBottom){},
    // monitor: window,
    top: 0,
    bottom: null,
    classNames: {
      top: "affix-top",
      bottom: "affix-bottom",
      affixed: "affix"
    },
    affixAtElement: {
      top: {
        element: null,
        edge: 'top',
        offset: 0
      },
      bottom: {
        element: null,
        edge: 'bottom',
        offset: 0
      }
    },
    persist: null
  },

  initialize: function(element, options){
    this.element = document.id(element);
    this.setOptions(options);
    this.element.addClass(this.options.classNames.top);
    this.top = this.options.top;
    this.bottom = this.options.bottom;
    if (this.options.affixAtElement.top.element && !this.options.affixAtElement.bottom.element){
      this.options.affixAtElement.bottom.element = this.options.affixAtElement.top.element;
    }
    this.attach();
  },

  refresh: function(){
    ['top', 'bottom'].each(function(edge){
      var offset = this._getEdgeOffset(edge);
      if (offset !== null) this[edge] = offset;
    }, this);
    return this;
  },

  _getEdgeOffset: function(edge){
    var options = this.options.affixAtElement[edge];
    if (options && options.element){
      var el = document.id(options.element);
      if (!el) return null;
      var top = el.getPosition(this.options.monitor == window ? document.body : this.options.monitor).y + options.offset;
      if (edge == 'top') top -= this.options.monitor.getSize().y;
      var height = el.getSize().y;
      switch(options.edge){
        case 'bottom':
          top += height;
          break;
        case 'middle':
          top += height/2;
          break;
      }
      return top;
    }
    return null;
  },

  attach: function(){
    this.refresh();
    Bootstrap.Affix.register(this, this.options.monitor);
    return this;
  },

  detach: function(){
    Bootstrap.Affix.drop(this, this.options.monitor);
    return this;
  },

  pinned: false,

  pin: function(){
    this.pinned = true;
    this._reset();
    this.element.addClass(this.options.classNames.affixed);
    this.fireEvent('pin');
    if (this.options.persist) this.detach();
    return this;
  },

  unpin: function(isBottom){
    if (this.options.persist) return;
    this._reset();
    this.element.addClass(this.options.classNames[isBottom ? 'bottom' : 'top']);
    this.pinned = false;
    this.fireEvent('unPin', [isBottom]);
    return this;
  },

  _reset: function(){
    this.element.removeClass(this.options.classNames.affixed)
                .removeClass(this.options.classNames.top)
                .removeClass(this.options.classNames.bottom);
    return this;
  }

});

Bootstrap.Affix.instances = [];

Bootstrap.Affix.register = function(instance, monitor){
  monitor = monitor || window;
  monitor.retrieve('Bootstrap.Affix.registered', []).push(instance);
  if (!monitor.retrieve('Bootstrap.Affix.attached')) Bootstrap.Affix.attach(monitor);
  Bootstrap.Affix.instances.include(instance);
  Bootstrap.Affix.onScroll.apply(monitor);
};

Bootstrap.Affix.drop = function(instance, monitor){
  monitor.retrieve('Bootstrap.Affix.registered', []).erase(instance);
  if (monitor.retrieve('Bootstrap.Affix.registered').length == 0) Bootstrap.Affix.detach(monitor);
  Bootstrap.Affix.instances.erase(instance);
};

Bootstrap.Affix.attach = function(monitor){
  if (!Bootstrap.Affix.attachedToWindowResize){
    Bootstrap.Affix.attachedToWindowResize = true;
    window.addEvent('resize:throttle(250)', Bootstrap.Affix.refresh);
  }
  monitor.addEvent('scroll', Bootstrap.Affix.onScroll);
  monitor.store('Bootstrap.Affix.attached', true);
};

Bootstrap.Affix.detach = function(monitor){
  monitor = monitor || window;
  monitor.removeEvent('scroll', Bootstrap.Affix.onScroll);
  monitor.store('Bootstrap.Affix.attached', false);
};

Bootstrap.Affix.refresh = function(){
  Bootstrap.Affix.instances.each(function(instance){
    instance.refresh();
  });
};

Bootstrap.Affix.onScroll = function(_y){
  var monitor = this,
      y = _y || monitor.getScroll().y,
      size = monitor.getSize().y;
  var registered = monitor.retrieve('Bootstrap.Affix.registered');
  for (var i = registered.length - 1; i >= 0; i--){
    Bootstrap.Affix.update(registered[i], y, size);
  }
};

Bootstrap.Affix.update = function(instance, y, monitorSize){
  var bottom = instance.bottom,
      top = instance.top;
  if (bottom && bottom < 0) bottom = monitorSize + bottom;

  // if we've scrolled above the top line, unpin
  if (y < top && instance.pinned) instance.unpin();
  // if we've scrolled past the bottom line, unpin
  else if (bottom && bottom < y && y > top && instance.pinned) instance.unpin(true);
  else if (y > top && (!bottom || (bottom && y < bottom)) && !instance.pinned) instance.pin();
};
/*
---

name: Behavior.BS.Affix

description: Markup invocation for Bootstrap.Affix class.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - Bootstrap.Affix

provides: [Behavior.BS.Affix]

...
*/

Behavior.addGlobalFilters({
  'BS.Affix': {

    requires: ['top'],

    returns: Bootstrap.Affix,

    setup: function(el, api){
      var options = Object.cleanValues(
        api.getAs({
          top: Number,
          bottom: Number,
          classNames: Object,
          affixAtElement: Object,
          persist: Boolean
        })
      );

      options.monitor = api.get('monitor') ? api.getElement('monitor') : window;

      if (options.affixAtElement){
        if (options.affixAtElement.top && options.affixAtElement.top.element){
          var topEl = options.affixAtElement.top.element;
          options.affixAtElement.top.element = topEl == 'self' ? el : el.getElement(topEl);
          if (!options.affixAtElement.top.element) api.warn('could not find affixAtElement.top element!', topEl, el);
        }
        if (options.affixAtElement.bottom && options.affixAtElement.bottom.element){
          bottomEl = options.affixAtElement.bottom.element;
          options.affixAtElement.bottom.element = bottomEl == 'self' ? el : el.getElement(bottomEl);
          if (!options.affixAtElement.bottom.element) api.warn('could not find affixAtElement.bottom element!', bottomEl, el);
        }
      }

      var affix = new Bootstrap.Affix(el, options);

      var refresh = affix.refresh.bind(affix),
          events = {
            'layout:display': refresh,
            'ammendDom': refresh,
            'destroyDom': refresh
          };

      api.addEvents(events);
      window.addEvent('load', refresh);
      api.addEvent('apply:once', refresh);

      api.onCleanup(function(){
        affix.detach();
        api.removeEvents(events);
      });

      return affix;
    }
  }
});
/*
---

name: Swipe

description: Adds element.addEvent('swipe', fn). fn is passed information about the swipe location and direction.

license: MIT-Style
authors:
  - 3n

requires:
  - Core/Element.Event

provides: [Swipe]

...
*/


['touchstart', 'touchmove', 'touchend'].each(function(type){
  Element.NativeEvents[type] = 2;
});

Element.Events.swipe = {
  onAdd: function(fn){
    var startX, startY, active = false;

    var touchStart = function(event){
      active = true;
      startX = event.event.touches[0].pageX;
      startY = event.event.touches[0].pageY;
    };
    var touchMove = function(event){
      var endX   = event.event.touches[0].pageX,
          endY   = event.event.touches[0].pageY,
          diffX   = endX - startX,
          diffY   = endY - startY,
          isLeftSwipe = diffX < -1 * Element.Events.swipe.swipeWidth,
          isRightSwipe = diffX > Element.Events.swipe.swipeWidth;

      if (active && (isRightSwipe || isLeftSwipe)
          && (event.onlySwipeLeft ? isLeftSwipe : true)
          && (event.onlySwipeRight ? isRightSwipe : true) ){
        active = false;
        fn.call(this, {
          'direction' : isRightSwipe ? 'right' : 'left',
          'startX'    : startX,
          'endX'      : endX
        });
      } else if (Element.Events.swipe.cancelVertical
          && Math.abs(startY - endY) < Math.abs(startX - endX)){
        return false;
      } else {
        var isUpSwipe = diffY < -1 * Element.Events.swipe.swipeHeight,
          isDownSwipe = diffY > Element.Events.swipe.swipeHeight;

        if (active && (isUpSwipe || isDownSwipe)
            && (event.onlySwipeDown ? isDownSwipe : true)
            && (event.onlySwipeUp ? isUpSwipe : true) ){
          active = false;
          fn.call(this, {
            'direction' : isUpSwipe ? 'up' : 'down',
            'startY'    : startY,
            'endY'      : endY
          });
        }
      }
    }

    this.addEvent('touchstart', touchStart);
    this.addEvent('touchmove', touchMove);

    var swipeAddedEvents = {};
    swipeAddedEvents[fn] = {
      'touchstart' : touchStart,
      'touchmove'  : touchMove
    };
    this.store('swipeAddedEvents', swipeAddedEvents);
  },

  onRemove: function(fn){
    $H(this.retrieve('swipeAddedEvents')[fn]).each(function(v,k){
      this.removeEvent(k,v);
    }, this);
  }
};

Element.Events.swipe.swipeWidth = 70;
Element.Events.swipe.swipeHeight = 70;
Element.Events.swipe.cancelVertical = true;





/*
x-x-x-

name: Swipe

description: Provides a custom swipe event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer), Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Swipe

.x.x.x


(function(){

var name = 'swipe',
  distanceKey = name + ':distance',
  cancelKey = name + ':cancelVertical',
  dflt = 50;

var start = {}, disabled, active;

var clean = function(){
  active = false;
};

var events = {

  touchstart: function(event){
    if (event.touches.length > 1) return;

    var touch = event.touches[0];
    active = true;
    start = {x: touch.pageX, y: touch.pageY};
  },

  touchmove: function(event){
    if (disabled || !active) return;

    var touch = event.changedTouches[0],
      end = {x: touch.pageX, y: touch.pageY};
    if (this.retrieve(cancelKey) && Math.abs(start.y - end.y) > 10){
      active = false;
      return;
    }

    var distance = this.retrieve(distanceKey, dflt),
      delta = end.x - start.x,
      isLeftSwipe = delta < -distance,
      isRightSwipe = delta > distance;

    if (!isRightSwipe && !isLeftSwipe)
      return;

    event.preventDefault();
    active = false;
    event.direction = (isLeftSwipe ? 'left' : 'right');
    event.start = start;
    event.end = end;

    this.fireEvent(name, event);
  },

  touchend: clean,
  touchcancel: clean

};

Element.defineCustomEvent(name, {

  onSetup: function(){
    this.addEvents(events);
  },

  onTeardown: function(){
    this.removeEvents(events);
  },

  onEnable: function(){
    disabled = false;
  },

  onDisable: function(){
    disabled = true;
    clean();
  }

});

})();

*/

/*
---

name: Slides

description: A simple slideshow base class that adds a class to an active component based on state and controls

requires:
 - Core/Element.Delegation
 - Swipe

provides: [Slides]

...
*/

Slides = new Class({
  Implements: [Options, Events],
  options: {
    // onInteraction: function(direction, from, to){},
    // onShowStart: function(index){},
    // onShow: function(index){},
    // onAfterClick: function(element){},
    // backWrap: false,
    // loop: false,
    // skipSlideClass: null,
    next: '!.carousel .slide-nav li a.next',
    back: '!.carousel .slide-nav li a.back',
    slides: 'dl',
    activeClass: 'active',
    controls: '!.carousel .slide-nav li a.jump',
    autoPlay: true,
    autoPlayPause: 5000,
    startShowDelay: 0,
    transitionPause: 0,
    startIndex: 0,
    swipe: false
  },
  initialize: function(container, options){
    this.setOptions(options);
    this.element = document.id(container);
    this.slides = this.element.getElements(this.options.slides);
    if (this.options.controls) this.controls = this.element.getElements(this.options.controls);

    this.bound = {
      clickHandler: this._clickHandler.bind(this),
      next: this.next.bind(this),
      back: this.back.bind(this)
    };

    if (this.options.swipe){
      this.bound.swipeHandler = function(e){
        this.fireEvent('interaction', 'swipe');
        if (e.direction == 'left') this.next(e);
        else if (e.direction == 'right') this.back(e);
      }.bind(this);
    }

    this.attach();
    this.show(this.options.startIndex);
    if (this.options.autoPlay) this.play();
  },
  // disabled: true, // disables all interation
  play: function(){
    this.stop();
    this.timer = this.next.periodical(this.options.autoPlayPause, this);
    return this;
  },
  stop: function(){
    clearInterval(this.timer);
    return this;
  },
  back: function(event){
    var now = this.now;
    var to = this._getIndex(now -1, -1);
    if (to == now) return this;
    if (event) this.fireEvent('interaction', ['back', now, to]).stop();
    this.startShow(to);
    return this;
  },
  next: function(event){
    var now = this.now;
    var to = this._getIndex(now + 1);
    if (to == now) return this;
    if (event) this.fireEvent('interaction', ['next', now, to]).stop();
    this.startShow(to);
    return this;
  },
  now: null,
  attach: function(_method){
    var method = _method || 'addEvent';
    if (this.options.controls) this.element[method]('click:relay(' + this.options.controls + ')', this.bound.clickHandler);
    if (this.options.next) this.element[method]('click:relay(' + this.options.next + ')', this.bound.next);
    if (this.options.back) this.element[method]('click:relay(' + this.options.back + ')', this.bound.back);
    if (this.options.swipe) this.element[method]('swipe', this.bound.swipeHandler);
    return this;
  },
  detach: function(){
    this.attach('removeEvent');
    return this;
  },
  startShow: function(i){
    i = this._getIndex(i);
    this.fireEvent('showStart', i);
    if (this.options.startShowDelay){
      clearTimeout(this.startShowTimer);
      this.startShowTimer = this.show.delay(this.options.startShowDelay, this, i);
    } else {
      this.show(i)
    }
  },
  show: function(i){
    i = this._getIndex(i);

    this.slides.removeClass(this.options.activeClass);
    if (this.controls) this.controls.removeClass(this.options.activeClass);
    this.now = i;
    if (this.options.transitionPause){
      clearTimeout(this.transitionTimer);
      this.transitionTimer = this._afterShowPause.delay(this.options.transitionPause, this);
    } else {
      this._afterShowPause();
    }
    return this;
  },
  _clickHandler: function(e, element){
    if (this.disabled) return;
    if (e) this.fireEvent('interaction', 'controls');
    this.stop();
    e.preventDefault();
    var target = this.element.getElement(element.get('href'));
    var i = this.slides.indexOf(target);
    if (i == this.now) return;
    this.startShow(i);
    this.fireEvent('afterClick', element);
  },
  _afterShowPause: function(){
    var slide = this.slides[this.now].addClass(this.options.activeClass);
    if (this.controls) this.controls.filter('[href=#' + slide.get('id') + ']').addClass(this.options.activeClass);
    this.fireEvent('show', this.now);
  },
  _getIndex: function(i, iterateBy){
    if (i >= this.slides.length) i = this.options.loop ? 0 : this.slides.length - 1;
    if (i < 0) i = this.options.backWrap ? this.slides.length - 1 : 0;

    if (this.options.skipSlideClass){
      iterateBy = iterateBy || 1;
      while (this.slides[i].hasClass(this.options.skipSlideClass)){
        i = this._getIndex(i + iterateBy, iterateBy);
      }
    }

    return i;
  }
});
/*
---

name: Behavior.BS.Carousel

description: Behavior for bootstrap's Carousel.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Slides

provides: [Behavior.BS.Carousel]

...
*/

Behavior.addGlobalFilter('BS.Carousel', {
  defaults: {
    startShowDelay: 625,
    next: '.carousel-control.right',
    back: '.carousel-control.left',
    slides: '.carousel-inner .item',
    controls: '.carousel-indicators li',
    loop: true,
    backWrap: true,
    swipe: false
  },
  returns: Slides,
  setup: function(element, api){
    var slides = new Slides(element, Object.cleanValues(
        api.getAs({
          next: String,
          back: String,
          slides: String,
          activeClass: String,
          controls: String,
          autoPlay: Boolean,
          autoPlayPause: Number,
          loop: Boolean,
          backWrap: Boolean,
          transitionPause: Number,
          startIndex: Number,
          startShowDelay: Number,
          swipe: Boolean,
          skipSlideClass: String
        })
      )
    );

    slides.addEvents({
      showStart: function(to){
        var now = slides.now;
        var direction = now > to ? 'right' : 'left';
        slides.slides[to].addClass(now > to ? 'prev' : 'next');
        slides.slides[to].offsetWidth; //force reflow
        slides.slides[now].addClass(direction);
        slides.slides[to].addClass(direction);
      },
      show: function(now){
        slides.slides.removeClass('left').removeClass('right').removeClass('prev').removeClass('next');
      }
    });

    api.onCleanup(function(){
      slides.stop().detach();
    });

    return slides;
  }
});
/*
---

name: Behavior.Slides

description: Behavior for a basic CSS driven slideshow.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Slides

provides: [Behavior.Slides]

...
*/

Behavior.addGlobalFilter('Slides', {
  returns: Slides,
  setup: function(element, api){
    var slides = new Slides(element, Object.cleanValues(
        api.getAs({
          next: String,
          back: String,
          slides: String,
          activeClass: String,
          controls: String,
          autoPlay: Boolean,
          autoPlayPause: Number,
          loop: Boolean,
          backWrap: Boolean,
          transitionPause: Number,
          startIndex: Number,
          startShowDelay: Number,
          skipSlideClass: String
        })
      )
    );

    api.onCleanup(function(){
      slides.stop().detach();
    });

    return slides;
  }
});
/*
---

name: Delegator.SetSlide

description: Delegator for controlling a Slides-based Behavior

requires:
 - Behavior/Delegator
 - Behavior.Slides

provides: [Delegator.SetSlide]

...
*/

Delegator.register('click', {
  setSlide: {
    requireAs: {
      target: String
    },
    defaults: {
      slide: 0
    },
    handler: function(event, element, api){

      var target = api.getElement('target');
      var instance;
      target.getBehaviors().each(function(behavior){
        instance = target.getBehaviorResult(behavior);
        // this allows for any subclass of Slides to work
        if (instanceOf(instance, Slides)){
          instance.show(api.get('slide'));
          instance.play(); // to reset the timer
        }
      });
    }
  }
});

/*
---

name: Bootstrap.Dropdown

description: A simple dropdown menu that works with the Twitter Bootstrap css framework.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Core/Element.Event
 - Core/Class.Extras
 - Bootstrap

provides: Bootstrap.Dropdown

...
*/
Bootstrap.Dropdown = new Class({

  Implements: [Options, Events],

  options: {
    /*
      onShow: function(element){},
      onHide: function(elements){},
    */
    ignore: 'input, select, label'
  },

  initialize: function(container, options){
    this.element = document.id(container);
    this.setOptions(options);
    this.boundHandle = this._handle.bind(this);
    document.id(document.body).addEvent('click', this.boundHandle);
  },

  hideAll: function(){
    var els = this.element.removeClass('open').getElements('.open').removeClass('open');
    this.fireEvent('hide', els);
    return this;
  },

  show: function(subMenu){
    this.hideAll();
    this.fireEvent('show', subMenu);
    subMenu.addClass('open');
    return this;
  },

  destroy: function(){
    this.hideAll();
    document.body.removeEvent('click', this.boundHandle);
    return this;
  },

  // PRIVATE

  _handle: function(e){
    var el = e.target;
    var open = el.getParent('.open');
    if (!el.match(this.options.ignore) || !open) this.hideAll();
    if (this.element.contains(el)){
      var parent;
      if (el.match('[data-toggle="dropdown"]') || el.getParent('[data-toggle="dropdown"] !')){
        parent = el.getParent('.dropdown, .btn-group');
      }
      // backwards compatibility
      if (!parent) parent = el.match('.dropdown-toggle') ? el.getParent() : el.getParent('.dropdown-toggle !');
      if (parent){
        e.preventDefault();
        if (!open) this.show(parent);
      }
    }
  }
});
/*
---

name: Behavior.BS.Dropdown

description: Instantiates Bootstrap.Dropdown based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - Bootstrap.Dropdown

provides: [Behavior.BS.Dropdown]

...
*/
Behavior.addGlobalFilters({
  'BS.Dropdown': {
    returns: Bootstrap.Dropdown,
    setup: function(el, api){
      return new Bootstrap.Dropdown(el);
    }
  }
});
/*
---

name: Fx.Morph

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires: Fx.CSS

provides: Fx.Morph

...
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		this.get('morph').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var morph = this.retrieve('morph');
		if (!morph){
			morph = new Fx.Morph(this, {link: 'cancel'});
			this.store('morph', morph);
		}
		return morph;
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});

/*
---

script: Element.Shortcuts.js

name: Element.Shortcuts

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.style.display != 'none';
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			//IE fails here if the element is not in the dom
			d = this.getStyle('display');
		} catch(e){}
		if (d == 'none') return this;
		return this.store('element:_originalDisplay', d || '').setStyle('display', 'none');
	},

	show: function(display){
		if (!display && this.isDisplayed()) return this;
		display = display || this.retrieve('element:_originalDisplay') || 'block';
		return this.setStyle('display', (display == 'none') ? 'block' : display);
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});

Document.implement({

	clearSelection: function(){
		if (window.getSelection){
			var selection = window.getSelection();
			if (selection && selection.removeAllRanges) selection.removeAllRanges();
		} else if (document.selection && document.selection.empty){
			try {
				//IE fails here if selected element is not in dom
				document.selection.empty();
			} catch(e){}
		}
	}

});

/*
---

script: Fx.Reveal.js

name: Fx.Reveal

description: Defines Fx.Reveal, a class that shows and hides elements with a transition.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Fx.Morph
  - Element.Shortcuts
  - Element.Measure

provides: [Fx.Reveal]

...
*/

(function(){


var hideTheseOf = function(object){
	var hideThese = object.options.hideInputs;
	if (window.OverText){
		var otClasses = [null];
		OverText.each(function(ot){
			otClasses.include('.' + ot.options.labelClass);
		});
		if (otClasses) hideThese += otClasses.join(', ');
	}
	return (hideThese) ? object.element.getElements(hideThese) : null;
};


Fx.Reveal = new Class({

	Extends: Fx.Morph,

	options: {/*
		onShow: function(thisElement){},
		onHide: function(thisElement){},
		onComplete: function(thisElement){},
		heightOverride: null,
		widthOverride: null,*/
		link: 'cancel',
		styles: ['padding', 'border', 'margin'],
		transitionOpacity: 'opacity' in document.documentElement,
		mode: 'vertical',
		display: function(){
			return this.element.get('tag') != 'tr' ? 'block' : 'table-row';
		},
		opacity: 1,
		hideInputs: !('opacity' in document.documentElement) ? 'select, input, textarea, object, embed' : null
	},

	dissolve: function(){
		if (!this.hiding && !this.showing){
			if (this.element.getStyle('display') != 'none'){
				this.hiding = true;
				this.showing = false;
				this.hidden = true;
				this.cssText = this.element.style.cssText;

				var startStyles = this.element.getComputedSize({
					styles: this.options.styles,
					mode: this.options.mode
				});
				if (this.options.transitionOpacity) startStyles.opacity = this.options.opacity;

				var zero = {};
				Object.each(startStyles, function(style, name){
					zero[name] = [style, 0];
				});

				this.element.setStyles({
					display: Function.from(this.options.display).call(this),
					overflow: 'hidden'
				});

				var hideThese = hideTheseOf(this);
				if (hideThese) hideThese.setStyle('visibility', 'hidden');

				this.$chain.unshift(function(){
					if (this.hidden){
						this.hiding = false;
						this.element.style.cssText = this.cssText;
						this.element.setStyle('display', 'none');
						if (hideThese) hideThese.setStyle('visibility', 'visible');
					}
					this.fireEvent('hide', this.element);
					this.callChain();
				}.bind(this));

				this.start(zero);
			} else {
				this.callChain.delay(10, this);
				this.fireEvent('complete', this.element);
				this.fireEvent('hide', this.element);
			}
		} else if (this.options.link == 'chain'){
			this.chain(this.dissolve.bind(this));
		} else if (this.options.link == 'cancel' && !this.hiding){
			this.cancel();
			this.dissolve();
		}
		return this;
	},

	reveal: function(){
		if (!this.showing && !this.hiding){
			if (this.element.getStyle('display') == 'none'){
				this.hiding = false;
				this.showing = true;
				this.hidden = false;
				this.cssText = this.element.style.cssText;

				var startStyles;
				this.element.measure(function(){
					startStyles = this.element.getComputedSize({
						styles: this.options.styles,
						mode: this.options.mode
					});
				}.bind(this));
				if (this.options.heightOverride != null) startStyles.height = this.options.heightOverride.toInt();
				if (this.options.widthOverride != null) startStyles.width = this.options.widthOverride.toInt();
				if (this.options.transitionOpacity){
					this.element.setStyle('opacity', 0);
					startStyles.opacity = this.options.opacity;
				}

				var zero = {
					height: 0,
					display: Function.from(this.options.display).call(this)
				};
				Object.each(startStyles, function(style, name){
					zero[name] = 0;
				});
				zero.overflow = 'hidden';

				this.element.setStyles(zero);

				var hideThese = hideTheseOf(this);
				if (hideThese) hideThese.setStyle('visibility', 'hidden');

				this.$chain.unshift(function(){
					this.element.style.cssText = this.cssText;
					this.element.setStyle('display', Function.from(this.options.display).call(this));
					if (!this.hidden) this.showing = false;
					if (hideThese) hideThese.setStyle('visibility', 'visible');
					this.callChain();
					this.fireEvent('show', this.element);
				}.bind(this));

				this.start(startStyles);
			} else {
				this.callChain();
				this.fireEvent('complete', this.element);
				this.fireEvent('show', this.element);
			}
		} else if (this.options.link == 'chain'){
			this.chain(this.reveal.bind(this));
		} else if (this.options.link == 'cancel' && !this.showing){
			this.cancel();
			this.reveal();
		}
		return this;
	},

	toggle: function(){
		if (this.element.getStyle('display') == 'none'){
			this.reveal();
		} else {
			this.dissolve();
		}
		return this;
	},

	cancel: function(){
		this.parent.apply(this, arguments);
		if (this.cssText != null) this.element.style.cssText = this.cssText;
		this.hiding = false;
		this.showing = false;
		return this;
	}

});

Element.Properties.reveal = {

	set: function(options){
		this.get('reveal').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var reveal = this.retrieve('reveal');
		if (!reveal){
			reveal = new Fx.Reveal(this);
			this.store('reveal', reveal);
		}
		return reveal;
	}

};

Element.Properties.dissolve = Element.Properties.reveal;

Element.implement({

	reveal: function(options){
		this.get('reveal').setOptions(options).reveal();
		return this;
	},

	dissolve: function(options){
		this.get('reveal').setOptions(options).dissolve();
		return this;
	},

	nix: function(options){
		var params = Array.link(arguments, {destroy: Type.isBoolean, options: Type.isObject});
		this.get('reveal').setOptions(options).dissolve().chain(function(){
			this[params.destroy ? 'destroy' : 'dispose']();
		}.bind(this));
		return this;
	},

	wink: function(){
		var params = Array.link(arguments, {duration: Type.isNumber, options: Type.isObject});
		var reveal = this.get('reveal').setOptions(params.options);
		reveal.reveal().chain(function(){
			(function(){
				reveal.dissolve();
			}).delay(params.duration || 2000);
		});
	}

});

})();

/*
---

script: Locale.js

name: Locale

description: Provides methods for localization.

license: MIT-style license

authors:
  - Aaron Newton
  - Arian Stolwijk

requires:
  - Core/Events
  - Object.Extras
  - MooTools.More

provides: [Locale, Lang]

...
*/

(function(){

var current = null,
	locales = {},
	inherits = {};

var getSet = function(set){
	if (instanceOf(set, Locale.Set)) return set;
	else return locales[set];
};

var Locale = this.Locale = {

	define: function(locale, set, key, value){
		var name;
		if (instanceOf(locale, Locale.Set)){
			name = locale.name;
			if (name) locales[name] = locale;
		} else {
			name = locale;
			if (!locales[name]) locales[name] = new Locale.Set(name);
			locale = locales[name];
		}

		if (set) locale.define(set, key, value);

		/*<1.2compat>*/
		if (set == 'cascade') return Locale.inherit(name, key);
		/*</1.2compat>*/

		if (!current) current = locale;

		return locale;
	},

	use: function(locale){
		locale = getSet(locale);

		if (locale){
			current = locale;

			this.fireEvent('change', locale);

			/*<1.2compat>*/
			this.fireEvent('langChange', locale.name);
			/*</1.2compat>*/
		}

		return this;
	},

	getCurrent: function(){
		return current;
	},

	get: function(key, args){
		return (current) ? current.get(key, args) : '';
	},

	inherit: function(locale, inherits, set){
		locale = getSet(locale);

		if (locale) locale.inherit(inherits, set);
		return this;
	},

	list: function(){
		return Object.keys(locales);
	}

};

Object.append(Locale, new Events);

Locale.Set = new Class({

	sets: {},

	inherits: {
		locales: [],
		sets: {}
	},

	initialize: function(name){
		this.name = name || '';
	},

	define: function(set, key, value){
		var defineData = this.sets[set];
		if (!defineData) defineData = {};

		if (key){
			if (typeOf(key) == 'object') defineData = Object.merge(defineData, key);
			else defineData[key] = value;
		}
		this.sets[set] = defineData;

		return this;
	},

	get: function(key, args, _base){
		var value = Object.getFromPath(this.sets, key);
		if (value != null){
			var type = typeOf(value);
			if (type == 'function') value = value.apply(null, Array.from(args));
			else if (type == 'object') value = Object.clone(value);
			return value;
		}

		// get value of inherited locales
		var index = key.indexOf('.'),
			set = index < 0 ? key : key.substr(0, index),
			names = (this.inherits.sets[set] || []).combine(this.inherits.locales).include('en-US');
		if (!_base) _base = [];

		for (var i = 0, l = names.length; i < l; i++){
			if (_base.contains(names[i])) continue;
			_base.include(names[i]);

			var locale = locales[names[i]];
			if (!locale) continue;

			value = locale.get(key, args, _base);
			if (value != null) return value;
		}

		return '';
	},

	inherit: function(names, set){
		names = Array.from(names);

		if (set && !this.inherits.sets[set]) this.inherits.sets[set] = [];

		var l = names.length;
		while (l--) (set ? this.inherits.sets[set] : this.inherits.locales).unshift(names[l]);

		return this;
	}

});

/*<1.2compat>*/
var lang = MooTools.lang = {};

Object.append(lang, Locale, {
	setLanguage: Locale.use,
	getCurrentLanguage: function(){
		var current = Locale.getCurrent();
		return (current) ? current.name : null;
	},
	set: function(){
		Locale.define.apply(this, arguments);
		return this;
	},
	get: function(set, key, args){
		if (key) set += '.' + key;
		return Locale.get(set, args);
	}
});
/*</1.2compat>*/

})();

/*
---

name: Locale.en-US.Date

description: Date messages for US English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Locale

provides: [Locale.en-US.Date]

...
*/

Locale.define('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	months_abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	days_abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

	// Culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',
	firstDayOfWeek: 0,

	// Date.Extras
	ordinal: function(dayOfMonth){
		// 1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',

	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});

/*
---

script: Date.js

name: Date

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
  - Aaron Newton
  - Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
  - Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
  - Scott Kyle - scott [at] appden.com; http://appden.com

requires:
  - Core/Array
  - Core/String
  - Core/Number
  - MooTools.More
  - Locale
  - Locale.en-US.Date

provides: [Date]

...
*/

(function(){

var Date = this.Date;

var DateMethods = Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds', 'UTCMilliseconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(n, digits, string){
	if (digits == 1) return n;
	return n < Math.pow(10, digits - 1) ? (string || '0') + pad(n, digits - 1, string) : n;
};

Date.implement({

	set: function(prop, value){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'set' + DateMethods[prop];
		if (method && this[method]) this[method](value);
		return this;
	}.overloadSetter(),

	get: function(prop){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'get' + DateMethods[prop];
		if (method && this[method]) return this[method]();
		return null;
	}.overloadGetter(),

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = times != null ? times : 1;

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * (times != null ? times : 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(date, resolution){
		if (typeOf(date) == 'string') date = Date.parse(date);

		return ((date - this) / Date.units[resolution || 'day'](3, 3)).round(); // non-leap year, 30-day month
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1)
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	setDay: function(day, firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		day = (7 + Date.parseDay(day, true) - firstDayOfWeek) % 7;
		var currentDay = (7 + this.get('day') - firstDayOfWeek) % 7;

		return this.increment('day', day - currentDay);
	},

	getWeek: function(firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		var date = this,
			dayOfWeek = (7 + date.get('day') - firstDayOfWeek) % 7,
			dividend = 0,
			firstDayOfYear;

		if (firstDayOfWeek == 1){
			// ISO-8601, week belongs to year that has the most days of the week (i.e. has the thursday of the week)
			var month = date.get('month'),
				startOfWeek = date.get('date') - dayOfWeek;

			if (month == 11 && startOfWeek > 28) return 1; // Week 1 of next year

			if (month == 0 && startOfWeek < -2){
				// Use a date from last year to determine the week
				date = new Date(date).decrement('day', dayOfWeek);
				dayOfWeek = 0;
			}

			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day') || 7;
			if (firstDayOfYear > 4) dividend = -7; // First week of the year is not week 1
		} else {
			// In other cultures the first week of the year is always week 1 and the last week always 53 or 54.
			// Days in the same week can have a different weeknumber if the week spreads across two years.
			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day');
		}

		dividend += date.get('dayofyear');
		dividend += 6 - dayOfWeek; // Add days so we calculate the current date's week as a full week
		dividend += (7 + firstDayOfYear - firstDayOfWeek) % 7; // Make up for first week of the year not being a full week

		return (dividend / 7);
	},

	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date){
		if (!date) date = this;
		return typeOf(date) == 'date' && !isNaN(date.valueOf());
	},

	format: function(format){
		if (!this.isValid()) return 'invalid date';

		if (!format) format = '%x %X';
		if (typeof format == 'string') format = formats[format.toLowerCase()] || format;
		if (typeof format == 'function') return format(this);

		var d = this;
		return format.replace(/%([a-z%])/gi,
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days_abbr')[d.get('day')];
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months_abbr')[d.get('month')];
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.format('%a %b %d %H:%M:%S %Y');
					case 'd': return pad(d.get('date'), 2);
					case 'e': return pad(d.get('date'), 2, ' ');
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return pad((d.get('hr') % 12) || 12, 2);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'k': return pad(d.get('hr'), 2, ' ');
					case 'l': return pad((d.get('hr') % 12) || 12, 2, ' ');
					case 'L': return pad(d.get('ms'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 's': return Math.round(d / 1000);
					case 'S': return pad(d.get('seconds'), 2);
					case 'T': return d.format('%H:%M:%S');
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'z': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

}).alias({
	toJSON: 'toISOString',
	compare: 'diff',
	strftime: 'format'
});

// The day and month abbreviations are standardized, so we cannot use simply %a and %b because they will get localized
var rfcDayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	rfcMonthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M',
	rfc822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %Z');
	},
	rfc2822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %z');
	},
	iso8601: function(date){
		return (
			date.getUTCFullYear() + '-' +
			pad(date.getUTCMonth() + 1, 2) + '-' +
			pad(date.getUTCDate(), 2) + 'T' +
			pad(date.getUTCHours(), 2) + ':' +
			pad(date.getUTCMinutes(), 2) + ':' +
			pad(date.getUTCSeconds(), 2) + '.' +
			pad(date.getUTCMilliseconds(), 3) + 'Z'
		);
	}
};

var parsePatterns = [],
	nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1,
		translated = Date.getMsg(type + 's');
	switch (typeOf(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[word];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + word);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length) throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};

var startCentury = 1900,
	startYear = 70;

Date.extend({

	getMsg: function(key, args){
		return Locale.get('Date.' + key, args);
	},

	units: {
		ms: Function.from(1),
		second: Function.from(1000),
		minute: Function.from(60000),
		hour: Function.from(3600000),
		day: Function.from(86400000),
		week: Function.from(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth(month != null ? month : d.get('mo'), year != null ? year : d.get('year')) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = typeOf(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
		});

		if (!(parsed && parsed.isValid())){
			parsed = new Date(nativeParse(from));
			if (!(parsed && parsed.isValid())) parsed = new Date(from.toInt());
		}
		return parsed;
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec'),
			localDate.get('ms')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
		return this;
	},

	//<1.2compat>
	parsePatterns: parsePatterns,
	//</1.2compat>

	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
		return this;
	},

	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
		return this;
	},

	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
		return this;
	}

}).extend({
	defineFormats: Date.defineFormat.overloadSetter()
});

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch (key){
		case 'T':
			return '%H:%M:%S';
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[-./]%d' : '%d[-./]%m') + '([-./]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%z?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	z: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;

	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');

	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};

	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff;\&]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime(),
				year = bits.y || bits.Y;

			if (year != null) handle.call(date, 'y', year); // need to start in the right year
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits || bits.b || bits.B) handle.call(date, 'm', 1);

			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

	switch (key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'z':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %z %Y', // "Thu Oct 22 08:11:23 +0000 2009"
	'%T', // %H:%M:%S
	'%H:%M( ?%p)?' // "11:05pm", "11:05 am" and "11:05"
);

Locale.addEvent('change', function(language){
	if (Locale.get('Date')) recompile(language);
}).fireEvent('change', Locale.getCurrent());

})();

/*
---

name: Locale.en-US.Form.Validator

description: Form Validator messages for English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Locale

provides: [Locale.en-US.Form.Validator]

...
*/

Locale.define('en-US', 'FormValidator', {

	required: 'This field is required.',
	length: 'Please enter {length} characters (you entered {elLength} characters)',
	minLength: 'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength: 'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer: 'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric: 'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits: 'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha: 'Please use only letters (a-z) within this field. No spaces or other characters are allowed.',
	alphanum: 'Please use only letters (a-z) or numbers (0-9) in this field. No spaces or other characters are allowed.',
	dateSuchAs: 'Please enter a valid date such as {date}',
	dateInFormatMDY: 'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email: 'Please enter a valid email address. For example "fred@domain.com".',
	url: 'Please enter a valid URL such as http://www.example.com.',
	currencyDollar: 'Please enter a valid $ amount. For example $100.00 .',
	oneRequired: 'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	// Form.Validator.Extras
	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currentDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});

/*
---

script: Form.Validator.js

name: Form.Validator

description: A css-class based form validation system.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Delegation
  - Core/Slick.Finder
  - Core/Element.Event
  - Core/Element.Style
  - Core/JSON
  - Locale
  - Class.Binds
  - Date
  - Element.Forms
  - Locale.en-US.Form.Validator
  - Element.Shortcuts

provides: [Form.Validator, InputValidator, FormValidator.BaseValidators]

...
*/
if (!window.Form) window.Form = {};

var InputValidator = this.InputValidator = new Class({

	Implements: [Options],

	options: {
		errorMsg: 'Validation failed.',
		test: Function.from(true)
	},

	initialize: function(className, options){
		this.setOptions(options);
		this.className = className;
	},

	test: function(field, props){
		field = document.id(field);
		return (field) ? this.options.test(field, props || this.getProps(field)) : false;
	},

	getError: function(field, props){
		field = document.id(field);
		var err = this.options.errorMsg;
		if (typeOf(err) == 'function') err = err(field, props || this.getProps(field));
		return err;
	},

	getProps: function(field){
		field = document.id(field);
		return (field) ? field.get('validatorProps') : {};
	}

});

Element.Properties.validators = {

	get: function(){
		return (this.get('data-validators') || this.className).clean().split(' ');
	}

};

Element.Properties.validatorProps = {

	set: function(props){
		return this.eliminate('$moo:validatorProps').store('$moo:validatorProps', props);
	},

	get: function(props){
		if (props) this.set(props);
		if (this.retrieve('$moo:validatorProps')) return this.retrieve('$moo:validatorProps');
		if (this.getProperty('data-validator-properties') || this.getProperty('validatorProps')){
			try {
				this.store('$moo:validatorProps', JSON.decode(this.getProperty('validatorProps') || this.getProperty('data-validator-properties'), false));
			}catch(e){
				return {};
			}
		} else {
			var vals = this.get('validators').filter(function(cls){
				return cls.test(':');
			});
			if (!vals.length){
				this.store('$moo:validatorProps', {});
			} else {
				props = {};
				vals.each(function(cls){
					var split = cls.split(':');
					if (split[1]){
						try {
							props[split[0]] = JSON.decode(split[1], false);
						} catch(e){}
					}
				});
				this.store('$moo:validatorProps', props);
			}
		}
		return this.retrieve('$moo:validatorProps');
	}

};

Form.Validator = new Class({

	Implements: [Options, Events],

	options: {/*
		onFormValidate: function(isValid, form, event){},
		onElementValidate: function(isValid, field, className, warn){},
		onElementPass: function(field){},
		onElementFail: function(field, validatorsFailed){}, */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		ignoreDisabled: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return Form.Validator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return Form.Validator.getMsg('errorPrefix') || 'Error: ';
		}
	},

	initialize: function(form, options){
		this.setOptions(options);
		this.element = document.id(form);
		this.warningPrefix = Function.from(this.options.warningPrefix)();
		this.errorPrefix = Function.from(this.options.errorPrefix)();
		this._bound = {
			onSubmit: this.onSubmit.bind(this),
			blurOrChange: function(event, field){
				this.validationMonitor(field, true);
			}.bind(this)
		};
		this.enable();
	},

	toElement: function(){
		return this.element;
	},

	getFields: function(){
		return (this.fields = this.element.getElements(this.options.fieldSelectors));
	},

	enable: function(){
		this.element.store('validator', this);
		if (this.options.evaluateOnSubmit) this.element.addEvent('submit', this._bound.onSubmit);
		if (this.options.evaluateFieldsOnBlur){
			this.element.addEvent('blur:relay(input,select,textarea)', this._bound.blurOrChange);
		}
		if (this.options.evaluateFieldsOnChange){
			this.element.addEvent('change:relay(input,select,textarea)', this._bound.blurOrChange);
		}
	},

	disable: function(){
		this.element.eliminate('validator');
		this.element.removeEvents({
			submit: this._bound.onSubmit,
			'blur:relay(input,select,textarea)': this._bound.blurOrChange,
			'change:relay(input,select,textarea)': this._bound.blurOrChange
		});
	},

	validationMonitor: function(){
		clearTimeout(this.timer);
		this.timer = this.validateField.delay(50, this, arguments);
	},

	onSubmit: function(event){
		if (this.validate(event)) this.reset();
	},

	reset: function(){
		this.getFields().each(this.resetField, this);
		return this;
	},

	validate: function(event){
		var result = this.getFields().map(function(field){
			return this.validateField(field, true);
		}, this).every(function(v){
			return v;
		});
		this.fireEvent('formValidate', [result, this.element, event]);
		if (this.options.stopOnFailure && !result && event) event.preventDefault();
		return result;
	},

	validateField: function(field, force){
		if (this.paused) return true;
		field = document.id(field);
		var passed = !field.hasClass('validation-failed');
		var failed, warned;
		if (this.options.serial && !force){
			failed = this.element.getElement('.validation-failed');
			warned = this.element.getElement('.warning');
		}
		if (field && (!failed || force || field.hasClass('validation-failed') || (failed && !this.options.serial))){
			var validationTypes = field.get('validators');
			var validators = validationTypes.some(function(cn){
				return this.getValidator(cn);
			}, this);
			var validatorsFailed = [];
			validationTypes.each(function(className){
				if (className && !this.test(className, field)) validatorsFailed.include(className);
			}, this);
			passed = validatorsFailed.length === 0;
			if (validators && !this.hasValidator(field, 'warnOnly')){
				if (passed){
					field.addClass('validation-passed').removeClass('validation-failed');
					this.fireEvent('elementPass', [field]);
				} else {
					field.addClass('validation-failed').removeClass('validation-passed');
					this.fireEvent('elementFail', [field, validatorsFailed]);
				}
			}
			if (!warned){
				var warnings = validationTypes.some(function(cn){
					if (cn.test('^warn'))
						return this.getValidator(cn.replace(/^warn-/,''));
					else return null;
				}, this);
				field.removeClass('warning');
				var warnResult = validationTypes.map(function(cn){
					if (cn.test('^warn'))
						return this.test(cn.replace(/^warn-/,''), field, true);
					else return null;
				}, this);
			}
		}
		return passed;
	},

	test: function(className, field, warn){
		field = document.id(field);
		if ((this.options.ignoreHidden && !field.isVisible()) || (this.options.ignoreDisabled && field.get('disabled'))) return true;
		var validator = this.getValidator(className);
		if (warn != null) warn = false;
		if (this.hasValidator(field, 'warnOnly')) warn = true;
		var isValid = field.hasClass('ignoreValidation') || (validator ? validator.test(field) : true);
		if (validator) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
	},

	hasValidator: function(field, value){
		return field.get('validators').contains(value);
	},

	resetField: function(field){
		field = document.id(field);
		if (field){
			field.get('validators').each(function(className){
				if (className.test('^warn-')) className = className.replace(/^warn-/, '');
				field.removeClass('validation-failed');
				field.removeClass('warning');
				field.removeClass('validation-passed');
			}, this);
		}
		return this;
	},

	stop: function(){
		this.paused = true;
		return this;
	},

	start: function(){
		this.paused = false;
		return this;
	},

	ignoreField: function(field, warn){
		field = document.id(field);
		if (field){
			this.enforceField(field);
			if (warn) field.addClass('warnOnly');
			else field.addClass('ignoreValidation');
		}
		return this;
	},

	enforceField: function(field){
		field = document.id(field);
		if (field) field.removeClass('warnOnly').removeClass('ignoreValidation');
		return this;
	}

});

Form.Validator.getMsg = function(key){
	return Locale.get('FormValidator.' + key);
};

Form.Validator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of Form.Validator and the Form.Validator namespace)
		//extend these validators into it
		//this allows validators to be global and/or per instance
		if (!this.initialize){
			this.implement({
				validators: this.validators
			});
		}
	},

	addAllThese : function(validators){
		Array.from(validators).each(function(validator){
			this.add(validator[0], validator[1]);
		}, this);
	},

	getValidator: function(className){
		return this.validators[className.split(':')[0]];
	}

};

Object.append(Form.Validator, Form.Validator.adders);

Form.Validator.implement(Form.Validator.adders);

Form.Validator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

Form.Validator.addAllThese([

	['required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element){
			return !Form.Validator.getValidator('IsEmpty').test(element);
		}
	}],

	['length', {
		errorMsg: function(element, props){
			if (typeOf(props.length) != 'null')
				return Form.Validator.getMsg('length').substitute({length: props.length, elLength: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.length) != 'null') return (element.get('value').length == props.length || element.get('value').length == 0);
			else return true;
		}
	}],

	['minLength', {
		errorMsg: function(element, props){
			if (typeOf(props.minLength) != 'null')
				return Form.Validator.getMsg('minLength').substitute({minLength: props.minLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.minLength) != 'null') return (element.get('value').length >= (props.minLength || 0));
			else return true;
		}
	}],

	['maxLength', {
		errorMsg: function(element, props){
			//props is {maxLength:10}
			if (typeOf(props.maxLength) != 'null')
				return Form.Validator.getMsg('maxLength').substitute({maxLength: props.maxLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			return element.get('value').length <= (props.maxLength || 10000);
		}
	}],

	['validate-integer', {
		errorMsg: Form.Validator.getMsg.pass('integer'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: Form.Validator.getMsg.pass('numeric'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: Form.Validator.getMsg.pass('digits'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: Form.Validator.getMsg.pass('alpha'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: Form.Validator.getMsg.pass('alphanum'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return Form.Validator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return Form.Validator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
			var dateLocale = Locale.get('Date'),
				dateNouns = new RegExp([dateLocale.days, dateLocale.days_abbr, dateLocale.months, dateLocale.months_abbr, dateLocale.AM, dateLocale.PM].flatten().join('|'), 'i'),
				value = element.get('value'),
				wordsInValue = value.match(/[a-z]+/gi);

			if (wordsInValue && !wordsInValue.every(dateNouns.exec, dateNouns)) return false;

			var date = Date.parse(value);
			if (!date) return false;

			var format = props.dateFormat || '%x',
				formatted = date.format(format);
			if (formatted != 'invalid date') element.set('value', formatted);
			return date.isValid();
		}
	}],

	['validate-email', {
		errorMsg: Form.Validator.getMsg.pass('email'),
		test: function(element){
			/*
			var chars = "[a-z0-9!#$%&'*+/=?^_`{|}~-]",
				local = '(?:' + chars + '\\.?){0,63}' + chars,

				label = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?',
				hostname = '(?:' + label + '\\.)*' + label;

				octet = '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
				ipv4 = '\\[(?:' + octet + '\\.){3}' + octet + '\\]',

				domain = '(?:' + hostname + '|' + ipv4 + ')';

			var regex = new RegExp('^' + local + '@' + domain + '$', 'i');
			*/
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: Form.Validator.getMsg.pass('url'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: Form.Validator.getMsg.pass('currencyDollar'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: Form.Validator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.getParent(props['validate-one-required']);
			return p.getElements('input').some(function(el){
				if (['checkbox', 'radio'].contains(el.get('type'))) return el.get('checked');
				return el.get('value');
			});
		}
	}]

]);

Element.Properties.validator = {

	set: function(options){
		this.get('validator').setOptions(options);
	},

	get: function(){
		var validator = this.retrieve('validator');
		if (!validator){
			validator = new Form.Validator(this);
			this.store('validator', validator);
		}
		return validator;
	}

};

Element.implement({

	validate: function(options){
		if (options) this.set('validator', options);
		return this.get('validator').validate();
	}

});


//<1.2compat>
//legacy
var FormValidator = Form.Validator;
//</1.2compat>



/*
---

script: Form.Validator.Inline.js

name: Form.Validator.Inline

description: Extends Form.Validator to add inline messages.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Form.Validator

provides: [Form.Validator.Inline]

...
*/

Form.Validator.Inline = new Class({

	Extends: Form.Validator,

	options: {
		showError: function(errorElement){
			if (errorElement.reveal) errorElement.reveal();
			else errorElement.setStyle('display', 'block');
		},
		hideError: function(errorElement){
			if (errorElement.dissolve) errorElement.dissolve();
			else errorElement.setStyle('display', 'none');
		},
		scrollToErrorsOnSubmit: true,
		scrollToErrorsOnBlur: false,
		scrollToErrorsOnChange: false,
		scrollFxOptions: {
			transition: 'quad:out',
			offset: {
				y: -20
			}
		}
	},

	initialize: function(form, options){
		this.parent(form, options);
		this.addEvent('onElementValidate', function(isValid, field, className, warn){
			var validator = this.getValidator(className);
			if (!isValid && validator.getError(field)){
				if (warn) field.addClass('warning');
				var advice = this.makeAdvice(className, field, validator.getError(field), warn);
				this.insertAdvice(advice, field);
				this.showAdvice(className, field);
			} else {
				this.hideAdvice(className, field);
			}
		});
	},

	makeAdvice: function(className, field, error, warn){
		var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
			errorMsg += (this.options.useTitles) ? field.title || error:error;
		var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
		var advice = this.getAdvice(className, field);
		if (advice){
			advice = advice.set('html', errorMsg);
		} else {
			advice = new Element('div', {
				html: errorMsg,
				styles: { display: 'none' },
				id: 'advice-' + className.split(':')[0] + '-' + this.getFieldId(field)
			}).addClass(cssClass);
		}
		field.store('$moo:advice-' + className, advice);
		return advice;
	},

	getFieldId : function(field){
		return field.id ? field.id : field.id = 'input_' + field.name;
	},

	showAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (
			advice &&
			!field.retrieve('$moo:' + this.getPropName(className)) &&
			(
				advice.getStyle('display') == 'none' ||
				advice.getStyle('visibility') == 'hidden' ||
				advice.getStyle('opacity') == 0
			)
		){
			field.store('$moo:' + this.getPropName(className), true);
			this.options.showError(advice);
			this.fireEvent('showAdvice', [field, advice, className]);
		}
	},

	hideAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && field.retrieve('$moo:' + this.getPropName(className))){
			field.store('$moo:' + this.getPropName(className), false);
			this.options.hideError(advice);
			this.fireEvent('hideAdvice', [field, advice, className]);
		}
	},

	getPropName: function(className){
		return 'advice' + className;
	},

	resetField: function(field){
		field = document.id(field);
		if (!field) return this;
		this.parent(field);
		field.get('validators').each(function(className){
			this.hideAdvice(className, field);
		}, this);
		return this;
	},

	getAllAdviceMessages: function(field, force){
		var advice = [];
		if (field.hasClass('ignoreValidation') && !force) return advice;
		var validators = field.get('validators').some(function(cn){
			var warner = cn.test('^warn-') || field.hasClass('warnOnly');
			if (warner) cn = cn.replace(/^warn-/, '');
			var validator = this.getValidator(cn);
			if (!validator) return;
			advice.push({
				message: validator.getError(field),
				warnOnly: warner,
				passed: validator.test(),
				validator: validator
			});
		}, this);
		return advice;
	},

	getAdvice: function(className, field){
		return field.retrieve('$moo:advice-' + className);
	},

	insertAdvice: function(advice, field){
		//Check for error position prop
		var props = field.get('validatorProps');
		//Build advice
		if (!props.msgPos || !document.id(props.msgPos)){
			if (field.type && field.type.toLowerCase() == 'radio') field.getParent().adopt(advice);
			else advice.inject(document.id(field), 'after');
		} else {
			document.id(props.msgPos).grab(advice);
		}
	},

	validateField: function(field, force, scroll){
		var result = this.parent(field, force);
		if (((this.options.scrollToErrorsOnSubmit && scroll == null) || scroll) && !result){
			var failed = document.id(this).getElement('.validation-failed');
			var par = document.id(this).getParent();
			while (par != document.body && par.getScrollSize().y == par.getSize().y){
				par = par.getParent();
			}
			var fx = par.retrieve('$moo:fvScroller');
			if (!fx && window.Fx && Fx.Scroll){
				fx = new Fx.Scroll(par, this.options.scrollFxOptions);
				par.store('$moo:fvScroller', fx);
			}
			if (failed){
				if (fx) fx.toElement(failed);
				else par.scrollTo(par.getScroll().x, failed.getPosition(par).y - 20);
			}
		}
		return result;
	},

	watchFields: function(fields){
		fields.each(function(el){
		if (this.options.evaluateFieldsOnBlur){
			el.addEvent('blur', this.validationMonitor.pass([el, false, this.options.scrollToErrorsOnBlur], this));
		}
		if (this.options.evaluateFieldsOnChange){
				el.addEvent('change', this.validationMonitor.pass([el, true, this.options.scrollToErrorsOnChange], this));
			}
		}, this);
	}

});

/*
---

script: Fx.Scroll.js

name: Fx.Scroll

description: Effect to smoothly scroll any element, including the window.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Fx
  - Core/Element.Event
  - Core/Element.Dimensions
  - MooTools.More

provides: [Fx.Scroll]

...
*/

(function(){

Fx.Scroll = new Class({

	Extends: Fx,

	options: {
		offset: {x: 0, y: 0},
		wheelStops: true
	},

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);

		if (typeOf(this.element) != 'element') this.element = document.id(this.element.getDocument().body);

		if (this.options.wheelStops){
			var stopper = this.element,
				cancel = this.cancel.pass(false, this);
			this.addEvent('start', function(){
				stopper.addEvent('mousewheel', cancel);
			}, true);
			this.addEvent('complete', function(){
				stopper.removeEvent('mousewheel', cancel);
			}, true);
		}
	},

	set: function(){
		var now = Array.flatten(arguments);
		this.element.scrollTo(now[0], now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if (!this.check(x, y)) return this;
		var scroll = this.element.getScroll();
		return this.parent([scroll.x, scroll.y], [x, y]);
	},

	calculateScroll: function(x, y){
		var element = this.element,
			scrollSize = element.getScrollSize(),
			scroll = element.getScroll(),
			size = element.getSize(),
			offset = this.options.offset,
			values = {x: x, y: y};

		for (var z in values){
			if (!values[z] && values[z] !== 0) values[z] = scroll[z];
			if (typeOf(values[z]) != 'number') values[z] = scrollSize[z] - size[z];
			values[z] += offset[z];
		}

		return [values.x, values.y];
	},

	toTop: function(){
		return this.start.apply(this, this.calculateScroll(false, 0));
	},

	toLeft: function(){
		return this.start.apply(this, this.calculateScroll(0, false));
	},

	toRight: function(){
		return this.start.apply(this, this.calculateScroll('right', false));
	},

	toBottom: function(){
		return this.start.apply(this, this.calculateScroll(false, 'bottom'));
	},

	toElement: function(el, axes){
		axes = axes ? Array.from(axes) : ['x', 'y'];
		var scroll = isBody(this.element) ? {x: 0, y: 0} : this.element.getScroll();
		var position = Object.map(document.id(el).getPosition(this.element), function(value, axis){
			return axes.contains(axis) ? value + scroll[axis] : false;
		});
		return this.start.apply(this, this.calculateScroll(position.x, position.y));
	},

	toElementEdge: function(el, axes, offset){
		axes = axes ? Array.from(axes) : ['x', 'y'];
		el = document.id(el);
		var to = {},
			position = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize(),
			edge = {
				x: position.x + size.x,
				y: position.y + size.y
			};

		['x', 'y'].each(function(axis){
			if (axes.contains(axis)){
				if (edge[axis] > scroll[axis] + containerSize[axis]) to[axis] = edge[axis] - containerSize[axis];
				if (position[axis] < scroll[axis]) to[axis] = position[axis];
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	},

	toElementCenter: function(el, axes, offset){
		axes = axes ? Array.from(axes) : ['x', 'y'];
		el = document.id(el);
		var to = {},
			position = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize();

		['x', 'y'].each(function(axis){
			if (axes.contains(axis)){
				to[axis] = position[axis] - (containerSize[axis] - size[axis]) / 2;
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	}

});

//<1.2compat>
Fx.Scroll.implement({
	scrollToCenter: function(){
		return this.toElementCenter.apply(this, arguments);
	},
	scrollIntoView: function(){
		return this.toElementEdge.apply(this, arguments);
	}
});
//</1.2compat>

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
}

})();

/*
---
description: Adds an instance of Form.Validator.Inline to any form with the class .form-validator.
provides: [Behavior.FormValidator]
requires: [Behavior/Behavior, More/Form.Validator.Inline, More/Object.Extras, More/Fx.Scroll]
script: Behavior.FormValidator.js
name: Behavior.FormValidator
...
*/

Behavior.addGlobalFilter('FormValidator', {

  defaults: {
    useTitles: true,
    scrollToErrorsOnSubmit: true,
    scrollToErrorsOnBlur: false,
    scrollToErrorsOnChange: false,
    ignoreHidden: true,
    ignoreDisabled: true,
    evaluateOnSubmit: true,
    evaluateFieldsOnBlur: true,
    evaluateFieldsOnChange: true,
    serial: true,
    stopOnFailure: true
  },

  returns: Form.Validator.Inline,

  setup: function(element, api){
    //instantiate the form validator
    var validator = element.retrieve('validator');
    if (!validator){
      validator = new Form.Validator.Inline(element,
        Object.cleanValues(
          api.getAs({
            useTitles: Boolean,
            scrollToErrorsOnSubmit: Boolean,
            scrollToErrorsOnBlur: Boolean,
            scrollToErrorsOnChange: Boolean,
            ignoreHidden: Boolean,
            ignoreDisabled: Boolean,
            evaluateOnSubmit: Boolean,
            evaluateFieldsOnBlur: Boolean,
            evaluateFieldsOnChange: Boolean,
            serial: Boolean,
            stopOnFailure: Boolean
          })
        )
      );
    }
    //if the api provides a getScroller method, which should return an instance of
    //Fx.Scroll, use it instead
    if (api.getScroller){
      validator.setOptions({
        scrollToErrorsOnSubmit: false
      });
      validator.addEvent('showAdvice', function(input, advice, className){
        api.getScroller().toElement(input, ['y']);
      });
    }
    api.onCleanup(function(){
      validator.stop();
    });
    return validator;
  }

});
/*
---

name: Behavior.BS.FormValidator

description: Integrates FormValidator behavior into Bootstrap.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - More/Fx.Reveal
 - Behavior.FormValidator

provides: [Behavior.BS.FormValidator]

...
*/

(function(){

  var getFieldDetails = function(field, advice, className){
    var cls = field.hasClass('warning') || field.hasClass('warn-' + className) ? 'has-warning' : 'has-error',
        inputParent = field.getParent('.form-group');
    var clearfixParent;
    if (inputParent){
      if (inputParent.hasClass('form-group')) clearfixParent = inputParent;
      else clearfixParent = inputParent.getParent('.form-group');
    }

    return {
      cls: cls,
      inputParent: inputParent,
      clearfixParent: clearfixParent
    };
  };

  Behavior.addGlobalPlugin("FormValidator", "BS.FormValidator", {
    setup: function(element, api, instance){
      var original = {
        showError: instance.options.showError,
        hideError: instance.options.hideError
      };
      instance.setOptions({
        showError: function(){},
        hideError: function(){}
      });
      instance.errorPrefix = '';
      instance.addEvents({
        showAdvice: function(field, advice, className){
          var fieldDetails = getFieldDetails(field, advice, className);
          if (!fieldDetails.inputParent || !fieldDetails.clearfixParent){
            original.showError(advice);
          } else {
            field.addClass(fieldDetails.cls);
            var help = fieldDetails.inputParent.getElement('div.advice');
            if (!help){
              fieldDetails.inputParent.getElements('span.help-block').setStyle('display', 'none');
              var closestParent = field.getParent();
              help = new Element('span.help-block.advice.auto-created', {
                html: (field.hasClass('warning') ? 'Suggestion: ' : '') + advice.get('html')
              }).hide().inject(closestParent.hasClass('input-append') ? closestParent  : field, 'after');
            }
            help.set('html', (field.hasClass('warning') ? 'Suggestion: ' : '') + advice.get('html')).reveal();
            help.removeClass('hide');
            help.set('title', advice.get('html'));
            fieldDetails.clearfixParent.addClass(fieldDetails.cls);
          }
        },
        hideAdvice: function(field, advice, className){
          var fieldDetails = getFieldDetails(field, advice, className);
          if (!fieldDetails.inputParent || !fieldDetails.clearfixParent){
            original.hideError(advice);
          } else {
            field.removeClass(fieldDetails.cls);
            var help = fieldDetails.inputParent.getElement('.advice');
            fieldDetails.inputParent.getElements('.help-block').dissolve().getLast().get('reveal').chain(function(){
              if (help.hasClass('auto-created')) help.destroy();
              else help.set('html', '');
            });
            fieldDetails.clearfixParent.removeClass(fieldDetails.cls);
          }
        }
      });
    }
  });

})();

/*
---

name: CSSEvents

description: Feature detection for css transition complete event names.

license: MIT-style

authors: [Aaron Newton]

requires: [Core/DomReady]

provides: CSSEvents
...
*/

Browser.Features.getCSSTransition = function(){
  Browser.Features.transitionEnd = (function(){
    var el = document.createElement('tmp');

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd'
    , 'MozTransition'    : 'transitionend'
    , 'OTransition'      : 'oTransitionEnd otransitionend'
    , 'transition'       : 'transitionend'
    };

    for (var name in transEndEventNames){
      if (el.style[name] !== undefined){
        return transEndEventNames[name];
      }
    }
  })();
  Browser.Features.cssTransition = !!Browser.Features.transitionEnd;

  Browser.Features.getCSSTransition = Function.from(Browser.Features.transitionEnd);
  return Browser.Features.transitionEnd;
};

window.addEvent("domready", Browser.Features.getCSSTransition);
/*
---

name: Bootstrap.Tooltip

description: A simple tooltip implementation that works with the Twitter Bootstrap css framework.

authors: [Aaron Newton]

license: MIT-style license.

requires:
 - More/Element.Position
 - More/Element.Shortcuts
 - Bootstrap
 - CSSEvents

provides: [Bootstrap.Tooltip]

...
*/

Bootstrap.Tooltip = new Class({

  Implements: [Options, Events],

  options: {
    location: 'above', //below, left, right, bottom, top
    animate: true,
    delayIn: 200,
    delayOut: 0,
    fallback: '',
    override: '',
    onOverflow: false,
    offset: 0,
    title: 'title', //element property
    trigger: 'hover', //focus, manual
    getContent: function(el){
      return el.get(this.options.title);
    },
    inject: {
      target: null, //defaults to document.body,
      where: 'bottom'
    }
  },

  initialize: function(el, options){
    this.element = document.id(el);
    this.setOptions(options);
    var location = this.options.location;
    if (location == 'above') this.options.location = 'top';    //bootstrap 2.0
    if (location == 'below') this.options.location = 'bottom'; //bootstrap 2.0
    this._attach();
  },

  show: function(){
    this._clear();
    this._makeTip();
    var pos, edge, offset = {x: 0, y: 0};
    switch(this.options.location){
      case 'below': case 'bottom':
        pos = 'centerBottom';
        edge = 'centerTop';
        offset.y = this.options.offset;
        break;
      case 'left':
        pos = 'centerLeft';
        edge = 'centerRight';
        offset.x = this.options.offset;
        break;
      case 'right':
        pos = 'centerRight';
        edge = 'centerLeft';
        offset.x = this.options.offset;
        break;
      default: //top
        pos = 'centerTop';
        edge = 'centerBottom';
        offset.y = this.options.offset;
    }
    if (typeOf(this.options.offset) == "object") offset = this.options.offset;
    if (this.element.getParent('.modal')) this.tip.inject(this.element, 'after');
    else this.tip.inject(this.options.inject.target || document.body, this.options.inject.where);
    this.tip.show().position({
      relativeTo: this.element,
      position: pos,
      edge: edge,
      offset: offset
    }).removeClass('out').addClass('in');
    this.visible = true;
    if (!Browser.Features.cssTransition || !this.options.animate) this._complete();
    this.fireEvent('show');
    return this;
  },

  hide: function(){
    this._makeTip();
    this.tip.removeClass('in').addClass('out');
    this.visible = false;
    if (!Browser.Features.cssTransition || !this.options.animate) this._complete();
    this.fireEvent('hide');
    return this;
  },

  destroy: function(){
    this._detach();
    if (this.tip) this.tip.destroy();
    this.destroyed = true;
    return this;
  },

  toggle: function(){
    return this[this.visible ? 'hide' : 'show']();
  },

  // PRIVATE METHODS

  _makeTip: function(){
    if (!this.tip){
      var location = this.options.location;
      if (location == 'above') location = 'top';    //bootstrap 2.0
      if (location == 'below') location = 'bottom'; //bootstrap 2.0
      this.tip = new Element('div.tooltip').addClass(location)
         .adopt(new Element('div.tooltip-arrow'))
         .adopt(
           new Element('div.tooltip-inner', {
             html: this.options.override || this.options.getContent.apply(this, [this.element]) || this.options.fallback
           })
         );
      if (this.options.animate) this.tip.addClass('fade');
      if (Browser.Features.cssTransition && this.tip.addEventListener){
        this.tip.addEventListener(Browser.Features.transitionEnd, this.bound.complete);
      }
      this.element.set('alt', '').set('title', '');
    }
    return this.tip;
  },

  _attach: function(method){
    method = method || 'addEvents';
    if ( ! this.bound) this.bound = {
      enter: this._enter.bind(this),
      leave: this._leave.bind(this),
      complete: this._complete.bind(this),
      toggle: this.toggle.bind(this)
    };

    if (this.options.trigger == 'hover'){
      this.element[method]({
        mouseenter: this.bound.enter,
        mouseleave: this.bound.leave
      });
    } else if (this.options.trigger == 'focus'){
      this.element[method]({
        focus: this.bound.enter,
        blur: this.bound.leave
      });
    } else if (this.options.trigger == 'click'){
      this.element[method]({
        click: this.bound.toggle
      });
    }
  },

  _detach: function(){
    this._attach('removeEvents');
  },

  _clear: function(){
    clearTimeout(this._inDelay);
    clearTimeout(this._outDelay);
  },

  _enter: function(){
    if (this.options.onOverflow){
      var scroll = this.element.getScrollSize(),
          size = this.element.getSize();
      if (scroll.x <= size.x && scroll.y <= size.y) return;
    }
    this._clear();
    if (this.options.delayIn){
      this._inDelay = this.show.delay(this.options.delayIn, this);
    } else {
      this.show();
    }
  },

  _leave: function(){
    this._clear();
    if (this.options.delayOut){
      this._outDelay = this.hide.delay(this.options.delayOut, this);
    } else {
      this.hide();
    }
  },

  _complete: function(){
    if (!this.visible){
      this.tip.dispose();
    }
    this.fireEvent('complete', this.visible);
  }

});
/*
---

name: Bootstrap.Form.Validator.Tips

description: Form Validation with Bootstrap Tips

requires:
 - More/Form.Validator.Inline
 - Bootstrap.Tooltip

provides: [Bootstrap.Form.Validator.Tips]

...
*/

Bootstrap.Form = Bootstrap.Form || {};
Bootstrap.Form.Validator = Bootstrap.Form.Validator || {};
Bootstrap.Form.Validator.Tips = new Class({
  Extends: Form.Validator.Inline,
  options: {
    serial: true,
    tooltipOptions: {
      location: 'right'
    }
  },
  showAdvice: function(className, field){
    // getAdvice returns the tooltip instance
    var advice = this.getAdvice(field);
    // show it
    if (advice) advice.show();
    this.fireEvent('showAdvice', [field, advice, className]);
  },
  hideAdvice: function(className, field){
    // getAdvice returns the tooltip instance
    var advice = this.getAdvice(field);
    // assuming it's been built and the message for the specified className is present
    if (advice && advice.visible && advice.msgs && advice.msgs[className]){
      // hide that specific message
      advice.msgs[className].hide();
      // check if any visible messages remain and, if not, hide the tip
      if (!Object.some(advice.msgs, function(el){ return el.isVisible(); })) advice.hide();
      this.fireEvent('hideAdvice', [field, advice, className]);
    }
  },
  // returns the tooltip
  getAdvice: function(className, field){
    // the arguments to this method are mutable, sometimes just one, the other, or both, so
    // we get the element by type
    var params = Array.link(arguments, {field: Type.isElement});
    // retrieve the tooltip instance
    return params.field.retrieve('Bootstrap.Tooltip');
  },
  advices: [],
  makeAdvice: function(className, field, error, warn){
    // if we aren't in an error state, just exit
    if (!error && !warn) return;
    // get the tooltip
    var advice = field.retrieve('Bootstrap.Tooltip');
    // no tooltip? let's create
    if (!advice){
      // a list item to hold messages
      var msg = new Element('ul', {
        styles: {
          margin: 0,
          padding: 0,
          listStyle: 'none'
        }
      });
      // make advice for this specific message and put into our list
      var li = this.makeAdviceItem(className, field);
      if (li) msg.adopt(li);
      // store our list element
      field.store('validationMsgs', msg);

      // get the offset per input
      var offset = field.get('data-tip-offset');
      if (offset){
        if (Number.from(offset)){
          offset = Number.from(offset);
        } else {
          if (offset.substring(0,1) != '{') offset = '{' + offset + '}';
          offset = JSON.decode(offset);
        }
      }

      // store the title in case we're using titles in the options
      field.store('title', field.get('title'));

      var tipTarget = this.options.tooltipOptions.inject ?
                      this.options.tooltipOptions.inject.target || this.getScrollParent(this.element) :
                      this.getScrollParent(this.element);

      // our instance of Bootstrap.Tooltip
      advice = new Bootstrap.Tooltip(field,
        Object.merge({}, this.options.tooltipOptions, {
          inject: {
            target: tipTarget
          },
          // don't show on mouseover, only when we invoke .show
          trigger: 'manual',
          location: field.get('data-tip-location') || this.options.tooltipOptions.location,
          offset: offset,
          getContent: function(){
            return '';
          }
        })
      );
      // we need the class to create its DOM elements now, even if we aren't ready to show
      advice._makeTip();
      // so we can put our messages holder in it
      advice.tip.getElement('.tooltip-inner').adopt(msg);
      advice.tip.addClass('validation-tooltip');
      if (this.options.extraClass) advice.tip.addClass(this.options.extraClass);
      // store our tooltip instance
      this.advices.push(advice);
      // placeholder for specific validation messages per popup
      advice.msgs = {};
      // store our tooltip instance on the field
      field.store('Bootstrap.Tooltip', advice);
    }
    // this is a convention from the parent class
    field.store('advice-'+className, advice);
    // now we insert our validation message
    this.appendAdvice(className, field, error, warn);
    // show the tooltip
    advice.show();
    return advice;
  },
  validateField: function(field, force){
    // get the popup
    var advice = this.getAdvice(field);
    // are any visible?
    var anyVis = this.advices.some(function(a){ return a.visible; });
    // if any are and options.serial is true
    if (anyVis && this.options.serial && advice){
      // then we only want to run validations on this field
      // if this is the one that's got a message visible already
      var passed;
      if (advice && advice.visible){
        passed = this.parent(field, force);
        // otherwise we force hide the tip
        if (!field.hasClass('validation-failed')) advice.hide();
      }
      // and exit
      return passed;
    }
    // get the messages for the field
    var msgs = field.retrieve('validationMsgs');
    // hide all the messages in it (the list items)
    if (msgs) msgs.getChildren().hide();
    // if the field has an error state, show the advice
    if ((field.hasClass('validation-failed') || field.hasClass('warning')) && advice) advice.show();
    // if we're doing the serial thing
    if (this.options.serial){
      // get any other fields that have an error state
      var fields = this.element.getElements('.validation-failed, .warning');
      if (fields.length){
        // and ensure their tooltips are not visible
        fields.each(function(f){
          var adv = this.getAdvice(f);
          if (adv) adv.hide();
        }, this);
      }
    }
    return this.parent(field, force);
  },
  getScrollParent: function(element){
    var par = element.getParent();
    while (par != document.body && par.getScrollSize().y == par.getSize().y){
      par = par.getParent();
    }
    return par;
  },
  makeAdviceItem: function(className, field, error, warn){
    // if there's no error, there's no advice
    if (!error && !warn) return;
    // get the tooltip
    var advice = this.getAdvice(field);
    // get the message
    var errorMsg = this.makeAdviceMsg(field, error, warn);
    // if there's already an element for this validator, just update it and return it
    // if we're using titles, we only create one validation message (with the title of the input)
    // so use 'title' for the key for all inputs.
    if (this.options.useTitles) className = 'title';
    if (advice && advice.msgs[className]) return advice.msgs[className].set('html', errorMsg);
    // otherwise create a new one and return it
    var li = new Element('li', {
      html: errorMsg,
      style: {
        display: 'none'
      }
    });
    // store the reference
    advice.msgs[className] = li;
    return li;
  },
  makeAdviceMsg: function(field, error, warn){
    // get our prefix, append our message using the element title if that option is set or the error message
    // returned from the validator
    var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
      errorMsg += (this.options.useTitles) ? field.retrieve('title') || error : error;
    return errorMsg;
  },
  appendAdvice: function(className, field, error, warn){
    // get our tooltip
    var advice = this.getAdvice(field);
    // if there's a DOM element for this validator, update it and show it
    if (advice.msgs[className]) return advice.msgs[className].set('html', this.makeAdviceMsg(field, error, warn)).show();
    // otherwise make a new one
    var li = this.makeAdviceItem(className, field, error, warn);
    // if there wasn't anything returned (i.e. no error state) exit
    if (!li) return;
    // otherwise inject the list item into the UL and show it
    li.inject(field.retrieve('validationMsgs')).show();
  },
  // the tooltip has its own insertion logic invoked when you call .show, so we turn this method into a stub
  insertAdvice: function(advice, field){}
});
/*
---
name: Behavior.FormValidator.BS.Tips

description: Instantiates an instance of Bootstrap.Form.Validator.Tips

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Bootstrap.Form.Validator.Tips

provides: [Behavior.FormValidator.BS.Tips]
...
*/

Behavior.addGlobalFilter('FormValidator.BS.Tips', {
  defaults: {
    scrollToErrorsOnSubmit: true,
    scrollToErrorsOnBlur: false,
    scrollToErrorsOnChange: false,
    ignoreHidden: true,
    ignoreDisabled: true,
    useTitles: false,
    evaluateOnSubmit: true,
    evaluateFieldsOnBlur: true,
    evaluateFieldsOnChange: true,
    serial: true,
    stopOnFailure: true,
    errorPrefix: '',
    warningPrefix: ''
  },
  setup: function(element, api){
    //instantiate the form validator
    var validator = element.retrieve('validator');
    if (!validator){

      var options = Object.cleanValues(
        api.getAs({
          useTitles: Boolean,
          scrollToErrorsOnSubmit: Boolean,
          scrollToErrorsOnBlur: Boolean,
          scrollToErrorsOnChange: Boolean,
          ignoreHidden: Boolean,
          ignoreDisabled: Boolean,
          evaluateOnSubmit: Boolean,
          evaluateFieldsOnBlur: Boolean,
          evaluateFieldsOnChange: Boolean,
          serial: Boolean,
          stopOnFailure: Boolean,
          warningPrefix: String,
          errorPrefix: String,
          tooltipOptions: Object,
          extraClass: String
        })
      );

      if (options.tooltipOptions && options.tooltipOptions.inject && options.tooltipOptions.inject.target){
        options.tooltipOptions.inject.target = element.getElement(options.tooltipOptions.inject.target);
      }

      validator = new Bootstrap.Form.Validator.Tips(element, options);
    }
    //if the api provides a getScroller method, which should return an instance of
    //Fx.Scroll, use it instead
    if ((
        api.get('scrollToErrorsOnSubmit') ||
        api.get('scrollToErrorsOnBlur') ||
        api.get('scrollToErrorsOnChange')
      ) && api.getScroller){
      validator.setOptions({
        scrollToErrorsOnSubmit: false
      });
      validator.addEvent('showAdvice', function(input){
        api.getScroller().toElement(input, ['y']).chain(function(){
          validator.advices.each(function(a){
            if (a.visible) a.show(); //reposition the tooltip after we scroll
          });
        });
      });
    }
    api.onCleanup(function(){
      validator.stop();
    });
    return validator;
  }

});
/*
---

name: Behavior.OnFormValidate

description: When a form is valid, invokes a method.

requires:
 - Behavior/Behavior
 - Behavior/Delegator.verifyTargets

provides: [Behavior.OnFormValidate]

...
*/


/*

  <button data-behavior="OnFormValidate" data-onformvalidate-options="
    'checkOnStart': true,
    'onSuccess': [{
      method: 'addClass',
      arguments: ['bar']
    }],
    'onError': [{
      method: 'addClass',
      args: ['baz']
    }]
  ">


*/

Behavior.addGlobalFilter('OnFormValidate', {
  defaults: {
    checkOnStart: true
  },
  setup: function(element, api){
    var checking;
    // get the form to monitor
    var form = api.get('target') ? api.getElement('target') : element.getParent('form');
    if (!form || !form.retrieve('validator')) api.fail('Could not find form or form validator instance for element');
    // fetch it's validator
    var validator = form.retrieve('validator');

    // method to check the state of the form and then invoke the proper handler
    var check = function(){
      checking = true;
      // if there are any elements that have failed, the form is invalid.
      var valid = !form.getElements('.validation-failed').length;
      // otherwise, go check all the inputs and immediately hide any messages that might otherwise display
      if (valid){
        valid = validator.validate();
        validator.reset();
      }
      // get the appropriate action set
      var action;
      if (valid && api.get('onSuccess')) action = 'onSuccess';
      else if (api.get('onError')) action = 'onError';

      // invoke the method described
      if (action){
        var actions = api.getAs(Array, action);
        actions.each(function(obj){
          element[obj['method']].apply(element, obj['args']);
        });
      }
      checking = false;
    };


    validator.addEvent('onElementValidate', function(){
      if (!checking) check.delay(100);
    });
    if (api.get('checkOnStart')) check();
    // for lack of a better thing to return, return the validator
    return validator;
  }
});


/*
---

name: MobileMenu

description: Reveals a dropdown menu, provides 'tap outside to close' functionality

requires:
 - Core/Element.Delegation
 - More/Fx.Reveal

provides: [MobileMenu]

...
*/

var MobileMenu = new Class({

  Implements: [Options],

  options: {
    zIndex: 500,
    revealClass: 'reveal'
  },

  initialize: function(button, target, options){
    this.button = button;
    this.target = target;
    this.setOptions(options);
    this.target.setStyle('z-index', this.options.zIndex);
    this.createMask();
    this.attach();
  },

  revealed: false,

  attach: function(_detach){
    if (!this.boundEvents){
      this.boundEvents = {
        toggle: this.toggle.bind(this),
        hide: this.hide.bind(this)
      };
    }
    var method = _detach ? 'removeEvent' : 'addEvent';
    this.button[method]('click', this.boundEvents.toggle);
    if (this.mask) this.mask[method]('click', this.boundEvents.hide);
    // when clicking on a link within the target (the menu), hide the menu
    // this is helpful for the case that the link goes to an anchor on the current page
    this.target[method]('click:relay(a)', this.boundEvents.hide);
  },

  detach: function(){
    this.attach(true);
  },

  createMask: function(){
    this.mask = MobileMenu.mask;
    if (!this.mask || !document.body.hasChild(this.mask)){
      this.mask = MobileMenu.mask = new Element('div', {
        styles: {
          position: 'fixed',
          top: '0',
          height: '100%',
          width: '100%',
          'z-index': this.options.zIndex - 1,
          display: 'none'
        }
      });
      this.mask.inject(this.target, 'after');
    }
  },

  hide: function(){
    this.target.removeClass(this.options.revealClass);
    if (this.mask) this.mask.setStyle('display', 'none');
    this.revealed = false;
  },

  reveal: function(){
    this.target.addClass(this.options.revealClass);
    this.target.mask();
    if (this.mask) this.mask.setStyle('display', 'block');
    this.revealed = true;
  },

  toggle: function(){
    this[this.revealed ? 'hide' : 'reveal']();
  }
});
/*
---

name: Behavior.MobileMenu

description: Behavior for adding a mobile menu

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - MobileMenu

provides: [Behavior.MobileMenu]

...
*/

Behavior.addGlobalFilter('MobileMenu', {

  defaults: {
    target: '.mobile-nav'
  },

  returns: MobileMenu,

  setup: function(element, api){
    var target = $$(api.get('target'))[0];
    if (!element) api.fail('Could not find the button for MobileMenu');
    if (!target) api.fail('Could not find the target (the menu itself) for MobileMenu');

    var mm = new MobileMenu(element, target, Object.cleanValues(
        api.getAs({
          zIndex: Number,
          revealClass: String
        })
      )
    );

    api.onCleanup(mm.detach.bind(mm));

    return mm;
  }
});
/*
---

name: Bootstrap.Popover

description: A simple tooltip (yet larger than Bootstrap.Tooltip) implementation that works with the Twitter Bootstrap css framework.

authors: [Aaron Newton]

license: MIT-style license.

requires:
 - Bootstrap.Tooltip

provides: Bootstrap.Popover

...
*/

Bootstrap.Popover = new Class({

  Extends: Bootstrap.Tooltip,

  options: {
    // cssClass: '',
    // arrowClass: '',
    location: 'right',
    offset: Bootstrap.version == 2 ? 10 : 0,
    getTitle: function(el){
      return el.get(this.options.title);
    },
    content: 'data-content',
    getContent: function(el){
      return el.get(this.options.content);
    },
    closeOnClickOut: true
  },

  _makeTip: function(){
    if (!this.tip){
      var title = this.options.getTitle.apply(this, [this.element]) || this.options.fallback;
      var content = this.options.getContent.apply(this, [this.element]);

      var inner = new Element('div.popover-inner');


      if (title){
        var titleWrapper = new Element('h3.popover-title');
        if (typeOf(title) == "element") titleWrapper.adopt(title);
        else titleWrapper.set('html', title);
        inner.adopt(titleWrapper);
      } else {
        inner.addClass('no-title');
      }

      if (typeOf(content) != "element") content = new Element('p', { html: content});
      inner.adopt(new Element('div.popover-content').adopt(content));
      var arrow = new Element('div.arrow');
      this.tip = new Element('div.popover').addClass(this.options.location)
         .adopt(arrow)
         .adopt(inner);
      if (this.options.cssClass) this.tip.addClass(this.options.cssClass);
      if (this.options.arrowClass) arrow.addClass(this.options.arrowClass);
      if (this.options.animate) this.tip.addClass('fade');
      if (Browser.Features.cssTransition && this.tip.addEventListener){
        this.tip.addEventListener(Browser.Features.transitionEnd, this.bound.complete);
      }
      this.element.set('alt', '').set('title', '');
    }
    return this.tip;
  },

  _attach: function(method){
    this.parent.apply(this, arguments);
    // add close on click out support
    if (this.options.closeOnClickOut){
      this.bound.closeOnClickOut = this.bound.closeOnClickOut || this._closeOnClickOut.bind(this);
      this.bound.closeOnClickOutMonitors = this.bound.closeOnClickOutMonitors || {
        // when the tip is shown, we monitor the document body for clicks "out" to close the tip
        show: function(){
          (function(){
            document.body.addEvent('click', this.bound.closeOnClickOut);
          }).delay(1, this);
        }.bind(this),
        // when the tip is hidden, we remove our monitor
        hide: function(){
          (function(){
            document.body.removeEvent('click', this.bound.closeOnClickOut);
          }).delay(1, this);
        }.bind(this)
      };
      this[method || 'addEvents'](this.bound.closeOnClickOutMonitors);
    }
  },

  // when the user clicks an element that isn't the tip or isn't in the tip, hide it
  _closeOnClickOut: function(e){
    if (this.visible && e.target != this.tip && !this.tip.hasChild(e.target)) this.hide();
  }

});
/*
---

name: Behavior.BS.Popover

description: Instantiates Bootstrap.Popover based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - More/Object.Extras
 - Behavior/Behavior
 - Bootstrap.Popover

provides: [Behavior.BS.Popover]

...
*/
Behavior.addGlobalFilters({
  'BS.Popover': {

    defaults: {
      contentElement: null,
      cloneContent: false,
      titleElement: null,
      cloneTitle: false,
      onOverflow: false,
      location: 'right', //below, left, right
      animate: true,
      delayIn: 200,
      delayOut: 0,
      offset: Bootstrap.version == 2 ? 10 : null,
      trigger: 'hover' //focus, manual
    },

    delayUntil: 'mouseover,focus',

    returns: Bootstrap.Popover,

    setup: function(el, api){
      var options = Object.cleanValues(
        api.getAs({
          onOverflow: Boolean,
          location: String,
          animate: Boolean,
          delayIn: Number,
          delayOut: Number,
          html: Boolean,
          offset: Number,
          trigger: String,
          cssClass: String,
          arrowClass: String,
          closeOnClickOut: Boolean
        })
      );
      if (options.offset === undefined && (['above', 'left', 'top'].contains(options.location) || !options.location)){
        options.offset = -6;
      }

      var getter = function(which){
        if (api.get(which + 'Element')){
          var target = el.getElement(api.get(which + 'Element'));
          if (!target) api.fail('could not find ' + which + ' for popup');
          if (api.get('clone' + which.capitalize())) target = target.clone(true, true);
          return target.setStyle('display', 'block');
        } else {
          return api.get(which) || el.get(which);
        }
      };

      options.getContent = getter.pass('content');
      options.getTitle = getter.pass('title');

      var tip = new Bootstrap.Popover(el, options);
      if (api.event && api.get('trigger') != 'click') tip._enter();
      api.onCleanup(tip.destroy.bind(tip));
      return tip;
    }
  }
});
/*
---
description: Makes form elements with a FormRequest data filter automatically update via Ajax.
provides: [Behavior.FormRequest]
requires: [Behavior/Behavior, More/Form.Request]
script: Behavior.FormRequest.js
name: Behavior.FormRequest
...
*/

Behavior.addGlobalFilter('FormRequest', {

  defaults: {
    resetForm: true
  },

  returns: Form.Request,

  setup: function(element, api){
    var updateElement,
        update = api.get('update'),
        spinner = api.get('spinner');
    if (update =="self") updateElement = element;
    else updateElement = element.getElement(update);

    if (spinner == "self") spinner = element;
    else if (spinner) spinner = element.getElement(spinner);
    else spinner = updateElement;

    if (!updateElement) api.fail('Could not find target element for form update');
    var sentAt;
    var req = new Form.Request(element, updateElement, {
      requestOptions: {
        filter: api.get('filter'),
        spinnerTarget: spinner
      },
      resetForm: api.get('resetForm')
    }).addEvent('complete', function(){
      api.applyFilters(updateElement);
    }).addEvent('send', function(){
      sentAt = new Date().getTime();
    });
    // this bit below is to throttle form submission in case more than one thing
    // is trying to send it

    // remove form.request submit watcher
    element.removeEvent('submit', req.onSubmit);
    // our new submit handler checks that requests to submit are at least 200ms apart
    var submit = function(e){
      if (!sentAt || sentAt + 200 < new Date().getTime()){
        req.onSubmit(e);
      } else {
        // if they aren't, just stop the submit event if it's present
        if (e) e.stop();
      }
    };
    // now monitor submit with our new method
    element.addEvent('submit', submit);
    // and overwrite the submit method on the element
    element.submit = submit;
    api.onCleanup(function(){
      req.detach();
      delete element.submit;
    });
    return req;
  }

});

/*
---

name: Fx.Transitions

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits:
  - Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires: Fx

provides: Fx.Transitions

...
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = Array.from(params);
	var easeIn = function(pos){
		return transition(pos, params);
	};
	return Object.append(easeIn, {
		easeIn: easeIn,
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5 ? transition(2 * pos, params) : (2 - transition(2 * (1 - pos), params))) / 2;
		}
	});
};

Fx.Transitions = {

	linear: function(zero){
		return zero;
	}

};

//<1.2compat>

Fx.Transitions = new Hash(Fx.Transitions);

//</1.2compat>

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x && x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.cos(p * Math.PI / 2);
	},

	Back: function(p, x){
		x = x && x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x && x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, i + 2);
	});
});

/*
---

name: Popup

description: A simple Popup class for the Twitter Bootstrap CSS framework.

authors: [Aaron Newton]

license: MIT-style license.

requires:
 - Core/Element.Delegation
 - Core/Fx.Tween
 - Core/Fx.Transitions
 - More/Mask
 - More/Element.Shortcuts
 - CSSEvents
 - Bootstrap

provides: [Bootstrap.Popup]

...
*/

Bootstrap.Popup = new Class({

  Implements: [Options, Events],

  options: {
    /*
      onShow: function(){},
      onHide: function(){},
      animate: function(){},
      destroy: function(){},
    */
    persist: true,
    closeOnClickOut: true,
    closeOnEsc: true,
    mask: true,
    animate: true,
    changeDisplayValue: true
  },

  initialize: function(element, options){
    this.element = document.id(element).store('Bootstrap.Popup', this);
    this.setOptions(options);
    this.bound = {
      hide: this.hide.bind(this),
      bodyClick: function(e){
        if (Bootstrap.version == 2){
          if (!this.element.contains(e.target)) this.hide();
        } else {
          if (!e.target.getParent('.modal-content')) this.hide();
        }
      }.bind(this),
      keyMonitor: function(e){
        if (e.key == 'esc') this.hide();
      }.bind(this),
      animationEnd: this._animationEnd.bind(this)
    };

    var showNow = false;
    if ((this.element.hasClass('fade') && this.element.hasClass('in')) ||
        (!this.element.hasClass('hide') && !this.element.hasClass('hidden') && !this.element.hasClass('fade'))){
      if (this.element.hasClass('fade')) this.element.removeClass('in');
      showNow = true;
    }

    this._checkAnimate();

    if (showNow) this.show();

    if (Bootstrap.version > 2){
      if (this.options.closeOnClickOut){
        this.element.addEvent('click', this.bound.bodyClick);
      }
    }
  },

  toElement: function(){
    return this.element;
  },

  _checkAnimate: function(){
    this._canAnimate = this.options.animate !== false && Browser.Features.getCSSTransition() && (this.options.animate || this.element.hasClass('fade'));
    if (!this._canAnimate){
      this.element.removeClass('fade').addClass('hidden');
      if (this._mask) this._mask.removeClass('fade').addClass('hidden');
    } else if (this._canAnimate){
      this.element.addClass('fade');
      if (Bootstrap.version >= 3) this.element.removeClass('hide').removeClass('hidden');
      if (this._mask){
        this._mask.addClass('fade');
        if (Bootstrap.version >= 3) this._mask.removeClass('hide').removeClass('hidden');
      }
    }
  },

  show: function(){
    if (this.visible || this.animating) return;
    this.element.addEvent('click:relay(.close, .dismiss, [data-dismiss=modal])', this.bound.hide);
    if (this.options.closeOnEsc) document.addEvent('keyup', this.bound.keyMonitor);
    this._makeMask();
    if (this._mask) this._mask.inject(document.body);
    this.animating = true;
    if (this.options.changeDisplayValue) this.element.show();
    if (this._canAnimate){
      this.element.offsetWidth; // force reflow
      this.element.addClass('in');
      if (this._mask) this._mask.addClass('in');
    } else {
      this.element.removeClass('hide').removeClass('hidden').show();
      if (this._mask) this._mask.show();
    }
    this.visible = true;
    this._watch();
  },

  _watch: function(){
    if (this._canAnimate) this.element.addEventListener(Browser.Features.getCSSTransition(), this.bound.animationEnd);
    else this._animationEnd();
  },

  _animationEnd: function(){
    if (Browser.Features.getCSSTransition()) this.element.removeEventListener(Browser.Features.getCSSTransition(), this.bound.animationEnd);
    this.animating = false;
    if (this.visible){
      this.fireEvent('show', this.element);
    } else {
      this.fireEvent('hide', this.element);
      if (this.options.changeDisplayValue) this.element.hide();
      if (!this.options.persist){
        this.destroy();
      } else if (this._mask){
        this._mask.dispose();
      }
    }
  },

  destroy: function(){
    if (this._mask) this._mask.destroy();
    this.fireEvent('destroy', this.element);
    this.element.destroy();
    this._mask = null;
    this.destroyed = true;
  },

  hide: function(event, clicked){
    if (clicked){
      var immediateParentPopup = clicked.getParent('[data-behavior~=BS.Popup]');
      if (immediateParentPopup && immediateParentPopup != this.element) return;
    }
    if (!this.visible || this.animating) return;
    this.animating = true;
    if (event && clicked && clicked.hasClass('stopEvent')){
      event.preventDefault();
    }

    if (Bootstrap.version == 2) document.id(document.body).removeEvent('click', this.bound.hide);
    document.removeEvent('keyup', this.bound.keyMonitor);
    this.element.removeEvent('click:relay(.close, .dismiss, [data-dismiss=modal])', this.bound.hide);

    if (this._canAnimate){
      this.element.removeClass('in');
      if (this._mask) this._mask.removeClass('in');
    } else {
      this.element.addClass('hidden').hide();
      if (this._mask) this._mask.hide();
    }
    this.visible = false;
    this._watch();
  },

  // PRIVATE

  _makeMask: function(){
    if (this.options.mask){
      if (!this._mask){
        this._mask = new Element('div.modal-backdrop.in');
        if (this._canAnimate) this._mask.addClass('fade');
      }
    }
    if (this.options.closeOnClickOut && Bootstrap.version == 2){
      if (this._mask) this._mask.addEvent('click', this.bound.hide);
      else document.id(document.body).addEvent('click', this.bound.hide);
    }
  }

});

/*
---

name: Behavior.Popup

description: Creates a bootstrap popup based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Bootstrap.Popup

provides: [Behavior.BS.Popup]

...
*/

Behavior.addGlobalFilters({
  'BS.Popup': {

    defaults: {
      focusOnShow: "input[type=text], select, textarea",
      hide: false,
      animate: true,
      closeOnEsc: true,
      closeOnClickOut: true,
      mask: true,
      persist: true
    },

    returns: Bootstrap.Popup,

    setup: function(el, api){
      if (api.get('moveElementTo')) el.inject(api.getElement('moveElementTo'));
      var showNow = (!el.hasClass('hide') && !el.hasClass('hidden') &&
                    !api.getAs(Boolean, 'hide') && (!el.hasClass('in') &&
                    !el.hasClass('fade')));
      var popup = new Bootstrap.Popup(el,
        Object.cleanValues(
          api.getAs({
            persist: Boolean,
            animate: Boolean,
            closeOnEsc: Boolean,
            closeOnClickOut: Boolean,
            mask: Boolean
          })
        )
      );
      popup.addEvent('destroy', function(){
        api.cleanup(el);
      });
      if (api.get('focusOnShow')){
        popup.addEvent('show', function(){
          var input = document.id(popup).getElement(api.get('focusOnShow'));
          if (input) input[input.get('tag') == 'select' ? 'focus' : 'select']();
        });
      }

      if (showNow) popup.show();

      return popup;
    }
  }
});
/*
---

name: Behavior.BS.Popup.FormRequest

description: Integrates FormRequest behavior into Popups.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior.FormRequest
 - Behavior.BS.Popup

provides: [Behavior.BS.Popup.FormRequest]

...
*/

Behavior.addGlobalPlugin("FormRequest", "Popup.FormRequest", {
  defaults: {
    closeOnSuccess: true
  },
  setup: function(element, api, instance){
    if (element.getParent('.modal')){
      var dismissed;
      var dismissals = element.getElements('input.dismiss, input.close').map(function(el){
        return el.addEvent('click', function(){
          dismissed = true;
        }).removeClass('dismiss').removeClass('close');
      });
      instance.addEvents({
        success: function(){
          var formRequestAPI = new BehaviorAPI(element, 'formrequest');
          if ((formRequestAPI.getAs(Boolean, 'closeOnSuccess') !== false && api.getAs(Boolean, 'closeOnSuccess') !== false) || dismissed){
            element.getParent('.modal').getBehaviorResult('BS.Popup').hide();
          }
        }
      });
    }
  }
});
/*
---

name: Delegator.BS.ShowPopup

description: Shows a hidden popup.

authors: [Aaron Newton]

license: MIT-style license.

requires:
 - Behavior/Delegator
 - Behavior/Behavior
 - Behavior.BS.Popup

provides: [Delegator.BS.ShowPopup]

...
*/

Delegator.register('click', 'BS.showPopup', {

  handler: function(event, link, api){
    var target = api.get('target') ? link.getElement(api.get('target')) : document.id(link.get('href').split("#")[1]);
    event.preventDefault();
    if (!target) api.fail('Could not find target element to activate: ' + (api.get('target') || link.get('href')));
    api.getBehavior().apply(target);
    target.getBehaviorResult('BS.Popup').show();
  }

});
/*
---

name: Cookie

description: Class for creating, reading, and deleting browser Cookies.

license: MIT-style license.

credits:
  - Based on the functions by Peter-Paul Koch (http://quirksmode.org).

requires: [Options, Browser]

provides: Cookie

...
*/

var Cookie = new Class({

	Implements: Options,

	options: {
		path: '/',
		domain: false,
		duration: false,
		secure: false,
		document: document,
		encode: true
	},

	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},

	write: function(value){
		if (this.options.encode) value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},

	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},

	dispose: function(){
		new Cookie(this.key, Object.merge({}, this.options, {duration: -1})).write('');
		return this;
	}

});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};

/*
---

name: Tabs

description: Handles the scripting for a common UI layout; the tabbed box.

license: MIT-Style License

requires:
 - Core/Element.Event
 - Core/Fx.Tween
 - Core/Fx.Morph
 - Core/Element.Dimensions
 - Core/Cookie
 - More/Element.Shortcuts
 - More/Element.Measure

provides: Tabs

...
*/
var Tabs = new Class({
  Implements: [Options, Events],
  options: {
    // initPanel: null,
    // smooth: false,
    // smoothSize: false,
    // maxSize: null,
    // onActive: function(){},
    // onActiveAfterFx: function(){},
    // onBackground: function(){}
    // cookieName: null,
    preventDefault: true,
    selectedClass: 'tabSelected',
    mouseoverClass: 'tabOver',
    deselectedClass: '',
    rearrangeDOM: true,
    effectOptions: {
      duration: 500
    },
    cookieDays: 999
  },
  tabs: [],
  sections: [],
  clickers: [],
  sectionFx: [],
  initialize: function(options){
    this.setOptions(options);
    if (this.options.selectedClass) this.options.selectedClass = this.options.selectedClass.trim();
    if (this.options.deselectedClass) this.options.deselectedClass = this.options.deselectedClass.trim();
    var prev = this.setup();
    if (prev) return prev;
    if (this.options.initPanel != null) this.show(this.options.initPanel);
    else if (this.options.cookieName && this.recall()) this.show(this.recall().toInt());
    else this.show(0);

  },
  setup: function(){
    var opt = this.options,
        sections = $$(opt.sections),
        tabs = $$(opt.tabs);
    if (tabs[0] && tabs[0].retrieve('Tabs')) return tabs[0].retrieve('Tabs');
    var clickers = $$(opt.clickers);
    tabs.each(function(tab, index){
      this.addTab(tab, sections[index], clickers[index], index);
    }, this);
  },
  addTab: function(tab, section, clicker, index){
    tab = document.id(tab); clicker = document.id(clicker); section = document.id(section);
    //if the tab is already in the interface, just move it
    if (this.tabs.indexOf(tab) >= 0 && tab.retrieve('tabbered')
       && this.tabs.indexOf(tab) != index && this.options.rearrangeDOM){
      this.moveTab(this.tabs.indexOf(tab), index);
      return this;
    }
    //if the index isn't specified, put the tab at the end
    if (index == null) index = this.tabs.length;
    //if this isn't the first item, and there's a tab
    //already in the interface at the index 1 less than this
    //insert this after that one
    if (index > 0 && this.tabs[index-1] && this.options.rearrangeDOM){
      tab.inject(this.tabs[index-1], 'after');
      section.inject(this.tabs[index-1].retrieve('section'), 'after');
    }
    this.tabs.splice(index, 0, tab);
    clicker = clicker || tab;

    tab.addEvents({
      mouseout: function(){
        tab.removeClass(this.options.mouseoverClass);
      }.bind(this),
      mouseover: function(){
        tab.addClass(this.options.mouseoverClass);
      }.bind(this)
    });

    clicker.addEvent('click', function(e){
      if (this.options.preventDefault) e.preventDefault();
      this.show(index);
    }.bind(this));

    tab.store('tabbered', true);
    tab.store('section', section);
    tab.store('clicker', clicker);
    this.hideSection(index);
    return this;
  },
  removeTab: function(index){
    var now = this.tabs[this.now];
    if (this.now == index){
      if (index > 0) this.show(index - 1);
      else if (index < this.tabs.length) this.show(index + 1);
    }
    this.now = this.tabs.indexOf(now);
    return this;
  },
  moveTab: function(from, to){
    var tab = this.tabs[from];
    var clicker = tab.retrieve('clicker');
    var section = tab.retrieve('section');

    var toTab = this.tabs[to];
    var toClicker = toTab.retrieve('clicker');
    var toSection = toTab.retrieve('section');

    this.tabs.erase(tab).splice(to, 0, tab);

    tab.inject(toTab, 'before');
    clicker.inject(toClicker, 'before');
    section.inject(toSection, 'before');
    return this;
  },
  show: function(i){
    if (this.now == null){
      this.tabs.each(function(tab, idx){
        if (i != idx)
          this.hideSection(idx);
      }, this);
    }
    this.showSection(i).save(i);
    return this;
  },
  save: function(index){
    if (this.options.cookieName)
      Cookie.write(this.options.cookieName, index, {duration:this.options.cookieDays});
    return this;
  },
  recall: function(){
    return (this.options.cookieName) ? Cookie.read(this.options.cookieName) : false;
  },
  hideSection: function(idx){
    var tab = this.tabs[idx];
    if (!tab) return this;
    var sect = tab.retrieve('section');
    if (!sect) return this;
    if (sect.getStyle('display') != 'none'){
      this.lastHeight = sect.getSize().y;
      sect.setStyle('display', 'none');
      if (this.options.selectedClass) tab.removeClass(this.options.selectedClass);
      if (this.options.deselectedClass) tab.addClass(this.options.deselectedClass);
      this.fireEvent('onBackground', [idx, sect, tab]);
    }
    return this;
  },
  showSection: function(idx){
    var tab = this.tabs[idx];
    if (!tab) return this;
    var sect = tab.retrieve('section');
    if (!sect) return this;
    var smoothOk = this.options.smooth && !Browser.ie;
    if (this.now != idx){
      if (!tab.retrieve('tabFx'))
        tab.store('tabFx', new Fx.Morph(sect, this.options.effectOptions));
      var overflow = sect.getStyle('overflow');
      var start = {
        display:'block',
        overflow: 'hidden'
      };
      if (smoothOk) start.opacity = 0;
      var effect = false;
      if (smoothOk){
        effect = {opacity: 1};
      } else if (sect.getStyle('opacity').toInt() < 1){
        sect.setStyle('opacity', 1);
        if (!this.options.smoothSize) this.fireEvent('onActiveAfterFx', [idx, sect, tab]);
      }
      if (this.options.smoothSize){
        var size = sect.getDimensions().height;
        if (this.options.maxSize != null && this.options.maxSize < size){
          size = this.options.maxSize;
        }
        if (!effect) effect = {};
        effect.height = size;
      }
      if (this.now != null) this.hideSection(this.now);
      if (this.options.smoothSize && this.lastHeight) start.height = this.lastHeight;
      sect.setStyles(start);
      var finish = function(){
        this.fireEvent('onActiveAfterFx', [idx, sect, tab]);
        sect.setStyles({
          height: this.options.maxSize == effect.height ? this.options.maxSize : "auto",
          overflow: overflow
        });
        sect.getElements('input, textarea').setStyle('opacity', 1);
      }.bind(this);
      if (effect){
        tab.retrieve('tabFx').start(effect).chain(finish);
      } else {
        finish();
      }
      this.now = idx;
      this.fireEvent('onActive', [idx, sect, tab]);
    }
    if (this.options.selectedClass) tab.addClass(this.options.selectedClass);
    if (this.options.deselectedClass) tab.removeClass(this.options.deselectedClass);
    return this;
  }
});

/*
---
name: Event.HashChange

description: Added the onhashchange event

license: MIT-style

authors:
- sdf1981cgn
- Greggory Hernandez

requires:
- Core/Element.Event

provides: [Element.Events.hashchange]

...
*/
Element.Events.hashchange = {
  onAdd: function () {
    var hash = location.hash;

    var hashchange = function () {
      if (hash == location.hash) return;
      else hash = location.hash;

      var value = (hash.indexOf('#') == 0 ? hash.substr(1) : hash);
      window.fireEvent('hashchange', value);
      document.fireEvent('hashchange', value);
    };

    if (("onhashchange" in window) && ((document.documentMode != 5) && (document.documentMode != 7))) {
      window.onhashchange = hashchange;
    }
    else {
      hashchange.periodical(50);
    }
  }
};
/*
---

name: Tabs.Hash

description: Stores tab selection in the window.hash

license: MIT-Style License

requires:
 - More/String.QueryString
 - More/Object.Extras
 - Tabs
 - Element.Events.hashchange

provides: Tabs.Hash

...
*/

var getHash = function(){
  return window.location.hash.substring(1, window.location.hash.length).parseQueryString();
};

Tabs.Hash = new Class({
  Extends: Tabs,
  options: {
    hash: null // the hash value to store the state in
  },
  initialize: function(options){
    this.setOptions(options);
    // delete the hash option on startup so that the call to show(0) doesn't change the location hash
    hash = this.options.hash;
    if (hash){
      delete options.hash;
      delete this.options.hash;
      options.preventDefault = true;
    }
    this.parent(options);
    if (hash){
      // put the hash back
      this.options.hash = hash;
      this.bound = {
        showByHash: this.showByHash.bind(this)
      };
      // watch hashchange for changes
      window.addEvent('hashchange', this.bound.showByHash);
      this.showByHash();
    }
  },
  // shows a section based on the window location hash value
  showByHash: function(){
    var i = this.getIndexByHash();
    if (i || i===0) this.show(i);
    return this;
  },
  // gets the index to show based on an elementID
  // returns NULL if nothing is found
  getIndexById: function(id){
    var target = document.id(id);
    if (target && this.tabs.contains(target)) return this.tabs.indexOf(target);
    else if (target && this.sections.contains(target)) return this.sections.indexOf(target);
    return null;
  },
  // gets the hash value and returns the index to be shown
  // returns UNDEFINED if there was no hash value
  // returns NULL if no element was found and the value wasn't an int already
  // NOTE: hash value may be an int or a string; int if the tab/section had no id
  getIndexByHash: function(){
    var hash = getHash();
    if (!hash) return this;
    var value = hash[this.options.hash];
    if (value && isNaN(value.toInt())){
      var i = this.getIndexById(value);
      if (i !== null) value = i;
      else return null;
    }
    return value;
  },
  // for optimization purposes, we store the sections, the base class doesn't do this
  addTab: function(tab, section, clicker, index){
    this.parent.apply(this, arguments);
    this.sections[this.tabs.indexOf(tab)] = section;
  },
  // on show, update the hash
  show: function(i){
    this.parent.apply(this, arguments);
    if (this.options.hash){
      var hash = getHash() || {};
      hash[this.options.hash] = this.tabs[i].get('id') || this.sections[i].get('id') || i;
      window.location.hash = Object.cleanValues(Object.toQueryString(hash));
    }
  },
  destroy: function(){
    if (this.bound) window.removeEvent('hashchange', this.bound.showByHash);
    this.tabs.each(function(el){
      el.removeEvents();
    });
    this.tabs = null;
    this.sections = null;
  }
});
/*
---
name: Behavior.Tabs
description: Adds a tab interface (Tabs instance) for elements with .css-tab_ui. Matched with tab elements that are .tabs and sections that are .tab_sections.
provides: [Behavior.Tabs]
requires: [Behavior/Behavior, /Tabs.Hash]
script: Behavior.Tabs.js

...
*/

Behavior.addGlobalFilters({

  Tabs: {
    defaults: {
      'tabs-selector': '.tabs>li',
      'sections-selector': '.tab_sections>li',
      smooth: true,
      smoothSize: true,
      rearrangeDOM: false,
      preventDefault: true
    },
    setup: function(element, api){
      var tabs = element.getElements(api.get('tabs-selector'));
      var sections = element.getElements(api.get('sections-selector'));
      if (tabs.length != sections.length || tabs.length == 0){
        api.fail('warning; sections and sections are not of equal number. tabs: ' + tabs.length + ', sections: ' + sections.length);
      }

      var ts = new Tabs.Hash(
        Object.merge(
          {
            tabs: tabs,
            sections: sections
          },
          Object.cleanValues(
            api.getAs({
              initPanel: Number,
              hash: String,
              cookieName: String,
              smooth: Boolean,
              smoothSize: Boolean,
              rearrangeDOM: Boolean,
              selectedClass: String,
              initPanel: Number,
              preventDefault: Boolean
            })
          )
        )
      );
      ts.addEvent('active', function(index){
        api.fireEvent('layout:display', sections[0].getParent());
      });

      // get the element to delegate clicks to - defaults to the container
      var delegationTarget = element;
      if (api.get('delegationTarget')) delegationTarget = element.getElement(api.get('delegationTarget'));
      if (!delegationTarget) api.fail('Could not find delegation target for tabs');

      // delegate watching click events for any element with an #href
      delegationTarget.addEvent('click:relay([href^=#])', function(event, link){
        if (link.get('href') == "#") return;
        // attempt to find the target for the link within the page
        var target = delegationTarget.getElement(link.get('href'));
        // if the target IS a tab, do nothing; valid targets are *sections*
        if (ts.tabs.contains(target)) return;
        // if no target was found at all, warn
        if (!target) api.warn('Could not switch tab; no section found for ' + link.get('href'));
        // if the target is a section, show it.
        if (ts.sections.contains(target)){
          event.preventDefault();
          var delegator = api.getDelegator();
          if (delegator) delegator._eventHandler(event, ts.tabs[ts.sections.indexOf(target)]);
          ts.show(ts.sections.indexOf(target));
        }
      });

      element.store('Tabs', ts);
      api.onCleanup(function(){
        ts.destroy();
        element.eliminate('Tabs');
      });
      return ts;
    }
  }
});
/*
---

name: Behavior.BS.Tabs

description: Instantiates Bootstrap.Tabs based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - Behavior.Tabs

provides: [Behavior.BS.Tabs]

...
*/
(function(){

  // start with the base options from the tabs behavior
  var tabs = Object.clone(Behavior.getFilter('Tabs'));

  // customizing it here for Bootstrap, we start by duplicationg the other behavior
  Behavior.addGlobalFilters({
    'BS.Tabs': tabs.config
  });

  // set custom defaults specific to bootstrap
  Behavior.setFilterDefaults('BS.Tabs', {
    'tabs-selector': 'a:not(.dropdown-toggle)',
    'sections-selector': '+.tab-content >',
    'selectedClass': 'active',
    smooth: false,
    smoothSize: false
  });

  // this plugin configures tabs to use bootstrap specific DOM structures
  Behavior.addGlobalPlugin('BS.Tabs', 'BS.Tabs.CSS', function(el, api, instance){
    // whenever the tabs activates a tab
    instance.addEvent('active', function(index, section, tab){
      // get the things in the tabs element that are active and remove that class
      el.getElements('.active').removeClass('active');
      // get the parent LI for the tab and add active to it
      tab.getParent('li').addClass('active');
      // handle the possibility of a dropdown in the tab.
      var dropdown = tab.getParent('.dropdown');
      if (dropdown) dropdown.addClass('active');
    });
    // invoke the event for startup
    var now = instance.now;
    var tab = instance.tabs[now];
    var section = tab.retrieve('section');
    instance.fireEvent('active', [now, section, tab]);

  });

  // this plugin makes links that have #href targets select their target tabs
  Behavior.addGlobalPlugin('BS.Tabs', 'BS.Tabs.TargetLinks', function(el, api, instance){
    // whenever the instance activates a tab, find any related #href links and add `active-section-link` to the appropriate ones
    instance.addEvent('active', function(index, section, tab){
      document.body.getElements('.active-section-link').removeClass('active-section-link');
      // if there's a "group controller" go select it.
      if (tab.get('data-tab-group')){
        document.id(tab.get('data-tab-group')).addClass('active-section-link');
      }
    });

        // invoke the event for startup
    var now = instance.now;
    var tab = instance.tabs[now];
    var section = tab.retrieve('section');
    instance.fireEvent('active', [now, section, tab]);

  });

})();
/*
---

name: Behavior.BS.Tooltip

description: Instantiates Bootstrap.Tooltip based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Bootstrap.Tooltip

provides: [Behavior.BS.Tooltip]

...
*/
(function(){
  var filter = {

    defaults: {
      location: 'above', //below, left, right
      animate: true,
      delayIn: 200,
      delayOut: 0,
      onOverflow: false,
      offset: 0,
      trigger: 'hover' //focus, manual
    },

    delayUntil: 'mouseover,focus',

    returns: Bootstrap.Tooltip,

    setup: function(el, api){
      var options = Object.cleanValues(
        api.getAs({
          onOverflow: Boolean,
          location: String,
          animate: Boolean,
          delayIn: Number,
          delayOut: Number,
          fallback: String,
          override: String,
          html: Boolean,
          trigger: String,
          inject: Object
        })
      );
      if (api.get('offset')){
        var offset;
        try {
          offset = api.getAs(Number, 'offset');
        } catch (e){
          offset = api.getAs(Object, 'offset');
        }
        if (offset === undefined) api.fail('Could not read offset value as number or string. The value was: ' + api.get('offset'));
        options.offset = offset;
      }
      if (options.inject && options.inject.target){
        options.inject.target = el.getElement(options.inject.target);
      }

      options.getContent = Function.from(api.get('content') || el.get('title'));
      var tip = new Bootstrap.Tooltip(el, options);
      api.onCleanup(tip.destroy.bind(tip));
      if (api.event && ((api.event.type == 'mouseover' && api.get('trigger') == 'hover') || (api.event.type == api.get('trigger')))){
        tip.show();
      } else if (api.get('showNow')){
        var showTimer,
            show = function(){
          var size = el.getSize();
          if (size.y > 0 || size.x > 0){
            tip.show();
            clearInterval(showTimer);
          }
        };
        showTimer = show.periodical(1000);
        show();
      }
      return tip;
    }
  };
  Behavior.addGlobalFilters({
    'BS.Tooltip': filter,
    'BS.Twipsy': filter // deprecated
  });
  Behavior.addGlobalFilters({
    'BS.Tooltip.Static': Object.merge({}, filter, {
      delayUntil: null,
      defaults: {
        showNow: true,
        trigger: 'manual'
      }
    })
  });
})();
/*
---

script: URI.js

name: URI

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
  - Sebastian Markbåge
  - Aaron Newton

requires:
  - Core/Object
  - Core/Class
  - Core/Class.Extras
  - Core/Element
  - String.QueryString

provides: [URI]

...
*/

(function(){

var toString = function(){
	return this.get('value');
};

var URI = this.URI = new Class({

	Implements: Options,

	options: {
		/*base: false*/
	},

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		if (!uri) uri = base;

		if (uri && uri.parsed) this.parsed = Object.clone(uri.parsed);
		else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},

	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift();
		return this.merge(bits.associate(this.parts), base);
	},

	merge: function(bits, base){
		if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
		bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
		return bits;
	},

	parseDirectory: function(directory, baseDirectory){
		directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
		if (!directory.test(URI.regs.directoryDot)) return directory;
		var result = [];
		directory.replace(URI.regs.endSlash, '').split('/').each(function(dir){
			if (dir == '..' && result.length > 0) result.pop();
			else if (dir != '.') result.push(dir);
		});
		return result.join('/') + '/';
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(URI.regs.scheme);
			if (scheme) scheme = scheme[1];
			if (scheme && this.schemes[scheme.toLowerCase()] == null) this.parsed = { scheme: scheme, value: value };
			else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value } : { value: value });
		} else if (part == 'data'){
			this.setData(value);
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		switch (part){
			case 'value': return this.combine(this.parsed, base ? base.parsed : false);
			case 'data' : return this.getData();
		}
		return this.parsed[part] || '';
	},

	go: function(){
		document.location.href = this.toString();
	},

	toURI: function(){
		return this;
	},

	getData: function(key, part){
		var qs = this.get(part || 'query');
		if (!(qs || qs === 0)) return key ? null : {};
		var obj = qs.parseQueryString();
		return key ? obj[key] : obj;
	},

	setData: function(values, merge, part){
		if (typeof values == 'string'){
			var data = this.getData();
			data[arguments[0]] = arguments[1];
			values = data;
		} else if (merge){
			values = Object.merge(this.getData(null, part), values);
		}
		return this.set(part || 'query', Object.toQueryString(values));
	},

	clearData: function(part){
		return this.set(part || 'query', '');
	},

	toString: toString,
	valueOf: toString

});

URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI(Array.from(document.getElements('base[href]', true)).getLast(), {base: document.location});

String.implement({

	toURI: function(options){
		return new URI(this, options);
	}

});

})();

/*
---

script: Array.Extras.js

name: Array.Extras

description: Extends the Array native object to include useful methods to work with arrays.

license: MIT-style license

authors:
  - Christoph Pojer
  - Sebastian Markbåge

requires:
  - Core/Array
  - MooTools.More

provides: [Array.Extras]

...
*/

(function(nil){

Array.implement({

	min: function(){
		return Math.min.apply(null, this);
	},

	max: function(){
		return Math.max.apply(null, this);
	},

	average: function(){
		return this.length ? this.sum() / this.length : 0;
	},

	sum: function(){
		var result = 0, l = this.length;
		if (l){
			while (l--){
				if (this[l] != null) result += parseFloat(this[l]);
			}
		}
		return result;
	},

	unique: function(){
		return [].combine(this);
	},

	shuffle: function(){
		for (var i = this.length; i && --i;){
			var temp = this[i], r = Math.floor(Math.random() * ( i + 1 ));
			this[i] = this[r];
			this[r] = temp;
		}
		return this;
	},

	reduce: function(fn, value){
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) value = value === nil ? this[i] : fn.call(null, value, this[i], i, this);
		}
		return value;
	},

	reduceRight: function(fn, value){
		var i = this.length;
		while (i--){
			if (i in this) value = value === nil ? this[i] : fn.call(null, value, this[i], i, this);
		}
		return value;
	},

	pluck: function(prop){
		return this.map(function(item){
			return item[prop];
		});
	}

});

})();

/*
---

name: Locale.en-US.Number

description: Number messages for US English.

license: MIT-style license

authors:
  - Arian Stolwijk

requires:
  - Locale

provides: [Locale.en-US.Number]

...
*/

Locale.define('en-US', 'Number', {

	decimal: '.',
	group: ',',

/* 	Commented properties are the defaults for Number.format
	decimals: 0,
	precision: 0,
	scientific: null,

	prefix: null,
	suffic: null,

	// Negative/Currency/percentage will mixin Number
	negative: {
		prefix: '-'
	},*/

	currency: {
//		decimals: 2,
		prefix: '$ '
	}/*,

	percentage: {
		decimals: 2,
		suffix: '%'
	}*/

});



/*
---
name: Number.Format
description: Extends the Number Type object to include a number formatting method.
license: MIT-style license
authors: [Arian Stolwijk]
requires: [Core/Number, Locale.en-US.Number]
# Number.Extras is for compatibility
provides: [Number.Format, Number.Extras]
...
*/


Number.implement({

	format: function(options){
		// Thanks dojo and YUI for some inspiration
		var value = this;
		options = options ? Object.clone(options) : {};
		var getOption = function(key){
			if (options[key] != null) return options[key];
			return Locale.get('Number.' + key);
		};

		var negative = value < 0,
			decimal = getOption('decimal'),
			precision = getOption('precision'),
			group = getOption('group'),
			decimals = getOption('decimals');

		if (negative){
			var negativeLocale = getOption('negative') || {};
			if (negativeLocale.prefix == null && negativeLocale.suffix == null) negativeLocale.prefix = '-';
			['prefix', 'suffix'].each(function(key){
				if (negativeLocale[key]) options[key] = getOption(key) + negativeLocale[key];
			});

			value = -value;
		}

		var prefix = getOption('prefix'),
			suffix = getOption('suffix');

		if (decimals !== '' && decimals >= 0 && decimals <= 20) value = value.toFixed(decimals);
		if (precision >= 1 && precision <= 21) value = (+value).toPrecision(precision);

		value += '';
		var index;
		if (getOption('scientific') === false && value.indexOf('e') > -1){
			var match = value.split('e'),
				zeros = +match[1];
			value = match[0].replace('.', '');

			if (zeros < 0){
				zeros = -zeros - 1;
				index = match[0].indexOf('.');
				if (index > -1) zeros -= index - 1;
				while (zeros--) value = '0' + value;
				value = '0.' + value;
			} else {
				index = match[0].lastIndexOf('.');
				if (index > -1) zeros -= match[0].length - index - 1;
				while (zeros--) value += '0';
			}
		}

		if (decimal != '.') value = value.replace('.', decimal);

		if (group){
			index = value.lastIndexOf(decimal);
			index = (index > -1) ? index : value.length;
			var newOutput = value.substring(index),
				i = index;

			while (i--){
				if ((index - i - 1) % 3 == 0 && i != (index - 1)) newOutput = group + newOutput;
				newOutput = value.charAt(i) + newOutput;
			}

			value = newOutput;
		}

		if (prefix) value = prefix + value;
		if (suffix) value += suffix;

		return value;
	},

	formatCurrency: function(decimals){
		var locale = Locale.get('Number.currency') || {};
		if (locale.scientific == null) locale.scientific = false;
		locale.decimals = decimals != null ? decimals
			: (locale.decimals == null ? 2 : locale.decimals);

		return this.format(locale);
	},

	formatPercentage: function(decimals){
		var locale = Locale.get('Number.percentage') || {};
		if (locale.suffix == null) locale.suffix = '%';
		locale.decimals = decimals != null ? decimals
			: (locale.decimals == null ? 2 : locale.decimals);

		return this.format(locale);
	}

});

/*
---

name: Number

description: Extensions to the Number prototype.

requires:
 - Core/Number

provides: [Number]

...
*/

Number.implement({
  humanize: function(options){
    options = Object.merge({
      suffixes: ['','K','M','G'],
      base: 1000,
      decimals: 2,
      decimalsLessThanBase: true // by default, we show decimals for numbers less than the base amount.
                                 // eg., 945 becomes 945.00 if decimals == 2
                                 // setting this to false just returns 945
    }, options);
    var i = 0;
    var value = this;
    if (!options.decimalsLessThanBase && value < options.base) return value;
    while (value > options.base && i < options.suffixes.length - 1){
        ++i;
        value = Math.round((value / options.base) * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals);
    }
    return (value).format({ decimals: options.decimals }) + options.suffixes[i];
  },

  operate: function(operator, modifier){
    switch(operator){
      case '+':
        return this+modifier;
        break;
      case '-':
        return this-modifier;
        break;
      case '*':
        return this*modifier;
        break;
      case '/':
        return this/modifier;
        break;
      default:
        try{
          return this[operator](modifier);
        } catch (e){
          throw "Unknown operator for Number.operate: "+operator
        }
    }
  }
});

/*
---

name: Chart

description: The base chart class for  Depends on HighCharts.

requires:
 - Core/Element.Dimensions
 - Core/Request.JSON
 - More/Date
 - More/URI
 - More/Array.Extras
 - More/Number.Format
 - More/Object.Extras
 - Bootstrap.Tooltip
 - Number

provides: [Chart]

...
*/

Chart = new Class({

  Implements: [Options, Events],

  options: {
    // show tooltips on hover
    tooltips: true,
    // display the title in the chart
    showTitle: true,
    // display the subtitle in the chart
    showSubTitle: true,

    // display the legend for the chart
    // the default here is true if there's more than one series
    // unless you explicitly set it to false
    // showLegend: false,

    // shows the point markers
    showMarkers: false,
    // shows the markers when you hover
    showMarkersOnHover: false,
    // show export controls
    exportable: false,
    // navigation config
    navigation: {},
    // show labels for points
    showLabels: false,
    // stack the series if 'normal' (by value) or 'percent'
    stack: null,
    // when stacking, show the total value
    showTotal: true,
    // the data for the chart; see HighCharts constructor
    data: null,
    // if data is at an ajax endpoint, the url for it
    // this is not used if options.data is provied
    // should return the options object for the HighChart constructor
    url: null,
    // if set, this url is opened when a point is clicked, passed the data for that point
    pointUrl: null,
    onPointClick: function(data){
      if (this.options.pointUrl){
        window.location.href = new URI(this.options.pointUrl).setData(data, true);
      }
    },
    flagUrl: null,
    // if set, this url is opened when a flag is clicked, passed the data for that point
    onFlagClick: function(flag){
      if (this.options.flagUrl){
        try {
          window.location.href = new URI(this.options.flagUrl).setData({ ids: flag.ids.join(",") }, true);
        } catch(e){
          if (console && console.warn) console.warn('Could not follow flag url as data ids are not found.', flag, e.message);
        }
      }
    },
    // show an ajax spinner for charts being updated
    useSpinner: true,
    // what kind of series type to display
    seriesType: 'spline',
    // the size of the chart
    size: {
      x: 100,
      y: 100
    },
    xAxis: {
      type: 'datetime',
      startOnTick: false,
      endOnTick: false,
      minRange: 2 * 24 * 3600000 // 2 days
    },
    // measure the target element and fill it; if true, options.size is ignored
    sizeToElement: true,
    // allow the user to zoom in on the chart data; boolean or 'x', 'y', or 'xy'
    zoomable: false,
    dateFormat: '%a - %b %d, %Y', //see MooTools Date.js docs
    // the border around the plot area
    plotBorderWidth: 1,
    plotBorderColor: '#eee',
    plotBackgroundColor: null,
    backgroundColor: null,
    absoluteLabels: true,
    fetchEvery: 0,
    colors: [
      '#4572A7',
      '#AA4643',
      '#be9491',
      '#80699B',
      '#3D96AE',
      '#DB843D',
      '#92A8CD',
      '#A47D7C',
      '#B5CA92'
    ],

    // V2 styles
    columnGrouping: 'day',
    // v2 specific options
    v2Styles: true,
    // space given at the top of the graph when the title and/or subtitle are visible
    titleSpace: 40,
    subTitleSpace: 29,
    // pixels to dedicate for each row of the legend
    legendRowSize: 33,
    // margin above and below the legend rows
    legendRowMargin: 10,
    legendBottomMargin: 10,
    // how wide to make the legend items; overflow is ellipsed
    // legendItemWidth: null, // defaults to 1/2 legendWidth
    // legendWidth: null, //defaults to 2/3 the chart width
    // height of the chart minus the legend and space for the title and the plotMarginTopBase
    baseHeight: 467,
    // base margin at the top used even if there's no title or legend
    plotMarginTopBase: 10,
    // minimum viable margin at the top of the graph; basically only used if you disable title,
    // subtitle, and legend
    plotMinMarginTop: 72,
    // include flags in the legend (allows them to be turned off)
    showFlagsInLegend: false,
    // width of the chart area that has lines and labels to left and right of series
    gutterWidth: 60,
    // minimum size for a column; defaults to 2 unless stacking is on
    minPointLength: null

    /*
      gradient example:
      plotBackgroundColor: {
        linearGradient: [0, 0, 0, 500],
        stops: [
          [0, 'rgb(255, 255, 255)'],
          [1, 'rgb(240, 240, 240)']
        ]
      }
    */
  },

  v2options: {
    // no border
    plotBorderWidth: 0,
    // default colors; should probably be set inline via palette
    colors: [
      '#00CCCE', // @turquoise
      '#2ECC71', // @emerald
      '#27AE60', // @nephritis
      '#AC69C7', // @amethyst
      '#0073BF'  // @belize-hole
    ],
    // date format for label in tooltip
    dateFormat: "%a, %b %e, %Y",
    // margins around the plot area; NOTE, the first item here is overwritten by ._setElementHeight
    margin: [30, 90, 30, 90],
    // show or not show the vertical lines
    showVerticalLines: false,
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      maxPadding: 0.25,
      labels: {
        formatter: function(){
          return (this.chart.options.yPrefix || "") + (self.options.absoluteLabels ? Math.abs(this.value) : this.value) +  (this.chart.options.ySuffix || "");
        }
      }
    }
  },
  basicChartOptions: {
    margin: [30, 90, 90, 90],
    titleSpace: 40,
    subTitleSpace: 29,
    legendBottomMargin: 45,
    baseHeight: 390
  },

  /*
    constructor
    arguments:
    element (id or DOM reference) - the element to contain the chart
    options (object, optional) - the options that differ from the defaults listed above
  */
  initialize: function(element, options){
    this.element = document.id(element);
    if (!options || options.v2Styles !== false){
      this._setV2Defaults();
      this.addEvent('chartCreated', function(){
        this._v2ChartTweaks();
        this._makeTooltips();
      }.bind(this));
    }
    this.setOptions(options);
    if (this.options.fetchEvery) this.play();
  },

  play: function(){
    if (!this.paused) return;
    this.paused = false;
    this.timer = this.refresh.periodical(this.options.fetchEvery, this);
  },

  pause: function(){
    this.paused = true;
    clearInterval(this.timer);
  },
  paused: true,

  getSizeOptions: function(){
    var size = this.options.size;
    if (this.options.sizeToElement) size = this.element.getSize();
    return size;
  },

  /*
    returns the options object for the HighCharts constructor.
    arguments:
    options (object, optional) - the options to merge with the defaults defined within this getter
  */
  getChartOptions: function(options){
    var yAxis = options && options.yAxis;
    if (this.options.v2Styles) options = this.getV2Options(options);
    var v2yAxis = options.yAxis;
    var size = this.getSizeOptions();
    var self = this;
    var chartOptions = Object.merge({
      chart: {
        renderTo: this.element,
        plotBorderWidth: this.options.plotBorderWidth,
        plotBorderColor: this.options.plotBorderColor,
        plotBackgroundColor: this.options.plotBackgroundColor,
        defaultSeriesType: this.options.seriesType,
        animation: {
          duration: 500,
          transition: Fx.Transitions.Pow.easeOut
        },
        width: size.x || 600,
        height: size.y || 400,
        zoomType: this.options.zoomable ? typeOf(this.options.zoomable) == "string" ? this.options.zoomable : 'x' : null,
        backgroundColor: this.options.backgroundColor
      },
      colors: this.options.colors,
      plotOptions: {
        series: {
          animation: {
            duration: 500,
            transition: Fx.Transitions.Pow.easeOut
          },
          point: {
            events: {
              click: function(e){
                // See below where self._flagClicked is set for why this is doing this.
                if (self._flagClicked) return;
                self.fireEvent('pointClick', [e.point]);
              }
            }
          },
          dataLabels: {
            enabled: this.options.showLabels
          },
          marker: {
            enabled: this.options.showMarkers,
            states:{
              hover: {
                enabled: this.options.showMarkersOnHover
              }
            }
          },
          stacking: this.options.stack || this.options.columnStacking //columnStacking deprecated
        },
        flags: {
          zIndex: 10,
          events: {
            click: function(event){
              // Clicking a flag also, inexplicably, fires the click on the point
              // we don't want that, so we introduce a short delay for the point click
              // where we prevent the pointClick from firing
              self._flagClicked = true;
              clearTimeout(self._flagClickedTimer);
              self._flagClickedTimer = (function(){
                self._flagClicked = false;
              }).delay(100);
              self.fireEvent('flagClick', [event.point]);
            }
          }
        }
      },
      xAxis: this.options.xAxis,
      tooltip: {
        xDateFormat: this.options.dateFormat,
        shared: true,
        crosshairs: true,
        useHTML: true,
        enabled: this.options.tooltips,
        formatter: function(){
          var value = self.options.xAxis.type == 'datetime' ? Highcharts.dateFormat(self.options.dateFormat, this.x) : this.x;
          // this loop goes through each point and makes the tooltip. the only difference
          // between this and the default is y values use the absolute value.

          if (this.points){
            this.points.each(function(point){
              value+= '<br/><span style="color: {color}">{name}:<b>{prefix}{pointy}{suffix}</b></span>'.substitute({
                color: point.series.color,
                name: point.series.name,
                prefix: point.series.tooltipOptions.valuePrefix || "",
                pointy: self.options.absoluteLabels ? Math.abs(point.y) : point.y,
                suffix: point.series.tooltipOptions.valueSuffix || ""
              });
            });
            if (self.options.showTotal && (self.options.stack || self.options.columnStacking) && this.points[0].total){
              value += '<br/><span>Total: <b>' + this.points[0].total + '</b></span>';
            }
          }
          if (this.point){
            value += '<span style="color: ' + this.point.series.color + '">';
            if (this.point.series.title) value += this.point.title + '<br/>';
            value += this.point.text + '</span>';
          }

          return value;
        }
      },
      credits: false,
      exporting: {
        enabled: this.options.exportable
      },
      printButton:{
        enabled: false
      },
      navigation: this.options.navigation,
      legend: {
        enabled: this.options.showLegend
      }
    }, options);
    if (yAxis && typeOf(yAxis) == 'array'){
      chartOptions.yAxis = yAxis.map(function(axis){
        return Object.merge(axis, v2yAxis);
      });
    }
    if (!this.options.showTitle) chartOptions.title = null;
    if (!this.options.showSubTitle) chartOptions.subtitle = null;
    if (!this.options.showYAxis && options.yAxis){
      if (typeOf(chartOptions.yAxis) == 'array'){
        chartOptions.yAxis.each(function(axis){
          axis.title = '';
        });
      } else {
        chartOptions.yAxis.title = "";
      }
    }
    return chartOptions;
  },

  getV2Options: function(options){
    var self = this;

    return Object.merge(options, {
      chart: {
        margin: this.options.margin
      },
      plotOptions: {
        column:{
          minPointLength: this.options.minPointLength || (this.options.seriesType == 'column' && !this.options.stack ? 0 : 2),
          pointPadding: 0.05,
          groupPadding: 0.05,
          borderWidth: 0,
          animation: {
            duration: 500,
            transition: Fx.Transitions.Pow.easeOut
          },
          tweakPointSize: function(pointWidth, pointPadding){
            if (pointWidth > 2.5){
              pointWidth = pointWidth.round();
              pointPadding = pointPadding.round();
              if (pointWidth + pointPadding % 2) pointWidth = pointWidth -1;
            }
            return {
              pointWidth: pointWidth,
              pointPadding: pointPadding
            };
          }
        },
        series: {
          events: {
            legendItemClick: function(){
              // when the user clicks a legend item, we gotta handle some stuff manually
              var index = this.chart.series.indexOf(this);
              var legendItem = self.element.getElement('.label-index-' + index),
                secondItem = legendItem.getElement('.second-icon');
              // if they've disabled it, the flag for visibililty hasn't been flipped by HighCharts yet
              // so this.visible is true, meaning it won't be in a second
              if (this.visible){
                // remove the checked class and remove the inline color (unique per series)
                // so it turns grey
                legendItem.removeClass('checked').setStyle('color', '');
                secondItem.setStyle('color', '');
              } else {
                // otherwise add the checked class
                legendItem.addClass('checked').setStyle('color', secondItem.get('data-color'));
                // and put the unique color back in place
                secondItem.setStyle('color', secondItem.get('data-color'));
              }
              // count how many are now visible
              var visible = this.chart.legend.allItems.map(function(item){
                return item.selected;
              }).length;
              // and then add the .single class to the tooltip if there's only one left

              var tip = this.chart.tooltip.label.div.getElement('.chart-tip');
              if (tip) tip[visible == 1 ? 'addClass' : 'removeClass']('single');
              return true;
            }
          }
        }
      },
      // title styles, location
      title: this.options.showTitle ? {
        align: 'left',
        x: 29,
        y: this.options.showSubTitle ? 20 : 35,
        useHTML: true
      } : null,
      // subtitle styles, location; depends on if title is visible for positioning
      subtitle: this.options.showSubTitle ? {
        align: 'left',
        x: 29,
        y: this.options.showTitle ? 44 : 26,
        useHTML: true
      } : null,
      // xAxis styles
      xAxis: {
        gridLineColor: '#dcdcdc',
        // spaces out both the grid and the labels
        tickPixelInterval: 150,
        tickWidth: 0,
        gridLineWidth: this.options.showVerticalLines ? 1 : 0,
        lineWidth: 0,
        offset: 10,
        title: {
          margin: 10,
          align: 'left',
          style: {
            fontFamily: 'lato',
            fontSize: 14,
            color: '#666'
          }
        },
        labels: {
          useHTML: true,
          y: 17,
          // formats the vales below the grid to read "M \n SEP 5"
          formatter: function(){
            if (self.options.xAxis.type == 'datetime'){
              // parse the date
              var d = new Date(this.value);
              switch(self.grouping){
                case 'month':
                  return "<span class='axis-date'><span class='month'>" +
                          d.format("%b") + "</span><span class='sub'>" + d.format("%Y") + "</span></span>";
                case 'week':
                  return "<span class='axis-date'><span class='week'>week of</span><span class='sub'>" +
                          d.format("%b %e") + "</span></span>";
                default:
                  // format it; it gets styled by css
                  return "<span class='axis-date'><span class='day'>" + d.format("%a")[0] +
                         "</span><span class='sub'>" +  d.format("%b %e") + "</span></span>";
              }
            } else {
              return "<span class='axis-date'><span class='sub'>" +  this.value + "</span></span>";
            }
          }
        }
      },
      // yAxis styles
      yAxis: {
        gridLineColor: '#dcdcdc',
        // spaces out the grid and the left-side labels
        tickPixelInterval: 60,
        startOnTick: true,
        endOnTick: true,
        // push the labels off to the left
        labels: {
          align: 'right',
          x: -10,
          y: -6,
          style: {
            color: '#acacac'
          },
          // formats the labels into nice looking numbers
          formatter: function(){
            var label = self.options.absoluteLabels ? Math.abs(this.value) : this.value;
            if (typeOf(label) == "number"){
              if (label >= 10000) label = label.humanize(); // 11.2K
              else label = label.format(); // 5,425
            }
            return (this.chart.options.yPrefix || "") + label + (this.chart.options.ySuffix || "");
          }
        },
        // behavior-ui hack!
        tweakGridLine: function(path, index){
          // hide the very bottom line
          if (index === 0) return ["M", 0, 0, "L", 0, 0];
          // pushes grid lines 60px to the left and right
          // could turn this into a config option if we find we
          // want to tweak it on the fly
          path[1] -= self.options.gutterWidth;
          path[4] += self.options.gutterWidth;
          return path;
        }
      },
      // range selector button styles - the 1M, 2M, 3M etc. buttons
      rangeSelector: {
        buttonSpacing: 2,
        buttonTheme: {
          fill: 'none',
          stroke: '#e2e2e1',
          'stroke-width': 0,
          r: 2,
          style: {
            color: '#acacac',
            fontWeight: 'normal',
            textTransform: 'uppercase'
          },
          states: {
            hover: {
              fill: '#c9c9c9',
              stroke: '#c9c9c9',
              style: {
                color: 'white',
                cursor: 'pointer'
              }
            },
            select: {
              fill: '#acacac',
              stroke: '#acacac',
              style: {
                color: 'white'
              }
            }
          }
        }
      },
      // super duper custom tooltip styles
      tooltip: {
        // snappy please
        animation: false,
        // we'll handle our own colors in CSS please
        backgroundColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
        shadow: false,
        // hide immediately
        hideDelay: 0,
        // the vertical line on the chart
        crosshairs: [{
          color: '#3f3f3f',
          width: 2
        }],
        // position our tooltip as we move the mouse around
        positioner: function(labelWidth, labelHeight, point){
          // x position of our line is the chart plotLeft + the offset of the point
          // and then we subtract half of the label's width to center it and subtract
          // 1 more to center on our 2px wide crosshair line
          var x = (point.plotX + this.chart.plotLeft - (labelWidth/2) - 1);
          // limit the position to 0 (so our label doesn't go off canvas left)
          // and on the right the chart's plotWidth, plus the plotLeft (margin) * 2 (for the right side)
          // minus our label's width
          var limitX = x.limit(0, this.chart.plotWidth + (this.chart.plotLeft*2) - labelWidth);
          // our final position
          var position = {
            x: limitX,
            y: (this.chart.plotTop - labelHeight - 9).max(0)
          };
          // if our x value is != limitX it means that we've bumped the right or left edge with the tip
          if (x !== limitX){
            // so calculate how far off our gridline is from center
            var offset = x - limitX;
            // and move our little triangle around to match it!
            this.chart.tooltip.label.div.getElement('.triangle').setStyle('margin-left', offset - 9);
          }
          return position;
        },
        // fancy formatted tooltips
        formatter: function(){
          // if we've got a date on our hands, format it

          var dateFormat;
          switch(self.grouping){
            case 'week':
              dateFormat = "Week of %b %e, %Y";
              break;
            case 'month':
              dateFormat = "%b, %Y";
              break;
            default:
              dateFormat = self.options.dateFormat;
          }
          var headline = self.options.xAxis.type == 'datetime' ? Highcharts.dateFormat(dateFormat, this.x) : this.x;

          var tipOptions = self.chart.options.tooltip;
          if (tipOptions.tooltipTitles && tipOptions.tooltipTitles[this.x]) headline = tipOptions.tooltipTitles[this.x];

          // start our HTML - yes, this method has to return HTML, not actual DOM elements. Booo.
          var tip = "<div class='chart-tip" +
                    (((this.points && this.points.length == 1) || this.point) ? " single" : "") +
                    "'><h5>" + headline + "</h5><ul class='chart-metrics'>";

          var count = 0;
          // little enclosed formatter for points so we can use it for both this.points and this.point
          var formatPoint = function(point){
            count++;
            // get the value we're going to display
            var num = point.y;
            if (point.point && point.point.tipValue !== undefined) num = point.point.tipValue;
            var value = (self.options.absoluteLabels ? Math.abs(num) : num);
            // if it's a number
            if (typeOf(value) == "number"){
              // hey, let's make it fun to read
              if (value > 9999) value = value.humanize({ decimals: 1 }); // 100.1K
              else value = value.format({decimals: value % 1 ? 2 : 0}); //1,219
            }

            var tooltipOptions = point.series.tooltipOptions;
            var suffix = tooltipOptions && point.point.tipValue === undefined ? tooltipOptions.valueSuffix || "" : "";
            var prefix = tooltipOptions && point.point.tipValue === undefined ? tooltipOptions.valuePrefix || "" : "";

            var tipBackgroundColor = point.series.color;
            // if the point includes a per-point color, use that as the background color of the tooltip
            if (point.point && point.point.options && point.point.options.color) tipBackgroundColor = point.point.options.color;

            // finish our our tip. We set an explicit background color so each item in the tip matches the color
            // of its series
            tip += "<li style='background-color: " + tipBackgroundColor + "'><span class='chart-metric'>" +
                    prefix + value + suffix + "</span>" + "<span class='chart-metric-name'>" + point.series.name + "</span></li>";
          };

          // now then, if we have this.points, we loop
          if (this.points){
            // format them
            this.points.each(formatPoint);
            // if we're showing the total
            if (self.options.showTotal && (self.options.stack || self.options.columnStacking) && this.points[0].total && count > 1){
              // throw a nother point on there
              formatPoint({
                y: this.points[0].total,
                series: {
                  color: '#555',
                  name: 'Total'
                }
              });
            }
          }
          // if we aren't dealing with points, there's just the one, so format it.
          if (this.point) formatPoint(this.point);
          return tip + "</ul><div class='triangle'></div></div>";
        }
      },
      // legendary styles
      legend: {
        verticalAlign: 'top',
        floating: true,
        align: 'left',
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadow: false,
        y: this.legendTop,
        x: 17,
        margin: 0,
        useHTML: true,
        symbolWidth: 0,
        itemWidth: this.options.legendItemWidth,
        width: this.options.legendWidth,
        labelFormatter: function(){
          // lots of HTML to get those fancy FLAT-UI component styles
          var index = this.chart.series.indexOf(this);
          // get the options for the series returned from the server
          var optSeries = Object.getFromPath(this, 'chart.options.series');
          // was there a tip on the series?
          var tip = (optSeries && optSeries[index] && optSeries[index].tip) || "";

          return '<label class="checkbox ' + (tip ? 'bs-tooltip ' : '') +
              (this.visible ? 'checked' : '')  +
              ' legend-name label-index-' + index + '" ' +
              (tip ? 'title="' + tip.replace(/"/g, "&quot;").trim() + '" ' : '') +
              'style="width: ' + self.options.legendItemWidth + 'px; ' +
              (this.visible ? 'color:' + this.color : '') +
              '">' +
              '<span class="icons"><span class="first-icon fui-checkbox-unchecked"></span>' +
              '<span class="second-icon fui-checkbox-checked" data-color="' + this.color + '" style="color: ' + this.color + '"></span></span>' +
              (this.type == 'flags' ? 'Flags' : this.name) +
              '</label>';
        }
      }
    });
  },

  // given the options for the HighChart.Chart constructor, creates one if not already created.
  makeChart: function(options){
    if (!this.chart){
      this.chart = new Highcharts.Chart(this.getChartOptions(options));
      this.element.store('chart', this);
      this.fireEvent('chartCreated');
    }
    return this.chart;
  },

  /*
    updates the chart data series
    arguments:
    data (object, optional) - the HighChart options object. Can just be {series: [...]} if chart
          already rendered

    if data argument not specified, and this.options.url is, the data is fetched from the server.
    if data argument not specified, and this.options.url is not, chart is drawn from this.options.data
  */
  update: function(data){
    if (data){
      // if the series returned is > 1 we show the legend by default.
      if (data.series && data.series.length > 1 && this.options.showLegend === undefined) this.options.showLegend = true;
      if (this.options.v2Styles) this._setHeightBasedOnLegendRows(data);

      if (data.yPrefix) this.yPrefix = data.yPrefix;

      if (!this.chart){
        if (data.thanxError){
          this.setOptions({
            showTitle: true,
            showSubTitle: true
          });
        }
        this.makeChart(data);
      } else if (this.chart.series.length === data.series.length){
        data.series.each(function(series, i){
          this.chart.series[i].setData(series.data, false);
        }, this);
        this.chart.redraw();
      } else {
        this.chart.series.invoke('destroy');
        data.series.each(function(series){
          this.chart.addSeries(series, false);
        }, this);
      }
    } else {
      if (this.options.url){
        this.refresh(this.options.url);
      } else if (this.options.data){
        this.update(this.options.data);
      }
    }
    this.fireEvent('update');
    return this;
  },

  /*
    refresh the chart
    arguments:
    url (string, optional) - the url to fetch new data from. if not specified uses the last used
      url or this.options.url
  */
  refresh: function(url){
    this.url = url || this.url || this.options.url;
    if (!this.request){
      this.request = new Request.JSON({
        link: 'cancel',
        method: 'get',
        useSpinner: this.options.useSpinner,
        spinnerTarget: this.element,
        onSuccess: this.update.bind(this)
      });
    }
    this.request.setOptions({
      url: this.url
    }).send();
    return this;
  },

  // destroy the chart
  destroy: function(){
    if (this.chart) this.chart.destroy();
  },

  /*
    PRIVATE
  */

  _v2ChartTweaks: function(){
    this._drawBackgrounds();
    this._moveXAxisTitle();
  },

  _makeTooltips: function(){
    // can't use behavior to make these; Highcharts mucks with the HTML of our label. Have to Instantiate them ourselves.
    this.element.getElements('.bs-tooltip').each(function(el){
      new Bootstrap.Tooltip(el);
    });
  },

  _moveXAxisTitle: function(){
    if (this.chart && this.chart.xAxis && this.chart.xAxis[0].axisTitle) this.chart.xAxis[0].axisTitle.attr({x: this.options.margin[3]});
  },

  _setV2Defaults: function(){
    var size = this.getSizeOptions();

    this.options.legendItemWidth = this.options.legendItemWidth || size.x * 0.3;
    this.options.legendWidth = this.options.legendWidth || (size.x * 0.6) + 10;

    // overrides for v1 options when v2 is enabled (the default)
    this.setOptions(this.v2options);
    this.setOptions(this.basicChartOptions);
    Highcharts.setOptions({
      lang: {
        // removes the "Zoom: " prefix before the rangeSelector buttons
        rangeSelectorZoom: ''
      }
    });
  },
  // sets element height based on presence of title, legend, etc.
  _setElementHeight: function(legendRows){
    // legendRows defaults to zero
    legendRows = legendRows || 0;
    // we start with a default margin
    var marginTop = this.options.plotMarginTopBase;
    // if either title or subtitle is enabled, include the space for them
    if (this.options.showTitle) marginTop += this.options.titleSpace;
    if (this.options.showSubTitle) marginTop += this.options.subTitleSpace;
    // if we're showing the legend, include the margin x2 (above and below it) and then the legendRowSize * the number of rows
    if (this.options.showLegend){
      this.legendTop = marginTop.max(this.options.plotMarginTopBase);
      marginTop += (this.options.legendRowMargin * 2) + (legendRows * this.options.legendRowSize) + this.options.legendBottomMargin;
    }
    // min viable size of margin top
    marginTop = [marginTop, this.options.plotMinMarginTop].max();
    // resize the element to the appropriate size
    this.element.setStyle('height', this.options.baseHeight + marginTop);
    // update the options, which is used elsewhere.
    this.options.margin[0] = marginTop;
  },
  // given a data set to put on the chart, compute how many rows the legend will
  // take up and then call _setElementHeight based on that count
  _setHeightBasedOnLegendRows: function(data){
    // when data comes back to us
    var legendRows;
    // if the legend is enabled
    if (this.options.showLegend){
      var legendItems = 0;
      // loop over the data series
      data.series.each(function(series){
        // if the series is flags and we aren't showing them in the legend, set that
        if (!this.options.showFlagsInLegend && series.type == 'flags' && !series.data.length){
          series.showInLegend = false;
        } else {
          // otherwise incriment the number of items in the legend
          legendItems++;
        }
      }, this);
      // compute how many items will fit in a row; the element's width - the chart's margins
      var itemsPerRow = (
          this.options.legendWidth / this.options.legendItemWidth
        ).toInt();
      legendRows = (legendItems / itemsPerRow).toInt() || 1;
    }
    this._setElementHeight(legendRows);
  },
  _drawBackgrounds: function(){
    // draw the light grey box behind the main chart
    var r = this.chart.renderer;
    r.rect(0, 0, this.chart.chartWidth, this.chart.chartHeight - this.chart.marginBottom, 0, 1).attr({
        fill: '#f7f7f7'
    }).add();
    r.rect(0, this.chart.chartHeight - this.chart.marginBottom - 1, this.chart.chartWidth, 61, 0, 1).attr({
        fill: '#eff0f0'
    }).add();

    // draw a grey plot line across the top of the graph
    if (this.options.showVerticalLines){
      var line = r.crispLine(["M", 30, this.chart.plotTop, "L", this.chart.chartWidth - 30, this.chart.plotTop], 1);
      r.path(line).attr({
        stroke: '#dcdcdc',
        'stroke-width': 1
      }).add();
    }
  }
});

/*
---

name: Chart.Pie

description: The base pie chart class for Behavior-UI. Depends on HighCharts.

requires:
 - Chart

provides: [Chart.Pie]

...
*/
Chart.Pie = new Class({

  Extends: Chart,

  options: {
    seriesType: 'pie'
  },

  getChartOptions: function(options){
    var opt = Object.merge(this.parent(options), {
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: this.options.showLabels,
            color: '#000000',
            connectorColor: '#000000',
            formatter: function(){
              return '<b>'+ this.point.name +'</b>: '+ this.percentage +' %';
            }
          }
        }
      },
      tooltip: {
        shared: false
      }
    });
    return opt;
  }

});
/*
---

name: Behavior.Chart.Pie

description: Behavior for Chart.Pie.

requires:
 - Behavior/Behavior
 - Chart.Pie

provides: [Behavior.Chart.Pie]

...
*/

Behavior.addGlobalFilter('Chart.Pie', {

  defaults: {
    v2Styles: false
  },

  returns: Chart.Pie,

  setup: function(el, api){

    if (!api.getAs(Object, 'data') && !api.getAs(String, 'url')) api.fail('cannot create chart without a url or a data object.');

    var chart = new Chart.Pie(el,
      Object.cleanValues(api.getAs({
        v2Styles: Boolean,
        showTitle: Boolean,
        showSubTitle: Boolean,
        showLegend: Boolean,
        exportable: Boolean,
        showLables: Boolean,
        data: Object,
        url: String,
        useSpinner: Boolean,
        seriesType: String,
        size: Object,
        sizeToElement: Boolean,
        zoomable: Boolean,
        maxZoom: Number,
        dateFormat: String,
        plotBorderWidth: Number,
        plotBorderColor: String,
        plotBackgroundColor: String,
        backgroundColor: String,
        tooltips: Boolean
      }))
    ).addEvents({
      // when the chart is instantiated, we pass the event up to our Behavior instance
      onChartCreated: function(){
        api.fireEvent('chartCreated', [el, chart]);
      }
    }).update();
    api.onCleanup(function(){
      chart.destroy();
    });
    return chart;
  }
});
/*
---

name: Behavior.Chart.RangeMonitor

description: Monitor's a specified chart instance for changes in its range selection and triggers a specified delegator.

requires:
 - More/Date
 - Behavior/Behavior

provides: [Behavior.Chart.RangeMonitor]

...
*/

(function(){

  // monitor for date selection
  var setExtremes = function(e, api, element){
    // get the start/end values from the highchart event object
    var start = isNaN(e.min) ? new Date().decrement('month').getTime() : e.min,
        end = isNaN(e.max) ? new Date().getTime() : e.max,
        error = isNaN(e.min) || isNaN(e.max);

    var range = {
      start: new Date(start),
      end: new Date(end)
    };
    // if we're updating links
    if (api.get('links')){
      // get the format from the api for the date values
      var linkFormat = api.get('dateFormatForLinks');
      // create the ranges for that format; defaults to the integer value of the date
      var linkRanges = {
        start: linkFormat ? range.start.format(linkFormat) : range.start.getTime(),
        end: linkFormat ? range.end.format(linkFormat) : range.end.getTime()
      };
      // get each link and update the url with the ranges provided by the event
      api.getElements('links').each(function(link){
        link.set('href', new URI(link.get('href')).setData(linkRanges, true).toString());
      });
    }

    // if we're updating elements
    if (api.get('elements') || api.get('element')){
      var elementFormat = api.get('dateFormatForElements');
      // get the inputs as configured
      var singleElement = api.get('element');
      var elements = api.getAs(Object, 'elements');
      // we are updating a single element
      if (singleElement){
        var targets = element.getElements(singleElement);
        if (!targets.length) api.fail('Could not find targets for single element selector: ' + singleElement);
        if (error) targets.set('disabled', true);

        targets.each(function(target){
          var dateFormat = target.get('data-format') || elementFormat;
          var outputRange = range.start.format(dateFormat) +
                            api.get('singleInputDelimiter') +
                            range.end.format(dateFormat);
          if (target.get('tag') == 'input'){
            target.set('value', outputRange);
          } else {
            api.fireEvent('destroyDom', target);
            target.set('html', outputRange);
            api.fireEvent('ammendDom', target);
          }
        });
      // we are updating a pair of elements
      } else {
        Object.each(elements, function(selector, key){
          var targets = element.getElements(selector);
          // if there aren't any inputs found, fail
          if (!targets.length) api.fail('Could not find targets for element selector: ' + key + ' = ' + selector);
          if (error) targets.set('disabled', true);

          // otherwise update the value of each input using the date format
          targets.each(function(target){
            if (target.get('tag') == 'input'){
              target.set('value', range[key].format(target.get('data-format'), elementFormat));
            } else {
              api.fireEvent('destroyDom', target);
              target.set('html', range[key].format(target.get('data-format'), elementFormat));
              api.fireEvent('ammendDom', target);
            }
          });
        });
      }
    }
    // if we have delegators to fire, fire 'em
    if (api.getAs(Object, 'delegators')){
      Object.each(api.getAs(Object, 'delegators'), function(delegatorOptions, delegator){
        if (Delegator.verifyTargets(element, delegatorOptions, api)){
          api.getDelegator().trigger(delegator, element, null, true);
        }
      });
    }
  };

  Behavior.addGlobalFilter('Chart.RangeMonitor', {

    defaults: {
      // dateFormatForElements: Locale.get('Date.shortDate'),
      // dateFormatForLinks: if not defined, uses getTime(),
      inputsUpdateChart: false,
      singleInputDelimiter: ' - '
    },

    initializer: function(element, api){
      // set default date format inline here so we have access to Locale after config may be changed
      api.setDefault('dateFormatForElements', Locale.get('Date.shortDate'));
      // get the target - the chart element
      var target = api.getElement('target');

      // get the chart instance
      if (target.retrieve('chart')){
        // chart's already there, so let's run setup
        api.runSetup();
      } else {
        // otherwise we attach an event monitor to our Behavior instance and wait for it to be instantiated
        var monitor = function(el){
          // did the chart for THIS element get created?
          if (el == target){
            // then hey! let's run setup!
            api.runSetup();
            // and stop listening
            api.removeEvent('chartCreated', monitor);
          }
        };
        api.addEvent('chartCreated', monitor);
      }
    },

    setup: function(element, api){
      // get the target - the chart element
      var target = api.getElement('target');
      // get the chart instance
      var chart = target.retrieve('chart');
      // if there isn't a chart, fail
      if (!chart) api.fail('could not find chart for target element: ' + api.get('target'));

      if (api.get('inputsUpdateChart') && (api.get('elements') || api.get('element'))){
        var inputs;
        // get the start and end inputs
        if (api.get('element')){
          inputs = {
            start: element.getElements(api.get('element')).filter('input,select,textarea'),
            end: element.getElements(api.get('element')).filter('input,select,textarea')
          };
        } else {
          inputs = {
            start: element.getElements(api.getAs(Object, 'elements').start).filter('input,select,textarea'),
            end: element.getElements(api.getAs(Object, 'elements').end).filter('input,select,textarea')
          };
        }

        // if the selector returns more than one input, warn, and use the first
        if (inputs.start.length > 1 || inputs.end.length > 1){
          api.warn('warning: RangeMonitor can only monitor one input for start/end dates. Using first of those found');
        }
        inputs.start = inputs.start[0];
        inputs.end = inputs.end[0];
        // if there isn't both a start and end input, fail
        if (!inputs.start || !inputs.end) api.fail('cannot use the inputsUpdateChart option with RangeMonitor without both start and end inputs.');

        // method to update the range of the form
        var updateRange = function(){
          // get the dates entered
          var startValue, endValue;
          if (inputs.start == inputs.end){
            // we are affecting and responding to a single input
            var value = inputs.start.get('value').split(api.get('singleInputDelimiter'));
            startValue = Date.parse(value[0]).getTime();
            endValue = Date.parse(value[1]).getTime();
          } else {
            // we are affecting and responding to two inputs
            startValue = Date.parse(inputs.start.get('value')).getTime();
            endValue = Date.parse(inputs.end.get('value')).getTime();
          }
          var dates = {
            start: startValue,
            end: endValue
          };
          if (dates.end < dates.start) api.fail('Invalid date range; start date must be before end date');
          // if we couldn't parse the date, fail
          if (isNaN(dates.start) || isNaN(dates.end)) api.fail('cannot set chart date; cannot parse date entered.');
          // otherwise update the chart
          chart.chart.xAxis[0].setExtremes(dates.start, dates.end);
        };

        inputs.start.addEvent('change', updateRange);
        // don't fire the event twice if we are only using one input
        if (inputs.start != inputs.end) inputs.end.addEvent('change', updateRange);
      }


      if (chart.chart) setExtremes(chart.chart.xAxis[0].getExtremes(), api, element);
      chart.addEvent('setExtremes', function(e){
        setExtremes(e, api, element);
      });

      return chart;
    }
  });

})();
/*
---

name: Behavior.Chart

description: Behavior for Chart.

requires:
 - Behavior/Behavior
 - Chart

provides: [Behavior.Chart]

...
*/

Behavior.addGlobalFilter('Chart', {

  defaults: {
    exportable: true
  },

  returns: Chart,

  setup: function(el, api){

    var options = Object.cleanValues(
      api.getAs({
        v2Styles: Boolean,
        xAxis: Object,
        yAxis: Object,
        tooltips: Boolean,
        showTitle: Boolean,
        showSubTitle: Boolean,
        showLegend: Boolean,
        exportable: Boolean,
        showLabels: Boolean,
        showMarkers: Boolean,
        pointUrl: String,
        flagUrl: String,
        data: Object,
        url: String,
        useSpinner: Boolean,
        seriesType: String,
        columnStacking: String,
        columnGrouping: String,
        legendRowSize: Number,
        legendItemWidth: Number,
        baseHeight: Number,
        showFlagsInLegend: Boolean,
        navigatorSeriesColor: String,
        margin: Array,
        size: Object,
        sizeToElement: Boolean,
        zoomable: Boolean,
        dateFormat: String,
        plotBorderWidth: Number,
        plotBorderColor: String,
        plotBackgroundColor: String,
        stack: String,
        showTotal: Boolean,
        fetchEvery: Number,
        navigation: Object,
        colors: Array,
        minPointLength: Number
      })
    );

    if (api.get('dataElement')){
      var dataElement = api.getElement('dataElement', 'warn');
      if (dataElement){
        options = Object.merge(options, {
          data: {
            table: dataElement
          }
        });
      }
    }

    if (!options.data && !options.url) api.fail('cannot create chart without a url or a data object.');

    var chart = new Chart(el, options).addEvents({
      // when the chart is instantiated, we pass the event up to our Behavior instance
      onChartCreated: function(){
        api.fireEvent('chartCreated', [el, chart]);
      }
    }).update();
    api.onCleanup(function(){
      chart.destroy();
    });
    return chart;
  }
});
/*
---

name: Behavior.Chart.ShowPopup

description: Enables charts to show a popup.

requires:
 - Behavior.Chart

provides: [Behavior.Chart.ShowPopup]

...
*/
(function(){
  var getPlugin = function(prefix){
    return {
      setup: function(el, api, instance){
        // get the options from the showPopup delegator instead of our plugin
        var instanceApi = new BehaviorAPI(el, prefix);
        var selector = instanceApi.get('showPopup');
        if (selector){
          // when the user clicks a point
          instance.addEvent('pointClick', function(data){
            // get teh target; can't use instanceApi.getElement because it didn't come from our Behavior instance
            var target = el.getElement(selector);
            if (!target) api.fail('Could not find popup target for selector: ', selector);
            // get the popup and show it.
            target.getBehaviorResult('BS.Popup').show();
            // if we're mapping the point's date to an input in the popup
            var mapConfig = instanceApi.get('mapDateToInput');
            if (mapConfig && mapConfig.target){
              // get the target input
              var input = target.getElement('[name=' + mapConfig.target + ']');
              if (!input) api.fail('Could not find date input for [name=' + mapConfig.target + ']');
              // and then set the date
              input.set('value', new Date(data.x).format(mapConfig.format || '%m/%d/%Y'));
            }
          });
        }
      }
    };
  };

  Behavior.addGlobalPlugin('Chart', 'Chart.ShowPopup', getPlugin('Chart'));
  Behavior.addGlobalPlugin('Chart.Stock', 'Chart.Stock.ShowPopup', getPlugin('Chart.Stock'));

})();

/*
---

name: Chart.Stock

description: The base "stock" chart class for  Depends on HighStock.

requires:
 - More/Object.Extras
 - Chart

provides: [Chart.Stock]

...
*/

Chart.Stock = new Class({

  Extends: Chart,

  options: {
    // the color of the series in the navigator; hex, rgb, or rgba
    // if not specified uses the first color in the colors array in options
    navigatorSeriesColor: null
  },

  /*
    returns the options object for the HighCharts constructor.
    arguments:
    options (object, optional) - the options to merge with the defaults defined within this getter
  */
  getChartOptions: function(options){
    var timer, chartOptions, self = this;
    if (this.options.v2Styles){
    // HighStock calls chart.defaultSeriesType just chart.type...
      chartOptions = Object.merge(this.parent(options), {
        plotOptions: {
          series: {
            animation: {
              duration: 500,
              transition: Fx.Transitions.Pow.easeOut
            }
          }
        },
        // navigator customization
        navigator: {
          // fills area of nav scrubber that isn't displayed with a semi-opaque overlay
          maskFill: "rgba(255, 255, 255, 0.7)",
          outlineWidth: 0,
          // positioning
          margin: 90,
          height: 50,
          // behavior-ui hack!
          tweakNavigatorOptions: function(options){
            // expands the navigator so that it is as wide as the graph area above it
            options.offsetLeft = 0;
            options.offsetRight = 0;
            return options;
          },
          series: {
            lineWidth: 0,
            fillOpacity: 1
          },
          handles: {
            // custom styling for the grabbers on the side
            backgroundColor: "rgba(222,222,222, .8)",
            // only affects rifles
            borderColor: '#b6b6b7',
            // behavior-ui hack!
            tweakGrip: function(type, elem){
              // this callback is run against the grips and the rifles
              if (type == 'grip'){
                // if grip, change its size and position
                elem.attr({
                  width: 18,
                  height: 18,
                  x: -9,
                  y: 0,
                  r: 3,
                  'stroke-width': 0
                });
              } else if (type == 'rifle'){
                // if it's the rifle, just translate the position a little
                elem.translate(0,1);
              }
              // fix their stupid resizing cursor choice
              elem.css({
                cursor: 'ew-resize'
              });
            }
          },
          // xAxis config for navigator
          xAxis: {
            labels: {
              y: 12,
              useHTML: true,
              // puts the labels that read "| AUG 2013"; styled w/ css
              formatter: function(){
                var format = "%b %Y";
                // if the data returned is of insufficient length, the navigator puts labels
                // not at the beginning of the month and we get labels within months, like,
                // on the 2nd and 17th and in that case, we put the date too
                if (new Date(this.value).get('date') != 1) format = "%b %e, %Y";
                return "<p class='navigator-label'>" + new Date(this.value).format(format) + "</p>";
              }
            },
            // hide grid lines
            gridLineWidth: 0
          }
        },
        // scrollbar styles
        scrollbar: {
          height: 31,
          barBackgroundColor: '#dedede',
          barBorderColor: '#dedede',
          barBorderRadius: 4,
          barBorderWidth: 1,
          buttonArrowColor: 'rgba(0,0,0,0)',
          rifleColor: '#b6b6b7',
          trackBackgroundColor: 'rgba(0,0,0,0)',
          trackBorderColor: 'rgba(0,0,0,0)',
          trackBorderWidth: 0,
          buttonBorderWidth: 0,
          buttonBackgroundColor: 'rgba(0,0,0,0)'
        },
        rangeSelector: {
          inputEnabled: false,
          selected: 0
        },
        xAxis: {
          events: {
            afterSetExtremes: function(e){
              clearTimeout(timer);
              if (self.muteSetExtremes) return;
              timer = (function(){
                self.fireEvent('setExtremes', e);
              }).delay(200);
            }
          }
        }
      });
    } else {
      chartOptions = this.parent(options);
    }

    if (!Object.getFromPath(chartOptions, 'navigator.series')){
      chartOptions.navigator = chartOptions.navigator || {};
      chartOptions.navigator.series = {};
    }

    if (this.options.navigatorSeriesColor){
      chartOptions.navigator.series.color = this.options.navigatorSeriesColor;
    } else {
      var navColor = Object.getFromPath(options, 'navigator.series.color');
      chartOptions.navigator.series.color = navColor || this.options.colors[0];
    }
    chartOptions.navigator.series.animation = false;

    delete chartOptions.defaultSeriesType;
    if (this.options.seriesType) chartOptions.type = this.options.seriesType;

    if (chartOptions.legend && !this.options.v2Styles){
      Object.merge(chartOptions.legend, {
        align: 'left',
        verticalAlign: 'top',
        floating: true,
        y: 35,
        x: 10,
        shadow: true,
        backgroundColor: '#ffffff'
      });
    }

    return chartOptions;
  },

  // given the options for the HighChart.Chart constructor, creates one if not already created.
  makeChart: function(options){
    if (!this.chart){
      this.chart = new Highcharts.StockChart(this.getChartOptions(options));
      this.element.store('chart', this);
      this.fireEvent('chartCreated');
    }
    return this.chart;
  },

  update: function(data){
    // set navigator color to the color of the first data series object unless the data has a value
    // for navigator.series.color OR `this.options.navigatorSeriesColor` is set.
    if (data && !Object.getFromPath(data, 'navigator.series.color') && !this.options.navigatorSeriesColor &&
        data.series && data.series[0] && data.series[0].color){
      this.options.navigatorSeriesColor = this.options.navigatorSeriesColor || data.series[0].color;
    }
    this.parent.apply(this, arguments);
    if (data && (this.options.seriesType == 'column' || (data.series && data.series[0] && data.series[0].type == "column"))){
      if (this.options.columnGrouping == 'auto') this._enableAutoGrouping();
      else this._setGrouping(this.options.columnGrouping);
    }
    return this;
  },

  /*  PRIVATE */


  _setGrouping: function(group){
    if (this.grouping == group) return;

    this.grouping = group;
    this.muteSetExtremes = true;
    this.chart.series.each(function(series){
      if (series.name == "Navigator") return;
      series.update({
        dataGrouping: {
          force: true,
          units: [
            [group, [1]]
          ]
        }
      });
    });
    this.muteSetExtremes = false;

  },

  _enableAutoGrouping: function(){
    if (!this._autoGrouping){
      this._autoGrouping = true;
      var day = 86400000,
          week = day * 7,
          month = day * 30;
      var timer;
      this.addEvent('setExtremes', function(e){
        clearTimeout(timer);
        timer = (function(){
          var diff = e.max - e.min;
          if (diff > month*3) this._setGrouping('month');
          else if (diff > week * 6) this._setGrouping('week');
          else this._setGrouping('day');
        }).delay(100, this);
      }.bind(this));
    }
  },

  _v2ChartTweaks: function(){
    this.parent.apply(this, arguments);
    this._alterNavComponents();
    if (this.options.type == 'column'){
      if (this.options.columnGrouping == 'auto') this._enableGrouping();
      else this._setGrouping(this.options.columnGrouping);
    }
  },

  _setV2Defaults: function(){
    this.basicChartOptions = {};
    this.parent.apply(this, arguments);
  },

  _alterNavComponents: function(){
    var chart = this.chart, //save myself some keystrokes
        self = this;
    // if the scroller is there (not for stock charts) nudge it up to
    // clip the round corners on top
    if (chart.scroller && chart.scroller.scrollbar){
      chart.scroller.scrollbar.attr({y: -4});
      // if the range selector is there
      if (chart.rangeSelector){
        // move those buttons down to where the navigagtor is
        chart.rangeSelector.buttons.each(function(button, i){
          // yes, we have to move each button seperately
          button.attr({
            y: chart.chartHeight - 131,
            x: 20 + (i * 35)
          });
        });
      }

      // monitor the navigator for mouse enter/leave so we can hide/show the grips and scrubber bar
      var isOverNavigator;
      chart.container.addEvent('mouseover', function(e){
        // chart.pointer.normalize expects e.pageX/Y and e.clientX/Y
        e.pageX = e.page.x;
        e.pageY = e.page.y;
        e.clientX = e.client.x;
        e.clientY = e.client.y;
        // this bit of code is basically cribbed from highchart::scroller.mouseDownHandler
        e = chart.pointer.normalize(e);
        var top = chart.scroller.top - 50,
            chartY = e.chartY,
            height = chart.scroller.height + 50,
            scrollbarHeight = chart.scroller.scrollbarHeight + 20;
        if (chartY > top && chartY < top + height + scrollbarHeight){ // we're vertically inside the navigator
          if (!isOverNavigator){
            self.fireEvent('mouseoverNavigator');
            isOverNavigator = true;
          }
        } else {
          if (isOverNavigator){
            self.fireEvent('mouseoutNavigator');
            isOverNavigator = false;
          }
        }
      });

      this.addEvents({
        mouseoutNavigator: this._hideNavComponents.bind(this),
        mouseoverNavigator: this._showNavComponents.bind(this)
      });

      this.element.addEvent('mouseleave', function(){
        this.fireEvent('mouseoutNavigator');
        isOverNavigator = false;
      }.bind(this));

      // hide the nav components on start, bake in a short delay
      // because, for some reason, the chart needs it (TA-4530).
      this._hideNavComponents.delay(100, this);
    }
  },
  // hides grips and scrubber bar
  _hideNavComponents: function(force){
    var chart = this.chart;
    if (!chart.scroller) return;
    // if the user is still dragging, don't hide controls
    if (!force && (chart.scroller.grabbedLeft || chart.scroller.grabbedRight || chart.scroller.grabbedCenter)) return;
    // hide all the various elements
    // scrollbar stuff
    chart.scroller.scrollbar.hide();
    chart.scroller.scrollbarGroup.hide();
    chart.scroller.scrollbarRifles.hide();
    // grips and whatnot
    chart.scroller.elementsToDestroy.each(function (elem){
      elem.hide();
    });
    this.navControlsHidden = true;
  },
  // shows grips and scrubber bar
  _showNavComponents: function(){
    // see method above
    var chart = this.chart;
    if (!chart.scroller) return;
    chart.scroller.scrollbar.show();
    chart.scroller.scrollbarGroup.show();
    chart.scroller.scrollbarRifles.show();
    chart.scroller.elementsToDestroy.each(function (elem){
      elem.show();
    });
    this.navControlsHidden = false;
  }

});

/*
---

name: Behavior.Chart.Stock

description: Behavior for Chart.Stock.

requires:
 - Chart.Stock
 - Behavior/Behavior
 - More/Date

provides: [Behavior.Chart.Stock]

...
*/

Behavior.addGlobalFilter('Chart.Stock', {

  defaults: {
    exportable: true
  },

  returns: Chart.Stock,

  setup: function(el, api){

    var options = Object.cleanValues(
      api.getAs({
        v2Styles: Boolean,
        xAxis: Object,
        yAxis: Object,
        tooltips: Boolean,
        showTitle: Boolean,
        showSubTitle: Boolean,
        showLegend: Boolean,
        exportable: Boolean,
        showLabels: Boolean,
        showMarkers: Boolean,
        pointUrl: String,
        flagUrl: String,
        data: Object,
        url: String,
        useSpinner: Boolean,
        seriesType: String,
        columnStacking: String,
        columnGrouping: String,
        legendRowSize: Number,
        legendItemWidth: Number,
        baseHeight: Number,
        showFlagsInLegend: Boolean,
        navigatorSeriesColor: String,
        margin: Array,
        size: Object,
        sizeToElement: Boolean,
        zoomable: Boolean,
        dateFormat: String,
        plotBorderWidth: Number,
        plotBorderColor: String,
        plotBackgroundColor: String,
        stack: String,
        showTotal: Boolean,
        fetchEvery: Number,
        navigation: Object,
        colors: Array,
        minPointLength: Number
      })
    );

    if (api.get('dataElement')){
      var dataElement = api.getElement('dataElement', 'warn');
      if (dataElement){
        options = Object.merge(options, {
          data: {
            table: dataElement
          }
        });
      }
    }

    if (!options.data && !options.url) api.fail('cannot create chart without a url or a data object.');

    var chart = new Chart.Stock(el, options).addEvents({
      // when the chart is instantiated, we pass the event up to our Behavior instance
      onChartCreated: function(){
        api.fireEvent('chartCreated', [el, chart]);
      }
    }).update();
    api.onCleanup(function(){
      chart.destroy();
    });
    return chart;
  }
});
/*
---

name: Behavior.ToSource

description: Behavior for displaying the source of the element with this behavior as the content of a target element.

requires:
 - Behavior/Behavior

provides: [Behavior.ToSource]

...
*/

Behavior.addGlobalFilter('ToSource', {
  setup: function(element, api){
    var target = api.getElement('target');
    element.store('toSourceTarget', target);
    if (api.getAs(Boolean, 'includeHTML')){
      target.adopt(new Element('pre', {text: element.outerHTML}));
    }
  }
});

['Chart', 'Chart.Stock'].each(function(name){
  Behavior.addGlobalPlugin(name, name + '.ToSource', function(el, api, instance){
    if (el.hasBehavior('ToSource')){
      instance.addEvent('update', function(){
        new Element('h4', {html: 'JSON: '}).inject(el.retrieve('toSourceTarget'));
        new Element('i.json', { html: instance.request.response.text }).inject(el.retrieve('toSourceTarget'));
      });
    }
  });
});


/*
---

script: Drag.js

name: Drag

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
  - Valerio Proietti
  - Tom Occhinno
  - Jan Kassens

requires:
  - Core/Events
  - Core/Options
  - Core/Element.Event
  - Core/Element.Style
  - Core/Element.Dimensions
  - MooTools.More

provides: [Drag]
...

*/

var Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: function(thisElement){},
		onStart: function(thisElement, event){},
		onSnap: function(thisElement){},
		onDrag: function(thisElement, event){},
		onCancel: function(thisElement){},
		onComplete: function(thisElement, event){},*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		preventDefault: false,
		stopPropagation: false,
		compensateScroll: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {
			'options': Type.isObject,
			'element': function(obj){
				return obj != null;
			}
		});

		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = typeOf(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};
		this.offsetParent = (function(el){
			var offsetParent = el.getOffsetParent();
			var isBody = !offsetParent || (/^(?:body|html)$/i).test(offsetParent.tagName);
			return isBody ? window : document.id(offsetParent);
		})(this.element);
		this.selection = 'selectstart' in document ? 'selectstart' : 'mousedown';

		this.compensateScroll = {start: {}, diff: {}, last: {}};

		if ('ondragstart' in document && !('FileReader' in window) && !Drag.ondragstartFixed){
			document.ondragstart = Function.from(false);
			Drag.ondragstartFixed = true;
		}

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: Function.from(false),
			scrollListener: this.scrollListener.bind(this)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		if (this.options.compensateScroll) this.offsetParent.addEvent('scroll', this.bound.scrollListener);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		if (this.options.compensateScroll) this.offsetParent.removeEvent('scroll', this.bound.scrollListener);
		return this;
	},

	scrollListener: function(){

		if (!this.mouse.start) return;
		var newScrollValue = this.offsetParent.getScroll();

		if (this.element.getStyle('position') == 'absolute'){
			var scrollDiff = this.sumValues(newScrollValue, this.compensateScroll.last, -1);
			this.mouse.now = this.sumValues(this.mouse.now, scrollDiff, 1);
		} else {
			this.compensateScroll.diff = this.sumValues(newScrollValue, this.compensateScroll.start, -1);
		}
		if (this.offsetParent != window) this.compensateScroll.diff = this.sumValues(this.compensateScroll.start, newScrollValue, -1);
		this.compensateScroll.last = newScrollValue;
		this.render(this.options);
	},

	sumValues: function(alpha, beta, op){
		var sum = {}, options = this.options;
		for (z in options.modifiers){
			if (!options.modifiers[z]) continue;
			sum[z] = alpha[z] + beta[z] * op;
		}
		return sum;
	},

	start: function(event){
		var options = this.options;

		if (event.rightClick) return;

		if (options.preventDefault) event.preventDefault();
		if (options.stopPropagation) event.stopPropagation();
		this.compensateScroll.start = this.compensateScroll.last = this.offsetParent.getScroll();
		this.compensateScroll.diff = {x: 0, y: 0};
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);

		var limit = options.limit;
		this.limit = {x: [], y: []};

		var z, coordinates, offsetParent = this.offsetParent == window ? null : this.offsetParent;
		for (z in options.modifiers){
			if (!options.modifiers[z]) continue;

			var style = this.element.getStyle(options.modifiers[z]);

			// Some browsers (IE and Opera) don't always return pixels.
			if (style && !style.match(/px$/)){
				if (!coordinates) coordinates = this.element.getCoordinates(offsetParent);
				style = coordinates[options.modifiers[z]];
			}

			if (options.style) this.value.now[z] = (style || 0).toInt();
			else this.value.now[z] = this.element[options.modifiers[z]];

			if (options.invert) this.value.now[z] *= -1;

			this.mouse.pos[z] = event.page[z] - this.value.now[z];

			if (limit && limit[z]){
				var i = 2;
				while (i--){
					var limitZI = limit[z][i];
					if (limitZI || limitZI === 0) this.limit[z][i] = (typeof limitZI == 'function') ? limitZI() : limitZI;
				}
			}
		}

		if (typeOf(this.options.grid) == 'number') this.options.grid = {
			x: this.options.grid,
			y: this.options.grid
		};

		var events = {
			mousemove: this.bound.check,
			mouseup: this.bound.cancel
		};
		events[this.selection] = this.bound.eventStop;
		this.document.addEvents(events);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		var options = this.options;
		if (options.preventDefault) event.preventDefault();
		this.mouse.now = this.sumValues(event.page, this.compensateScroll.diff, -1);

		this.render(options);
		this.fireEvent('drag', [this.element, event]);
	},  

	render: function(options){
		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];

			if (options.invert) this.value.now[z] *= -1;
			if (options.limit && this.limit[z]){
				if ((this.limit[z][1] || this.limit[z][1] === 0) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ((this.limit[z][0] || this.limit[z][0] === 0) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			if (options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % options.grid[z]);
			if (options.style) this.element.setStyle(options.modifiers[z], this.value.now[z] + options.unit);
			else this.element[options.modifiers[z]] = this.value.now[z];
		}
	},

	cancel: function(event){
		this.document.removeEvents({
			mousemove: this.bound.check,
			mouseup: this.bound.cancel
		});
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		var events = {
			mousemove: this.bound.drag,
			mouseup: this.bound.stop
		};
		events[this.selection] = this.bound.eventStop;
		this.document.removeEvents(events);
		this.mouse.start = null;
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, Object.merge({
			modifiers: {
				x: 'width',
				y: 'height'
			}
		}, options));

		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});

/*
---

script: Slider.js

name: Slider

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Element.Dimensions
  - Core/Number
  - Class.Binds
  - Drag
  - Element.Measure

provides: [Slider]

...
*/

var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {/*
		onTick: function(intPosition){},
		onMove: function(){},
		onChange: function(intStep){},
		onComplete: function(strStep){},*/
		onTick: function(position){
			this.setKnobPosition(position);
		},
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		options = this.options;
		this.element = document.id(element);
		knob = this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = options.initialStep ? options.initialStep : options.range ? options.range[0] : 0;

		var limit = {},
			modifiers = {x: false, y: false};

		switch (options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				this.offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				this.offset = 'offsetWidth';
		}

		this.setSliderDimensions();
		this.setRange(options.range, null, true);

		if (knob.getStyle('position') == 'static') knob.setStyle('position', 'relative');
		knob.setStyle(this.property, -options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [-options.offset, this.full - options.offset];

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onCancel: function(){
				this.isDragging = false;
			}.bind(this),
			onComplete: function(){
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};
		if (options.snap) this.setSnap(dragOptions);

		this.drag = new Drag(knob, dragOptions);
		if (options.initialStep != null) this.set(options.initialStep, true);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement)
			.removeEvent('mousewheel', this.scrolledElement);
		this.drag.detach();
		return this;
	},

	autosize: function(){
		this.setSliderDimensions()
			.setKnobPosition(this.toPosition(this.step));
		this.drag.options.limit[this.axis] = [-this.options.offset, this.full - this.options.offset];
		if (this.options.snap) this.setSnap();
		return this;
	},

	setSnap: function(options){
		if (!options) options = this.drag.options;
		options.grid = Math.ceil(this.stepWidth);
		options.limit[this.axis][1] = this.element[this.offset];
		return this;
	},

	setKnobPosition: function(position){
		if (this.options.snap) position = this.toPosition(this.step);
		this.knob.setStyle(this.property, position);
		return this;
	},

	setSliderDimensions: function(){
		this.full = this.element.measure(function(){
			this.half = this.knob[this.offset] / 2;
			return this.element[this.offset] - this.knob[this.offset] + (this.options.offset * 2);
		}.bind(this));
		return this;
	},

	set: function(step, silently){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = (step).round(this.modulus.decimalLength);
		if (silently) this.checkStep().setKnobPosition(this.toPosition(this.step));
		else this.checkStep().fireEvent('tick', this.toPosition(this.step)).fireEvent('move').end();
		return this;
	},

	setRange: function(range, pos, silently){
		this.min = Array.pick([range[0], 0]);
		this.max = Array.pick([range[1], this.options.steps]);
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		var stepSize = this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range);
		this.setModulus();

		if (range) this.set(Array.pick([pos, this.step]).limit(this.min,this.max), silently);
		return this;
	},
    
	setModulus: function(){
		var decimals = ((this.stepSize + '').split('.')[1] || []).length,
			modulus = 1 + '';
		while (decimals--) modulus += '0';
		this.modulus = {multiplier: (modulus).toInt(10), decimalLength: modulus.length - 1};
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1,
			position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;

		position = position.limit(-this.options.offset, this.full - this.options.offset);

		this.step = (this.min + dir * this.toStep(position)).round(this.modulus.decimalLength);

		this.checkStep()
			.fireEvent('tick', position)
			.fireEvent('move')
			.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(this.step + (mode ? -1 : 1) * this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1,
			position = this.drag.value.now[this.axis];

		position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = (this.min + dir * this.toStep(position)).round(this.modulus.decimalLength);
		this.checkStep();
		this.fireEvent('move');
	},

	checkStep: function(){
		var step = this.step;
		if (this.previousChange != step){
			this.previousChange = step;
			this.fireEvent('change', step);
		}
		return this;
	},

	end: function(){
		var step = this.step;
		if (this.previousEnd !== step){
			this.previousEnd = step;
			this.fireEvent('complete', step + '');
		}
		return this;
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? (step - (step * this.modulus.multiplier) % (this.stepSize * this.modulus.multiplier) / this.modulus.multiplier).round(this.modulus.decimalLength) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset || 0;
	}

});

/*
---

script: Color.js

name: Color

description: Class for creating and manipulating colors in JavaScript. Supports HSB -> RGB Conversions and vice versa.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Array
  - Core/String
  - Core/Number
  - Core/Hash
  - Core/Function
  - MooTools.More

provides: [Color]

...
*/

(function(){

var Color = this.Color = new Type('Color', function(color, type){
	if (arguments.length >= 3){
		type = 'rgb'; color = Array.slice(arguments, 0, 3);
	} else if (typeof color == 'string'){
		if (color.match(/rgb/)) color = color.rgbToHex().hexToRgb(true);
		else if (color.match(/hsb/)) color = color.hsbToRgb();
		else color = color.hexToRgb(true);
	}
	type = type || 'rgb';
	switch (type){
		case 'hsb':
			var old = color;
			color = color.hsbToRgb();
			color.hsb = old;
		break;
		case 'hex': color = color.hexToRgb(true); break;
	}
	color.rgb = color.slice(0, 3);
	color.hsb = color.hsb || color.rgbToHsb();
	color.hex = color.rgbToHex();
	return Object.append(color, this);
});

Color.implement({

	mix: function(){
		var colors = Array.slice(arguments);
		var alpha = (typeOf(colors.getLast()) == 'number') ? colors.pop() : 50;
		var rgb = this.slice();
		colors.each(function(color){
			color = new Color(color);
			for (var i = 0; i < 3; i++) rgb[i] = Math.round((rgb[i] / 100 * (100 - alpha)) + (color[i] / 100 * alpha));
		});
		return new Color(rgb, 'rgb');
	},

	invert: function(){
		return new Color(this.map(function(value){
			return 255 - value;
		}));
	},

	setHue: function(value){
		return new Color([value, this.hsb[1], this.hsb[2]], 'hsb');
	},

	setSaturation: function(percent){
		return new Color([this.hsb[0], percent, this.hsb[2]], 'hsb');
	},

	setBrightness: function(percent){
		return new Color([this.hsb[0], this.hsb[1], percent], 'hsb');
	}

});

this.$RGB = function(r, g, b){
	return new Color([r, g, b], 'rgb');
};

this.$HSB = function(h, s, b){
	return new Color([h, s, b], 'hsb');
};

this.$HEX = function(hex){
	return new Color(hex, 'hex');
};

Array.implement({

	rgbToHsb: function(){
		var red = this[0],
				green = this[1],
				blue = this[2],
				hue = 0;
		var max = Math.max(red, green, blue),
				min = Math.min(red, green, blue);
		var delta = max - min;
		var brightness = max / 255,
				saturation = (max != 0) ? delta / max : 0;
		if (saturation != 0){
			var rr = (max - red) / delta;
			var gr = (max - green) / delta;
			var br = (max - blue) / delta;
			if (red == max) hue = br - gr;
			else if (green == max) hue = 2 + rr - br;
			else hue = 4 + gr - rr;
			hue /= 6;
			if (hue < 0) hue++;
		}
		return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
	},

	hsbToRgb: function(){
		var br = Math.round(this[2] / 100 * 255);
		if (this[1] == 0){
			return [br, br, br];
		} else {
			var hue = this[0] % 360;
			var f = hue % 60;
			var p = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
			var q = Math.round((this[2] * (6000 - this[1] * f)) / 600000 * 255);
			var t = Math.round((this[2] * (6000 - this[1] * (60 - f))) / 600000 * 255);
			switch (Math.floor(hue / 60)){
				case 0: return [br, t, p];
				case 1: return [q, br, p];
				case 2: return [p, br, t];
				case 3: return [p, q, br];
				case 4: return [t, p, br];
				case 5: return [br, p, q];
			}
		}
		return false;
	}

});

String.implement({

	rgbToHsb: function(){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHsb() : null;
	},

	hsbToRgb: function(){
		var hsb = this.match(/\d{1,3}/g);
		return (hsb) ? hsb.hsbToRgb() : null;
	}

});

})();


/*
---

name: ColorPicker

description: MooRainbow is a ColorPicker for MooTools 1.3 and higher

license: http://www.opensource.org/licenses/mit-license.php

source: https://github.com/CBeloch/mooRainbow/

authors:
  - Djamil Legato (w00fz)
  - Christopher Beloch

requires:
  - More/Slider
  - More/Drag
  - More/Color

provides: [ColorPicker, mooRainbow]

...
*/

var MooRainbow = ColorPicker = new Class({options: {
    id: 'mooRainbow',
    prefix: 'moor-',
    imgPath: 'images/',
    getImage: function(file){
      return this.options.imgPath + file;
    },
    startColor: [255, 0, 0],
    wheel: false,
    onComplete: Class.empty,
    onChange: Class.empty,
    setOnStart: false
  },

  initialize: function(el, options){
    this.element = document.id(el); if (!this.element) return;
    this.setOptions(options);

    this.sliderPos = 0;
    this.pickerPos = {x: 0, y: 0};
    this.backupColor = this.options.startColor;
    this.currentColor = this.options.startColor;
    this.sets = {
      rgb: [],
      hsb: [],
      hex: []
    };
    this.pickerClick = this.sliderClick  = false;
    if (!this.layout) this.doLayout();
    this.OverlayEvents();
    this.sliderEvents();
    this.backupEvent();
    if (this.options.wheel) this.wheelEvents();
    this.element.addEvent('click', function(e){ this.toggle(e); }.bind(this));

    this.layout.overlay.setStyle('background-color', this.options.startColor.rgbToHex());
    this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());

    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;

    if (this.options.setOnStart) this.manualSet(this.options.startColor);

    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;
    this.sliderPos = this.snippet('arrPos') - this.snippet('arrSize', 'int');

    if (window.khtml) this.hide();
  },

  toggle: function(){
    this[this.visible ? 'hide' : 'show']();
  },

  show: function(){
    this.rePosition();
    this.layout.setStyle('display', 'block');
    this.layout.set('aria-hidden', 'false');
    this.visible = true;
  },

  hide: function(){
    this.layout.setStyles({'display': 'none'});
    this.layout.set('aria-hidden', 'true');
    this.visible = false;
  },

  manualSet: function(color, type){
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb'){ rgb = color; hsb = color.rgbToHsb(); hex = color.rgbToHex(); }
    else if (type == 'hsb'){ hsb = color; rgb = color.hsbToRgb(); hex = rgb.rgbToHex(); }
    else { hex = color; rgb = color.hexToRgb(true); hsb = rgb.rgbToHsb(); }

    this.setMooRainbow(rgb);
    this.autoSet(hsb);
  },

  autoSet: function(hsb){
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    var oveH = this.layout.overlay.height;
    var oveW = this.layout.overlay.width;
    var sliH = this.layout.slider.height;
    var arwH = this.snippet('arrSize', 'int');
    var hue;

    var posx = Math.round(((oveW * hsb[1]) / 100) - curW);
    var posy = Math.round(- ((oveH * hsb[2]) / 100) + oveH - curH);

    var c = Math.round(((sliH * hsb[0]) / 360)); c = (c == 360) ? 0 : c;
    var position = sliH - c + this.snippet('slider') - arwH;
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();

    this.layout.cursor.setStyles({'top': posy, 'left': posx});
    this.layout.arrows.setStyle('top', position);
    this.layout.overlay.setStyle('background-color', hue);
    this.sliderPos = this.snippet('arrPos') - arwH;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;
  },

  setMooRainbow: function(color, type){
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb'){ rgb = color; hsb = color.rgbToHsb(); hex = color.rgbToHex(); }
    else if (type == 'hsb'){ hsb = color; rgb = color.hsbToRgb(); hex = rgb.rgbToHex(); }
    else { hex = color; rgb = color.hexToRgb(); hsb = rgb.rgbToHsb(); }

    this.sets = {
      rgb: rgb,
      hsb: hsb,
      hex: hex
    };

    if (!this.pickerPos.x)
      this.autoSet(hsb);

    this.RedInput.value = rgb[0];
    this.GreenInput.value = rgb[1];
    this.BlueInput.value = rgb[2];
    this.HueInput.value = hsb[0];
    this.SatuInput.value =  hsb[1];
    this.BrighInput.value = hsb[2];
    this.hexInput.value = hex;

    this.currentColor = rgb;

    this.chooseColor.setStyle('background-color', rgb.rgbToHex());

    this.fireEvent('onChange', [this.sets, this]);
  },

  parseColors: function(x, y, z){
    var s = Math.round((x * 100) / this.layout.overlay.width);
    var b = 100 - Math.round((y * 100) / this.layout.overlay.height);
    var h = 360 - Math.round((z * 360) / this.layout.slider.height) + this.snippet('slider') - this.snippet('arrSize', 'int');
    h -= this.snippet('arrSize', 'int');
    h = (h >= 360) ? 0 : (h < 0) ? 0 : h;
    s = (s > 100) ? 100 : (s < 0) ? 0 : s;
    b = (b > 100) ? 100 : (b < 0) ? 0 : b;

    return [h, s, b];
  },

  OverlayEvents: function(){
    var lim, curH, curW, inputs;
    curH = this.snippet('curSize', 'int').h;
    curW = this.snippet('curSize', 'int').w;
    inputs = this.arrRGB.concat(this.arrHSB, this.hexInput);

    document.addEvent('click', function(){
      if(this.visible) this.hide(this.layout);
    }.bind(this));

    inputs.each(function(el){
      el.addEvent('keydown', this.eventKeydown.bind(this, el));
      el.addEvent('keyup', this.eventKeyup.bind(this, el));
    }, this);
    [this.element, this.layout].each(function(el){
      el.addEvents({
        'click': function(e){ e.stop(); },
        'keyup': function(e){
          if(e.key == 'esc' && this.visible) this.hide(this.layout);
        }.bind(this)
      }, this);
    }, this);

    lim = {
      x: [0 - curW, (this.layout.overlay.width - curW)],
      y: [0 - curH, (this.layout.overlay.height - curH)]
    };

    this.layout.drag = new Drag(this.layout.cursor, {
      onStart: this.overlayDrag.bind(this),
      onDrag: this.overlayDrag.bind(this),
      snap: 0
    });

    this.layout.overlay2.addEvent('mousedown', function(e){
      this.layout.cursor.setStyles({
        'top': e.page.y - this.layout.overlay.getTop() - curH,
        'left': e.page.x - this.layout.overlay.getLeft() - curW
      });
                        this.overlayDrag.call(this);
      this.layout.drag.start(e);
    }.bind(this));

    this.okButton.addEvent('click', function(){
      if(this.currentColor == this.options.startColor){
        this.hide();
        this.fireEvent('onComplete', [this.sets, this]);
      }
      else {
        this.backupColor = this.currentColor;
        this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());
        this.hide();
        this.fireEvent('onComplete', [this.sets, this]);
      }
    }.bind(this));
  },

  overlayDrag: function(){
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;

    this.setMooRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    this.fireEvent('onChange', [this.sets, this]);
  },

  sliderEvents: function(){
    var arwH = this.snippet('arrSize', 'int'), lim;

    lim = [0 + this.snippet('slider') - arwH, this.layout.slider.height - arwH + this.snippet('slider')];
    this.layout.sliderDrag = new Drag(this.layout.arrows, {
      limit: {y: lim},
      modifiers: {x: false},
      onStart: this.sliderDrag.bind(this),
      onDrag: this.sliderDrag.bind(this),
      snap: 0
    });

    this.layout.slider.addEvent('mousedown', function(e){
      this.layout.arrows.setStyle(
        'top', e.page.y - this.layout.slider.getTop() + this.snippet('slider') - arwH
      );
                        this.sliderDrag.call(this);
      this.layout.sliderDrag.start(e);
    }.bind(this));
  },

  sliderDrag: function(){
    var arwH = this.snippet('arrSize', 'int'), hue;

    this.sliderPos = this.snippet('arrPos') - arwH;
    this.setMooRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();
    this.layout.overlay.setStyle('background-color', hue);
    this.fireEvent('onChange', [this.sets, this]);
  },

  backupEvent: function(){
    this.layout.backup.addEvent('click', function(){
      this.manualSet(this.backupColor);
      this.fireEvent('onChange', [this.sets, this]);
    }.bind(this));
  },

  wheelEvents: function(){
    var arrColors = this.arrRGB.copy().extend(this.arrHSB);

    arrColors.each(function(el){
      el.addEvents({
        'mousewheel': function(e){
          this.eventKeys(e, el);
        }.bind(this),
        'keydown': function(e){
          this.eventKeys(e, el);
        }.bind(this)
      });
    }, this);

    [this.layout.arrows, this.layout.slider].each(function(el){
      el.addEvents({
        'mousewheel': function(e){
          this.eventKeys(e, this.arrHSB[0], 'slider');
        }.bind(this),
        'keydown': function(e){
          this.eventKeys(e, this.arrHSB[0], 'slider');
        }.bind(this)
      });
    }, this);
  },

  eventKeys: function(e, el, id){
    var wheel, type;
    id = (!id) ? el.id : this.arrHSB[0];

    if (e.type == 'keydown'){
      if (e.key == 'up') wheel = 1;
      else if (e.key == 'down') wheel = -1;
      else return;
    } else if (e.type == Element.Events.mousewheel.type) wheel = (e.wheel > 0) ? 1 : -1;

    if (this.arrRGB.test(el)) type = 'rgb';
    else if (this.arrHSB.test(el)) type = 'hsb';
    else type = 'hsb';

    if (type == 'rgb'){
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = el.value.toInt() + wheel;
      value = (value > 255) ? 255 : (value < 0) ? 0 : value;

      switch(el.className){
        case prefix + 'rInput': pass = [value, rgb[1], rgb[2]];  break;
        case prefix + 'gInput': pass = [rgb[0], value, rgb[2]];  break;
        case prefix + 'bInput':  pass = [rgb[0], rgb[1], value];  break;
        default : pass = rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = el.value.toInt() + wheel;

      if (el.className.test(/(HueInput)/)) value = (value > 359) ? 0 : (value < 0) ? 0 : value;
      else value = (value > 100) ? 100 : (value < 0) ? 0 : value;

      switch(el.className){
        case prefix + 'HueInput': pass = [value, hsb[1], hsb[2]]; break;
        case prefix + 'SatuInput': pass = [hsb[0], value, hsb[2]]; break;
        case prefix + 'BrighInput':  pass = [hsb[0], hsb[1], value]; break;
        default : pass = hsb;
      }
      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    }
    e.stop();
  },

  eventKeydown: function(el, e){
    var n = e.code, k = e.key;

    if   ((!el.className.test(/hexInput/) && !(n >= 48 && n <= 57)) &&
      (k!='backspace' && k!='tab' && k !='delete' && k!='left' && k!='right'))
    e.stop();
  },

  eventKeyup: function(el, e){
    var n = e.code, k = e.key, pass, prefix, chr = el.value.charAt(0);

    if (!(el.value || el.value === 0)) return;
    if (el.className.test(/hexInput/)){
      if (chr != "#" && el.value.length != 6) return;
      if (chr == '#' && el.value.length != 7) return;
    } else {
      if (!(n >= 48 && n <= 57) && (!['backspace', 'tab', 'delete', 'left', 'right'].test(k)) && el.value.length > 3) return;
    }

    prefix = this.options.prefix;

    if (el.className.test(/(rInput|gInput|bInput)/)){
      if (el.value  < 0 || el.value > 255) return;
      switch(el.className){
        case prefix + 'rInput': pass = [el.value, this.sets.rgb[1], this.sets.rgb[2]]; break;
        case prefix + 'gInput': pass = [this.sets.rgb[0], el.value, this.sets.rgb[2]]; break;
        case prefix + 'bInput': pass = [this.sets.rgb[0], this.sets.rgb[1], el.value]; break;
        default : pass = this.sets.rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    }
    else if (!el.className.test(/hexInput/)){
      if (el.className.test(/HueInput/) && el.value  < 0 || el.value > 360) return;
      else if (el.className.test(/HueInput/) && el.value == 360) el.value = 0;
      else if (el.className.test(/(SatuInput|BrighInput)/) && el.value  < 0 || el.value > 100) return;
      switch(el.className){
        case prefix + 'HueInput': pass = [el.value, this.sets.hsb[1], this.sets.hsb[2]]; break;
        case prefix + 'SatuInput': pass = [this.sets.hsb[0], el.value, this.sets.hsb[2]]; break;
        case prefix + 'BrighInput': pass = [this.sets.hsb[0], this.sets.hsb[1], el.value]; break;
        default : pass = this.sets.hsb;
      }
      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      pass = el.value.hexToRgb(true);
      if (isNaN(pass[0])||isNaN(pass[1])||isNaN(pass[2])) return;

      if (pass || pass === 0){
        this.manualSet(pass);
        this.fireEvent('onChange', [this.sets, this]);
      }
    }

  },

  doLayout: function(){
    var id = this.options.id, prefix = this.options.prefix;
    var idPrefix = id + ' .' + prefix;

    this.layout = new Element('div', {
      'styles': {'display': 'block', 'position': 'absolute'},
      'id': id
    }).inject(document.body);

    var box = new Element('div', {
      'styles':  {'position': 'relative'},
      'class': prefix + 'box'
    }).inject(this.layout);

    var div = new Element('div', {
      'styles': {'position': 'absolute', 'overflow': 'hidden'},
      'class': prefix + 'overlayBox'
    }).inject(box);

    var ar = new Element('div', {
      'styles': {'position': 'absolute', 'zIndex': 1},
      'class': prefix + 'arrows'
    }).inject(box);
    ar.width = ar.getStyle('width').toInt();
    ar.height = ar.getStyle('height').toInt();

    var ov = new Element('img', {
      'styles': {'background-color': '#fff', 'position': 'relative', 'zIndex': 2},
      'src': this.options.getImage.apply(this, ['moor_woverlay.png']),
      'class': prefix + 'overlay'
    }).inject(div);

    var ov2 = new Element('img', {
      'styles': {'position': 'absolute', 'top': 0, 'left': 0, 'zIndex': 2},
      'src': this.options.getImage.apply(this, ['moor_boverlay.png']),
      'class': prefix + 'overlay'
    }).inject(div);

    if (window.ie6){
      div.setStyle('overflow', '');
      var src = ov.src;
      ov.src = this.options.getImage.apply(this, ['blank.gif']);
      ov.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
      src = ov2.src;
      ov2.src = this.options.getImage.apply(this, ['blank.gif']);
      ov2.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
    }
    ov.width = ov2.width = div.getStyle('width').toInt();
    ov.height = ov2.height = div.getStyle('height').toInt();

    var cr = new Element('div', {
      'styles': {'overflow': 'hidden', 'position': 'absolute', 'zIndex': 2},
      'class': prefix + 'cursor'
    }).inject(div);
    cr.width = cr.getStyle('width').toInt();
    cr.height = cr.getStyle('height').toInt();

    var sl = new Element('img', {
      'styles': {'position': 'absolute', 'z-index': 2},
      'src': this.options.getImage.apply(this, ['moor_slider.png']),
      'class': prefix + 'slider'
    }).inject(box);
    this.layout.slider = Slick.find(document, '#' + idPrefix + 'slider');
    sl.width = sl.getStyle('width').toInt();
    sl.height = sl.getStyle('height').toInt();

    new Element('div', {
      'styles': {'position': 'absolute'},
      'class': prefix + 'colorBox'
    }).inject(box);

    new Element('div', {
      'styles': {'zIndex': 2, 'position': 'absolute'},
      'class': prefix + 'chooseColor'
    }).inject(box);

    this.layout.backup = new Element('div', {
      'styles': {'zIndex': 2, 'position': 'absolute', 'cursor': 'pointer'},
      'class': prefix + 'currentColor'
    }).inject(box);

    var R = new Element('label').inject(box).setStyle('position', 'absolute');
    var G = R.clone().inject(box).addClass(prefix + 'gLabel').appendText('G: ');
    var B = R.clone().inject(box).addClass(prefix + 'bLabel').appendText('B: ');
    R.appendText('R: ').addClass(prefix + 'rLabel');

    var inputR = new Element('input');
    var inputG = inputR.clone().inject(G).addClass(prefix + 'gInput');
    var inputB = inputR.clone().inject(B).addClass(prefix + 'bInput');
    inputR.inject(R).addClass(prefix + 'rInput');

    var HU = new Element('label').inject(box).setStyle('position', 'absolute');
    var SA = HU.clone().inject(box).addClass(prefix + 'SatuLabel').appendText('S: ');
    var BR = HU.clone().inject(box).addClass(prefix + 'BrighLabel').appendText('B: ');
    HU.appendText('H: ').addClass(prefix + 'HueLabel');

    var inputHU = new Element('input');
    var inputSA = inputHU.clone().inject(SA).addClass(prefix + 'SatuInput');
    var inputBR = inputHU.clone().inject(BR).addClass(prefix + 'BrighInput');
    inputHU.inject(HU).addClass(prefix + 'HueInput');
    SA.appendText(' %'); BR.appendText(' %');
    (new Element('span', {'styles': {'position': 'absolute'}, 'class': prefix + 'ballino'}).set('html', " &deg;").inject(HU, 'after'));

    var hex = new Element('label').inject(box).setStyle('position', 'absolute').addClass(prefix + 'hexLabel').appendText('#hex: ').adopt(new Element('input').addClass(prefix + 'hexInput'));

    var ok = new Element('input', {
      'styles': {'position': 'absolute'},
      'type': 'button',
      'value': 'Select',
      'class': prefix + 'okButton'
    }).inject(box);

    this.rePosition();

    var overlays = $$('#' + idPrefix + 'overlay');
    this.layout.overlay = overlays[0];
    this.layout.overlay2 = overlays[1];
    this.layout.cursor = Slick.find(document, '#' + idPrefix + 'cursor');
    this.layout.arrows = Slick.find(document, '#' + idPrefix + 'arrows');
    this.chooseColor = Slick.find(document, '#' + idPrefix + 'chooseColor');
    this.layout.backup = Slick.find(document, '#' + idPrefix + 'currentColor');
    this.RedInput = Slick.find(document, '#' + idPrefix + 'rInput');
    this.GreenInput = Slick.find(document, '#' + idPrefix + 'gInput');
    this.BlueInput = Slick.find(document, '#' + idPrefix + 'bInput');
    this.HueInput = Slick.find(document, '#' + idPrefix + 'HueInput');
    this.SatuInput = Slick.find(document, '#' + idPrefix + 'SatuInput');
    this.BrighInput = Slick.find(document, '#' + idPrefix + 'BrighInput');
    this.hexInput = Slick.find(document, '#' + idPrefix + 'hexInput');

    this.arrRGB = [this.RedInput, this.GreenInput, this.BlueInput];
    this.arrHSB = [this.HueInput, this.SatuInput, this.BrighInput];
    this.okButton = Slick.find(document, '#' + idPrefix + 'okButton');

    this.layout.cursor.setStyle('background-image', 'url(' + this.options.getImage.apply(this, ['moor_cursor.gif']));

    if (!window.khtml) this.hide();
  },
  rePosition: function(){
    var coords = this.element.getCoordinates();
    this.layout.setStyles({
      'left': coords.left,
      'top': coords.top + coords.height + 1
    });
  },

  snippet: function(mode, type){
    var size; type = (type) ? type : 'none';

    switch(mode){
      case 'arrPos':
        var t = this.layout.arrows.getStyle('top').toInt();
        size = t;
        break;
      case 'arrSize':
        var h = this.layout.arrows.height;
        h = (type == 'int') ? (h/2).toInt() : h;
        size = h;
        break;
      case 'curPos':
        var l = this.layout.cursor.getStyle('left').toInt();
        var t = this.layout.cursor.getStyle('top').toInt();
        size = {'l': l, 't': t};
        break;
      case 'slider':
        var t = this.layout.slider.getStyle('marginTop').toInt();
        size = t;
        break;
      default :
        var h = this.layout.cursor.height;
        var w = this.layout.cursor.width;
        h = (type == 'int') ? (h/2).toInt() : h;
        w = (type == 'int') ? (w/2).toInt() : w;
        size = {w: w, h: h};
    }
    return size;
  }
});

MooRainbow.implement(new Options);
MooRainbow.implement(new Events);

/*
---

name: Behavior.ColorPicker

description: Shows a color chooser when the user focuses an input.

requires:
 - Behavior/Behavior
 - ColorPicker

provides: [Behavior.ColorPicker]

...
*/

(function(){
  var hexCheck = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  Behavior.addGlobalFilter('ColorPicker', {

    returns: ColorPicker,

    setup: function(el, api){
      var startColor = api.get('startColor');
      if (typeOf(startColor) == "string" && startColor.match(hexCheck)) startColor = startColor.hexToRgb(startColor);
      /*
        optional explicit paths:
        'moor_woverlay.png'
        'moor_boverlay.png'
        'blank.gif'
        'moor_slider.png'
        'moor_cursor.gif'
      */
      var paths = api.get('imgs');
      return new ColorPicker(el, {
        imgPath: api.get('imgPath'),
        startColor: startColor,
        getImage: function(file){
          return paths && paths[file] ? paths[file] : this.options.imgPath + file;
        },
        onChange: function(color){
          el.set('value', color.hex);
          if (api.get('update')){
            api.getElements('update').setStyles({
              backgroundColor: color.hex,
              backgroundImage: 'none'
            });
          }
        }
      });
    }
  });
})();

/*
---

name: ContinueScroll

description: Extends Fx.Scroll to continue a user's scroll if the scroll amount
  passes the given threshold.

requires:
 - More/Fx.Scroll

provides: [ContinueScroll]

...
*/

var ContinueScroll = new Class({

  Extends: Fx.Scroll,

  options: {
    scrollAxis: 'y',
    transition: 'expo:in:out',
    threshold: 0.1,
    completeClass: 'finished-scrolling'
  },

  initialize: function(element, options){
    this.element = element;
    this.setOptions(options);
    this.parent(this.element, this.options);
    this.timer;
    this.previousScroll = element.getScroll();
    this.bottomRight = this.options.scrollAxis == 'x' ? 'toRight' : 'toBottom';
    this.topLeft = this.options.scrollAxis == 'x' ? 'toLeft' : 'toTop';

    this.attach();
  },

  attach: function(detach){
    var eventMethod = detach || 'addEvent';
    this.element[eventMethod]('scroll', this.scroller.bind(this));
    this[eventMethod]('cancel', this.onCancel.bind(this));
  },

  detach: function(){
    this.attach('removeEvent');
  },

  scroller: function(){
    clearTimeout(this.timer);
    this.timer = setTimeout(this.finishedScrolling.bind(this), 100);
  },

  finishedScrolling: function(){
    var size = this.element.getSize();

    var currentScroll = this.element.getScroll();
    var currentPercentage = currentScroll[this.options.scrollAxis]/size[this.options.scrollAxis];

    if (currentScroll[this.options.scrollAxis] >= this.previousScroll[this.options.scrollAxis]){
      // we are scrolling right/down
      if (currentPercentage > this.options.threshold){
        this.fireEvent('bottomRightBegin');
        this[this.bottomRight]().chain(this.bottomRightComplete);
      } else this[this.topLeft]();
    } else {
      // we are scrolling left/up
      if ((1.0 - currentPercentage) > this.options.threshold){
        this.fireEvent('topLeftBegin');
        this[this.topLeft]().chain(this.topLeftComplete);
      } else this[this.bottomRight]();
    }

    this.previousScroll = currentScroll;
  },

  onCancel: function(){
    // this means we've scrolled all the way, so the scroller doesn't fire
    var currentScroll = this.element.getScroll();
    var size = this.element.getSize();
    if (currentScroll[this.options.scrollAxis] > size[this.options.scrollAxis]/2){
      this.bottomRightComplete();
    } else {
      this.topLeftComplete();
    }
  },

  bottomRightComplete: function(){
    this.fireEvent('bottomRightComplete');
  },

  topLeftComplete: function(){
    this.fireEvent('topLeftComplete');
  }


});

/*
---

name: Behavior.ContinueScroll

description: Continues scrolling an element if the user has scrolled past
  a threshold. Otherwise, scroll back to the starting position.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - ContinueScroll

provides: [Behavior.ContinueScroll]

...
*/

Behavior.addGlobalFilter('ContinueScroll', {

  defaults: {
    scrollAxis: 'y',
    transition: 'expo:in:out',
    threshold: 0.1,
    completeClass: 'finished-scrolling'
  },

  returns: ContinueScroll,

  setup: function(element, api){
    var options = Object.cleanValues(
      api.getAs({
        scrollAxis: String,
        threshold: Number,
        transition: String,
        completeClass: String
      })
    );
    var scroller = new ContinueScroll(element);

    element.addEvent('topLeftComplete', function(){
      element.removeClass(options.completeClass);
    });

    element.addEvent('bottomRightComplete', function(){
      element.addClass(options.completeClass);
    });

    api.onCleanup(function(){
      scroller.detach();
    });

    return scroller;
  }
});

/*
---
name: Picker
description: Creates a Picker, which can be used for anything
authors: Arian Stolwijk
requires: [Core/Element.Dimensions, Core/Fx.Tween, Core/Fx.Transitions]
provides: Picker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


var Picker = new Class({

  Implements: [Options, Events],

  options: {/*
    onShow: function(){},
    onOpen: function(){},
    onHide: function(){},
    onClose: function(){},*/

    pickerClass: 'datepicker',
    inject: null,
    animationDuration: 400,
    useFadeInOut: true,
    positionOffset: {x: 0, y: 0},
    pickerPosition: 'bottom',
    draggable: true,
    showOnInit: true,
    columns: 1,
    footer: false
  },

  initialize: function(options){
    this.setOptions(options);
    this.constructPicker();
    if (this.options.showOnInit) this.show();
  },

  constructPicker: function(){
    var options = this.options;

    var picker = this.picker = new Element('div', {
      'class': options.pickerClass,
      styles: {
        left: 0,
        top: 0,
        display: 'none',
        opacity: 0
      }
    }).inject(options.inject || document.body);
    picker.addClass('column_' + options.columns);

    if (options.useFadeInOut){
      picker.set('tween', {
        duration: options.animationDuration,
        link: 'cancel'
      });
    }

    // Build the header
    var header = this.header = new Element('div.header').inject(picker);

    var title = this.title = new Element('div.title').inject(header);
    var titleID = this.titleID = 'pickertitle-' + String.uniqueID();
    this.titleText = new Element('div', {
      'role': 'heading',
      'class': 'titleText',
      'id': titleID,
      'aria-live': 'assertive',
      'aria-atomic': 'true'
    }).inject(title);

    this.closeButton = new Element('div.closeButton[text=x][role=button]')
      .addEvent('click', this.close.pass(false, this))
      .inject(header);

    // Build the body of the picker
    var body = this.body = new Element('div.body').inject(picker);

    if (options.footer){
      this.footer = new Element('div.footer').inject(picker);
      picker.addClass('footer');
    }

    // oldContents and newContents are used to slide from the old content to a new one.
    var slider = this.slider = new Element('div.slider', {
      styles: {
        position: 'absolute',
        top: 0,
        left: 0
      }
    }).set('tween', {
      duration: options.animationDuration,
      transition: Fx.Transitions.Quad.easeInOut
    }).inject(body);

    this.newContents = new Element('div', {
      styles: {
        position: 'absolute',
        top: 0,
        left: 0
      }
    }).inject(slider);

    this.oldContents = new Element('div', {
      styles: {
        position: 'absolute',
        top: 0
      }
    }).inject(slider);

    this.originalColumns = options.columns;
    this.setColumns(options.columns);

    // IFrameShim for select fields in IE
    var shim = this.shim = window['IframeShim'] ? new IframeShim(picker) : null;

    // Dragging
    if (options.draggable && typeOf(picker.makeDraggable) == 'function'){
      this.dragger = picker.makeDraggable(shim ? {
        onDrag: shim.position.bind(shim)
      } : null);
      picker.setStyle('cursor', 'move');
    }
  },

  open: function(noFx){
    if (this.opened == true) return this;
    this.opened = true;
    var picker = this.picker.setStyle('display', 'block').set('aria-hidden', 'false')
    if (this.shim) this.shim.show();
    this.fireEvent('open');
    if (this.options.useFadeInOut && !noFx){
      picker.fade('in').get('tween').chain(this.fireEvent.pass('show', this));
    } else {
      picker.setStyle('opacity', 1);
      this.fireEvent('show');
    }
    return this;
  },

  show: function(){
    return this.open(true);
  },

  close: function(noFx){
    if (this.opened == false) return this;
    this.opened = false;
    this.fireEvent('close');
    var self = this, picker = this.picker, hide = function(){
      picker.setStyle('display', 'none').set('aria-hidden', 'true');
      if (self.shim) self.shim.hide();
      self.fireEvent('hide');
    };
    if (this.options.useFadeInOut && !noFx){
      picker.fade('out').get('tween').chain(hide);
    } else {
      picker.setStyle('opacity', 0);
      hide();
    }
    return this;
  },

  hide: function(){
    return this.close(true);
  },

  toggle: function(){
    return this[this.opened == true ? 'close' : 'open']();
  },

  destroy: function(){
    this.picker.destroy();
    if (this.shim) this.shim.destroy();
  },

  position: function(x, y){
    var offset = this.options.positionOffset,
      scroll = document.getScroll(),
      size = document.getSize(),
      pickersize = this.picker.getSize();

    if (typeOf(x) == 'element'){
      var element = x,
        where = y || this.options.pickerPosition;

      var elementCoords = element.getCoordinates();

      x = (where == 'left') ? elementCoords.left - pickersize.x
        : (where == 'bottom' || where == 'top') ? elementCoords.left
        : elementCoords.right
      y = (where == 'bottom') ? elementCoords.bottom
        : (where == 'top') ? elementCoords.top - pickersize.y
        : elementCoords.top;
    }

    x += offset.x * ((where && where == 'left') ? -1 : 1);
    y += offset.y * ((where && where == 'top') ? -1: 1);

    if ((x + pickersize.x) > (size.x + scroll.x)) x = (size.x + scroll.x) - pickersize.x;
    if ((y + pickersize.y) > (size.y + scroll.y)) y = (size.y + scroll.y) - pickersize.y;
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    this.picker.setStyles({
      left: x,
      top: y
    });
    if (this.shim) this.shim.position();
    return this;
  },

  setBodySize: function(){
    var bodysize = this.bodysize = this.body.getSize();

    this.slider.setStyles({
      width: 2 * bodysize.x,
      height: bodysize.y
    });
    this.oldContents.setStyles({
      left: bodysize.x,
      width: bodysize.x,
      height: bodysize.y
    });
    this.newContents.setStyles({
      width: bodysize.x,
      height: bodysize.y
    });
  },

  setColumnContent: function(column, content){
    var columnElement = this.columns[column];
    if (!columnElement) return this;

    var type = typeOf(content);
    if (['string', 'number'].contains(type)) columnElement.set('text', content);
    else columnElement.empty().adopt(content);

    return this;
  },

  setColumnsContent: function(content, fx){
    var old = this.columns;
    this.columns = this.newColumns;
    this.newColumns = old;

    content.forEach(function(_content, i){
      this.setColumnContent(i, _content);
    }, this);
    return this.setContent(null, fx);
  },

  setColumns: function(columns){
    var _columns = this.columns = new Elements, _newColumns = this.newColumns = new Elements;
    for (var i = columns; i--;){
      _columns.push(new Element('div.column').addClass('column_' + (columns - i)));
      _newColumns.push(new Element('div.column').addClass('column_' + (columns - i)));
    }

    var oldClass = 'column_' + this.options.columns, newClass = 'column_' + columns;
    this.picker.removeClass(oldClass).addClass(newClass);

    this.options.columns = columns;
    return this;
  },

  setContent: function(content, fx){
    if (content) return this.setColumnsContent([content], fx);

    // swap contents so we can fill the newContents again and animate
    var old = this.oldContents;
    this.oldContents = this.newContents;
    this.newContents = old;
    this.newContents.empty();

    this.newContents.adopt(this.columns);

    this.setBodySize();

    if (fx){
      this.fx(fx);
    } else {
      this.slider.setStyle('left', 0);
      this.oldContents.setStyles({left: 0, opacity: 0});
      this.newContents.setStyles({left: 0, opacity: 1});
    }
    return this;
  },

  fx: function(fx){
    var oldContents = this.oldContents,
      newContents = this.newContents,
      slider = this.slider,
      bodysize = this.bodysize;
    if (fx == 'right'){
      oldContents.setStyles({left: 0, opacity: 1});
      newContents.setStyles({left: bodysize.x, opacity: 1});
      slider.setStyle('left', 0).tween('left', 0, -bodysize.x);
    } else if (fx == 'left'){
      oldContents.setStyles({left: bodysize.x, opacity: 1});
      newContents.setStyles({left: 0, opacity: 1});
      slider.setStyle('left', -bodysize.x).tween('left', -bodysize.x, 0);
    } else if (fx == 'fade'){
      slider.setStyle('left', 0);
      oldContents.setStyle('left', 0).set('tween', {
        duration: this.options.animationDuration / 2
      }).tween('opacity', 1, 0).get('tween').chain(function(){
        oldContents.setStyle('left', bodysize.x);
      });
      newContents.setStyles({opacity: 0, left: 0}).set('tween', {
        duration: this.options.animationDuration
      }).tween('opacity', 0, 1);
    }
  },

  toElement: function(){
    return this.picker;
  },

  setTitle: function(content, fn){
    if (!fn) fn = Function.from;
    this.titleText.empty().adopt(
      Array.from(content).map(function(item, i){
        return typeOf(item) == 'element'
          ? item
          : new Element('div.column', {text: fn(item, this.options)}).addClass('column_' + (i + 1));
      }, this)
    );
    return this;
  },

  setTitleEvent: function(fn){
    this.titleText.removeEvents('click');
    if (fn) this.titleText.addEvent('click', fn);
    this.titleText.setStyle('cursor', fn ? 'pointer' : '');
    return this;
  }

});

/*
---
name: Picker.Attach
description: Adds attach and detach methods to the Picker, to attach it to element events
authors: Arian Stolwijk
requires: [Picker, Core/Element.Event]
provides: Picker.Attach
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Picker.Attach = new Class({

  Extends: Picker,

  options: {/*
    onAttached: function(event){},

    toggleElements: null, // deprecated
    toggle: null, // When set it deactivate toggling by clicking on the input */
    togglesOnly: true, // set to false to always make calendar popup on input element, if true, it depends on the toggles elements set.
    showOnInit: false, // overrides the Picker option
    blockKeydown: true
  },

  initialize: function(attachTo, options){
    this.parent(options);

    this.attachedEvents = [];
    this.attachedElements = [];
    this.toggles = [];
    this.inputs = [];

    var documentEvent = function(event){
      if (this.attachedElements.contains(event.target)) return;
      this.close();
    }.bind(this);
    var document = this.picker.getDocument().addEvent('click', documentEvent);

    var preventPickerClick = function(event){
      event.stopPropagation();
      return false;
    };
    this.picker.addEvent('click', preventPickerClick);

    // Support for deprecated toggleElements
    if (this.options.toggleElements) this.options.toggle = document.getElements(this.options.toggleElements);

    this.attach(attachTo, this.options.toggle);
  },

  attach: function(attachTo, toggle){
    if (typeOf(attachTo) == 'string') attachTo = document.id(attachTo);
    if (typeOf(toggle) == 'string') toggle = document.id(toggle);

    var elements = Array.from(attachTo),
      toggles = Array.from(toggle),
      allElements = [].append(elements).combine(toggles),
      self = this;

    var closeEvent = function(event){
      var stopInput = self.options.blockKeydown
          && event.type == 'keydown'
          && !(['tab', 'esc'].contains(event.key)),
        isCloseKey = event.type == 'keydown'
          && (['tab', 'esc'].contains(event.key)),
        isA = event.target.get('tag') == 'a';

      if (stopInput || isA) event.preventDefault();
      if (isCloseKey || isA) self.close();
    };

    var getOpenEvent = function(element){
      return function(event){
        var tag = event.target.get('tag');
        if (tag == 'input' && event.type == 'click' && !element.match(':focus') || (self.opened && self.input == element)) return;
        if (tag == 'a') event.stop();
        self.position(element);
        self.open();
        self.fireEvent('attached', [event, element]);
      };
    };

    var getToggleEvent = function(open, close){
      return function(event){
        if (self.opened) close(event);
        else open(event);
      };
    };

    allElements.each(function(element){

      // The events are already attached!
      if (self.attachedElements.contains(element)) return;

      var events = {},
        tag = element.get('tag'),
        openEvent = getOpenEvent(element),
        // closeEvent does not have a depency on element
        toggleEvent = getToggleEvent(openEvent, closeEvent);

      if (tag == 'input'){
        // Fix in order to use togglers only
        if (!self.options.togglesOnly || !toggles.length){
          events = {
            focus: openEvent,
            click: openEvent,
            keydown: closeEvent
          };
        }
        self.inputs.push(element);
      } else {
        if (toggles.contains(element)){
          self.toggles.push(element);
          events.click = toggleEvent
        } else {
          events.click = openEvent;
        }
      }
      element.addEvents(events);
      self.attachedElements.push(element);
      self.attachedEvents.push(events);
    });
    return this;
  },

  detach: function(attachTo, toggle){
    if (typeOf(attachTo) == 'string') attachTo = document.id(attachTo);
    if (typeOf(toggle) == 'string') toggle = document.id(toggle);

    var elements = Array.from(attachTo),
      toggles = Array.from(toggle),
      allElements = [].append(elements).combine(toggles),
      self = this;

    if (!allElements.length) allElements = self.attachedElements;

    allElements.each(function(element){
      var i = self.attachedElements.indexOf(element);
      if (i < 0) return;

      var events = self.attachedEvents[i];
      element.removeEvents(events);
      delete self.attachedEvents[i];
      delete self.attachedElements[i];

      var toggleIndex = self.toggles.indexOf(element);
      if (toggleIndex != -1) delete self.toggles[toggleIndex];

      var inputIndex = self.inputs.indexOf(element);
      if (toggleIndex != -1) delete self.inputs[inputIndex];
    });
    return this;
  },

  destroy: function(){
    this.detach();
    return this.parent();
  }

});

/*
---
name: Locale.en-US.DatePicker
description: English Language File for DatePicker
authors: Arian Stolwijk
requires: [More/Locale]
provides: Locale.en-US.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('en-US', 'DatePicker', {
  select_a_time: 'Select a time',
  use_mouse_wheel: 'Use the mouse wheel to quickly change value',
  time_confirm_button: 'OK',
  apply_range: 'Apply',
  cancel: 'Cancel',
  week: 'Wk'
});

/*
---
name: Picker.Date
description: Creates a DatePicker, can be used for picking years/months/days and time, or all of them
authors: Arian Stolwijk
requires: [Picker, Picker.Attach, Locale.en-US.DatePicker, More/Locale, More/Date]
provides: Picker.Date
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


(function(){

this.DatePicker = Picker.Date = new Class({

  Extends: Picker.Attach,

  options: {/*
    onSelect: function(date){},

    minDate: new Date('3/4/2010'), // Date object or a string
    maxDate: new Date('3/4/2011'), // same as minDate
    availableDates: {}, //
    invertAvailable: false,

    format: null,*/

    timePicker: false,
    timePickerOnly: false, // deprecated, use onlyView = 'time'
    timeWheelStep: 1, // 10,15,20,30

    yearPicker: true,
    yearsPerPage: 20,

    startDay: 1, // Sunday (0) through Saturday (6) - be aware that this may affect your layout, since the days on the right might have a different margin
    rtl: false,

    startView: 'days', // allowed values: {time, days, months, years}
    openLastView: false,
    pickOnly: false, // 'years', 'months', 'days', 'time'
    canAlwaysGoUp: ['months', 'days'],
    updateAll : false, //whether or not to update all inputs when selecting a date

    weeknumbers: false,

    // if you like to use your own translations
    months_abbr: null,
    days_abbr: null,
    years_title: function(date, options){
      var year = date.get('year');
      return year + '-' + (year + options.yearsPerPage - 1);
    },
    months_title: function(date, options){
      return date.get('year');
    },
    days_title: function(date, options){
      return date.format('%b %Y');
    },
    time_title: function(date, options){
      return (options.pickOnly == 'time') ? Locale.get('DatePicker.select_a_time') : date.format('%d %B, %Y');
    }
  },

  initialize: function(attachTo, options){
    this.parent(attachTo, options);

    this.setOptions(options);
    options = this.options;

    // If we only want to use one picker / backwards compatibility
    ['year', 'month', 'day', 'time'].some(function(what){
      if (options[what + 'PickerOnly']){
        options.pickOnly = what;
        return true;
      }
      return false;
    });
    if (options.pickOnly){
      options[options.pickOnly + 'Picker'] = true;
      options.startView = options.pickOnly;
    }

    // backward compatibility for startView
    var newViews = ['days', 'months', 'years'];
    ['month', 'year', 'decades'].some(function(what, i){
      return (options.startView == what) && (options.startView = newViews[i]);
    });

    options.canAlwaysGoUp = options.canAlwaysGoUp ? Array.from(options.canAlwaysGoUp) : [];

    // Set the min and max dates as Date objects
    if (options.minDate){
      if (!(options.minDate instanceof Date)) options.minDate = Date.parse(options.minDate);
      options.minDate.clearTime();
    }
    if (options.maxDate){
      if (!(options.maxDate instanceof Date)) options.maxDate = Date.parse(options.maxDate);
      options.maxDate.clearTime();
    }

    if (!options.format){
      options.format = (options.pickOnly != 'time') ? Locale.get('Date.shortDate') : '';
      if (options.timePicker) options.format = (options.format) + (options.format ? ' ' : '') + Locale.get('Date.shortTime');
    }

    // Some link or input has fired an event!
    this.addEvent('attached', function(event, element){

      // This is where we store the selected date
      if (!this.currentView || !options.openLastView) this.currentView = options.startView;

      this.date = limitDate(new Date(), options.minDate, options.maxDate);
      var tag = element.get('tag'), input;
      if (tag == 'input') input = element;
      else {
        var index = this.toggles.indexOf(element);
        if (this.inputs[index]) input = this.inputs[index];
      }
      this.getInputDate(input);
      this.input = input;
      this.setColumns(this.originalColumns);
    }.bind(this), true);

  },

  getInputDate: function(input){
    this.date = new Date();
    if (!input) return;
    var date = Date.parse(input.get('value'));
    if (date == null || !date.isValid()){
      var storeDate = input.retrieve('datepicker:value');
      if (storeDate) date = Date.parse(storeDate);
    }
    if (date != null && date.isValid()) this.date = date;
  },

  // Control the previous and next elements

  constructPicker: function(){
    this.parent();

    if (!this.options.rtl){
      this.previous = new Element('div.previous[html=&#171;]').inject(this.header);
      this.next = new Element('div.next[html=&#187;]').inject(this.header);
    } else {
      this.next = new Element('div.previous[html=&#171;]').inject(this.header);
      this.previous = new Element('div.next[html=&#187;]').inject(this.header);
    }
  },

  hidePrevious: function(_next, _show){
    this[_next ? 'next' : 'previous'].setStyle('display', _show ? 'block' : 'none');
    return this;
  },

  showPrevious: function(_next){
    return this.hidePrevious(_next, true);
  },

  setPreviousEvent: function(fn, _next){
    this[_next ? 'next' : 'previous'].removeEvents('click');
    if (fn) this[_next ? 'next' : 'previous'].addEvent('click', fn);
    return this;
  },

  hideNext: function(){
    return this.hidePrevious(true);
  },

  showNext: function(){
    return this.showPrevious(true);
  },

  setNextEvent: function(fn){
    return this.setPreviousEvent(fn, true);
  },

  setColumns: function(columns, view, date, viewFx){
    var ret = this.parent(columns), method;

    if ((view || this.currentView)
      && (method = 'render' + (view || this.currentView).capitalize())
      && this[method]
    ) this[method](date || this.date.clone(), viewFx);

    return ret;
  },

  // Render the Pickers

  renderYears: function(date, fx){
    var options = this.options, pages = options.columns, perPage = options.yearsPerPage,
      _columns = [], _dates = [];
    this.dateElements = [];

    // start neatly at interval (eg. 1980 instead of 1987)
    date = date.clone().decrement('year', date.get('year') % perPage);

    var iterateDate = date.clone().decrement('year', Math.floor((pages - 1) / 2) * perPage);

    for (var i = pages; i--;){
      var _date = iterateDate.clone();
      _dates.push(_date);
      _columns.push(renderers.years(
        timesSelectors.years(options, _date.clone()),
        options,
        this.date.clone(),
        this.dateElements,
        function(date){
          if (options.pickOnly == 'years') this.select(date);
          else this.renderMonths(date, 'fade');
          this.date = date;
        }.bind(this)
      ));
      iterateDate.increment('year', perPage);
    }

    this.setColumnsContent(_columns, fx);
    this.setTitle(_dates, options.years_title);

    // Set limits
    var limitLeft = (options.minDate && date.get('year') <= options.minDate.get('year')),
      limitRight = (options.maxDate && (date.get('year') + options.yearsPerPage) >= options.maxDate.get('year'));
    this[(limitLeft ? 'hide' : 'show') + 'Previous']();
    this[(limitRight ? 'hide' : 'show') + 'Next']();

    this.setPreviousEvent(function(){
      this.renderYears(date.decrement('year', perPage), 'left');
    }.bind(this));

    this.setNextEvent(function(){
      this.renderYears(date.increment('year', perPage), 'right');
    }.bind(this));

    // We can't go up!
    this.setTitleEvent(null);

    this.currentView = 'years';
  },

  renderMonths: function(date, fx){
    var options = this.options, years = options.columns, _columns = [], _dates = [],
      iterateDate = date.clone().decrement('year', Math.floor((years - 1) / 2));
    this.dateElements = [];

    for (var i = years; i--;){
      var _date = iterateDate.clone();
      _dates.push(_date);
      _columns.push(renderers.months(
        timesSelectors.months(options, _date.clone()),
        options,
        this.date.clone(),
        this.dateElements,
        function(date){
          if (options.pickOnly == 'months') this.select(date);
          else this.renderDays(date, 'fade');
          this.date = date;
        }.bind(this)
      ));
      iterateDate.increment('year', 1);
    }

    this.setColumnsContent(_columns, fx);
    this.setTitle(_dates, options.months_title);

    // Set limits
    var year = date.get('year'),
      limitLeft = (options.minDate && year <= options.minDate.get('year')),
      limitRight = (options.maxDate && year >= options.maxDate.get('year'));
    this[(limitLeft ? 'hide' : 'show') + 'Previous']();
    this[(limitRight ? 'hide' : 'show') + 'Next']();

    this.setPreviousEvent(function(){
      this.renderMonths(date.decrement('year', years), 'left');
    }.bind(this));

    this.setNextEvent(function(){
      this.renderMonths(date.increment('year', years), 'right');
    }.bind(this));

    var canGoUp = options.yearPicker && (options.pickOnly != 'months' || options.canAlwaysGoUp.contains('months'));
    var titleEvent = (canGoUp) ? function(){
      this.renderYears(date, 'fade');
    }.bind(this) : null;
    this.setTitleEvent(titleEvent);

    this.currentView = 'months';
  },

  renderDays: function(date, fx){
    var options = this.options, months = options.columns, _columns = [], _dates = [],
      iterateDate = date.clone().decrement('month', Math.floor((months - 1) / 2));
    this.dateElements = [];

    for (var i = months; i--;){
      _date = iterateDate.clone();
      _dates.push(_date);
      _columns.push(renderers.days(
        timesSelectors.days(options, _date.clone()),
        options,
        this.date.clone(),
        this.dateElements,
        function(date){
          if (options.pickOnly == 'days' || !options.timePicker) this.select(date)
          else this.renderTime(date, 'fade');
          this.date = date;
        }.bind(this)
      ));
      iterateDate.increment('month', 1);
    }

    this.setColumnsContent(_columns, fx);
    this.setTitle(_dates, options.days_title);

    var yearmonth = date.format('%Y%m').toInt(),
      limitLeft = (options.minDate && yearmonth <= options.minDate.format('%Y%m')),
      limitRight = (options.maxDate && yearmonth >= options.maxDate.format('%Y%m'));
    this[(limitLeft ? 'hide' : 'show') + 'Previous']();
    this[(limitRight ? 'hide' : 'show') + 'Next']();

    this.setPreviousEvent(function(){
      this.renderDays(date.decrement('month', months), 'left');
    }.bind(this));

    this.setNextEvent(function(){
      this.renderDays(date.increment('month', months), 'right');
    }.bind(this));

    var canGoUp = options.pickOnly != 'days' || options.canAlwaysGoUp.contains('days');
    var titleEvent = (canGoUp) ? function(){
      this.renderMonths(date, 'fade');
    }.bind(this) : null;
    this.setTitleEvent(titleEvent);

    this.currentView = 'days';
  },

  renderTime: function(date, fx){
    var options = this.options;
    this.setTitle(date, options.time_title);

    var originalColumns = this.originalColumns = options.columns;
    this.currentView = null; // otherwise you'd get crazy recursion
    if (originalColumns != 1) this.setColumns(1);

    this.setContent(renderers.time(
      options,
      date.clone(),
      function(date){
        this.select(date);
      }.bind(this)
    ), fx);

    // Hide « and » buttons
    this.hidePrevious()
      .hideNext()
      .setPreviousEvent(null)
      .setNextEvent(null);

    var canGoUp = options.pickOnly != 'time' || options.canAlwaysGoUp.contains('time');
    var titleEvent = (canGoUp) ? function(){
      this.setColumns(originalColumns, 'days', date, 'fade');
    }.bind(this) : null;
    this.setTitleEvent(titleEvent);

    this.currentView = 'time';
  },

  select: function(date, all){
    this.date = date;
    var formatted = date.format(this.options.format),
      time = date.strftime(),
      inputs = (!this.options.updateAll && !all && this.input) ? [this.input] : this.inputs;

    inputs.each(function(input){
      input.set('value', formatted).store('datepicker:value', time).fireEvent('change');
    }, this);

    this.fireEvent('select', [date].concat(inputs));
    this.close();
    return this;
  }

});


// Renderers only output elements and calculate the limits!

var timesSelectors = {

  years: function(options, date){
    var times = [];
    for (var i = 0; i < options.yearsPerPage; i++){
      times.push(+date);
      date.increment('year', 1);
    }
    return times;
  },

  months: function(options, date){
    var times = [];
    date.set('month', 0);
    for (var i = 0; i <= 11; i++){
      times.push(+date);
      date.increment('month', 1);
    }
    return times;
  },

  days: function(options, date){
    var times = [];
    date.set('date', 1);
    while (date.get('day') != options.startDay) date.set('date', date.get('date') - 1);
    for (var i = 0; i < 42; i++){
      times.push(+date);
      date.increment('day',  1);
    }
    return times;
  }

};

var renderers = {

  years: function(years, options, currentDate, dateElements, fn){
    var container = new Element('div.years'),
      today = new Date(), element, classes;

    years.each(function(_year, i){
      var date = new Date(_year), year = date.get('year');

      classes = '.year.year' + i;
      if (year == today.get('year')) classes += '.today';
      if (year == currentDate.get('year')) classes += '.selected';
      element = new Element('div' + classes, {text: year}).inject(container);

      dateElements.push({element: element, time: _year});

      if (isUnavailable('year', date, options)) element.addClass('unavailable');
      else element.addEvent('click', fn.pass(date));
    });

    return container;
  },

  months: function(months, options, currentDate, dateElements, fn){
    var today = new Date(),
      month = today.get('month'),
      thisyear = today.get('year'),
      selectedyear = currentDate.get('year'),
      container = new Element('div.months'),
      monthsAbbr = options.months_abbr || Locale.get('Date.months_abbr'),
      element, classes;

    months.each(function(_month, i){
      var date = new Date(_month), year = date.get('year');

      classes = '.month.month' + (i + 1);
      if (i == month && year == thisyear) classes += '.today';
      if (i == currentDate.get('month') && year == selectedyear) classes += '.selected';
      element = new Element('div' + classes, {text: monthsAbbr[i]}).inject(container);

      dateElements.push({element: element, time: _month});

      if (isUnavailable('month', date, options)) element.addClass('unavailable');
      else element.addEvent('click', fn.pass(date));
    });

    return container;
  },

  days: function(days, options, currentDate, dateElements, fn){
    var month = new Date(days[14]).get('month'),
      todayString = new Date().toDateString(),
      currentString = currentDate.toDateString(),
      weeknumbers = options.weeknumbers,
      container = new Element('table.days' + (weeknumbers ? '.weeknumbers' : ''), {
        role: 'grid', 'aria-labelledby': this.titleID
      }),
      header = new Element('thead').inject(container),
      body = new Element('tbody').inject(container),
      titles = new Element('tr.titles').inject(header),
      localeDaysShort = options.days_abbr || Locale.get('Date.days_abbr'),
      day, classes, element, weekcontainer, dateString,
      where = options.rtl ? 'top' : 'bottom';

    if (weeknumbers) new Element('th.title.day.weeknumber', {
      text: Locale.get('DatePicker.week')
    }).inject(titles);

    for (day = options.startDay; day < (options.startDay + 7); day++){
      new Element('th.title.day.day' + (day % 7), {
        text: localeDaysShort[(day % 7)],
        role: 'columnheader'
      }).inject(titles, where);
    }

    days.each(function(_date, i){
      var date = new Date(_date);

      if (i % 7 == 0){
        weekcontainer = new Element('tr.week.week' + (Math.floor(i / 7))).set('role', 'row').inject(body);
        if (weeknumbers) new Element('th.day.weeknumber', {text: date.get('week'), scope: 'row', role: 'rowheader'}).inject(weekcontainer);
      }

      dateString = date.toDateString();
      classes = '.day.day' + date.get('day');
      if (dateString == todayString) classes += '.today';
      if (date.get('month') != month) classes += '.otherMonth';
      element = new Element('td' + classes, {text: date.getDate(), role: 'gridcell'}).inject(weekcontainer, where);

      if (dateString == currentString) element.addClass('selected').set('aria-selected', 'true');
      else element.set('aria-selected', 'false');

      dateElements.push({element: element, time: _date});

      if (isUnavailable('date', date, options)) element.addClass('unavailable');
      else element.addEvent('click', fn.pass(date.clone()));
    });

    return container;
  },

  time: function(options, date, fn){
    var container = new Element('div.time'),
      // make sure that the minutes are timeWheelStep * k
      initMinutes = (date.get('minutes') / options.timeWheelStep).round() * options.timeWheelStep

    if (initMinutes >= 60) initMinutes = 0;
    date.set('minutes', initMinutes);

    var hoursInput = new Element('input.hour[type=text]', {
      title: Locale.get('DatePicker.use_mouse_wheel'),
      value: date.format('%H'),
      events: {
        click: function(event){
          event.target.focus();
          event.stop();
        },
        mousewheel: function(event){
          event.stop();
          hoursInput.focus();
          var value = hoursInput.get('value').toInt();
          value = (event.wheel > 0) ? ((value < 23) ? value + 1 : 0)
            : ((value > 0) ? value - 1 : 23)
          date.set('hours', value);
          hoursInput.set('value', date.format('%H'));
        }.bind(this)
      },
      maxlength: 2
    }).inject(container);

    var minutesInput = new Element('input.minutes[type=text]', {
      title: Locale.get('DatePicker.use_mouse_wheel'),
      value: date.format('%M'),
      events: {
        click: function(event){
          event.target.focus();
          event.stop();
        },
        mousewheel: function(event){
          event.stop();
          minutesInput.focus();
          var value = minutesInput.get('value').toInt();
          value = (event.wheel > 0) ? ((value < 59) ? (value + options.timeWheelStep) : 0)
            : ((value > 0) ? (value - options.timeWheelStep) : (60 - options.timeWheelStep));
          if (value >= 60) value = 0;
          date.set('minutes', value);
          minutesInput.set('value', date.format('%M'));
        }.bind(this)
      },
      maxlength: 2
    }).inject(container);

    new Element('div.separator[text=:]').inject(container);

    new Element('input.ok[type=submit]', {
      value: Locale.get('DatePicker.time_confirm_button'),
      events: {click: function(event){
        event.stop();
        date.set({
          hours: hoursInput.get('value').toInt(),
          minutes: minutesInput.get('value').toInt()
        });
        fn(date.clone());
      }}
    }).inject(container);

    return container;
  }

};


Picker.Date.defineRenderer = function(name, fn){
  renderers[name] = fn;
  return this;
};

var limitDate = function(date, min, max){
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
};

var isUnavailable = function(type, date, options){
  var minDate = options.minDate,
    maxDate = options.maxDate,
    availableDates = options.availableDates,
    year, month, day, ms;

  if (!minDate && !maxDate && !availableDates) return false;
  date.clearTime();

  if (type == 'year'){
    year = date.get('year');
    return (
      (minDate && year < minDate.get('year')) ||
      (maxDate && year > maxDate.get('year')) ||
      (
        (availableDates != null &&  !options.invertAvailable) && (
          availableDates[year] == null ||
          Object.getLength(availableDates[year]) == 0 ||
          Object.getLength(
            Object.filter(availableDates[year], function(days){
              return (days.length > 0);
            })
          ) == 0
        )
      )
    );
  }

  if (type == 'month'){
    year = date.get('year');
    month = date.get('month') + 1;
    ms = date.format('%Y%m').toInt();
    return (
      (minDate && ms < minDate.format('%Y%m').toInt()) ||
      (maxDate && ms > maxDate.format('%Y%m').toInt()) ||
      (
        (availableDates != null && !options.invertAvailable) && (
          availableDates[year] == null ||
          availableDates[year][month] == null ||
          availableDates[year][month].length == 0
        )
      )
    );
  }

  // type == 'date'
  year = date.get('year');
  month = date.get('month') + 1;
  day = date.get('date');

  var dateAllow = (minDate && date < minDate) || (minDate && date > maxDate);
  if (availableDates != null){
    dateAllow = dateAllow
      || availableDates[year] == null
      || availableDates[year][month] == null
      || !availableDates[year][month].contains(day);
    if (options.invertAvailable) dateAllow = !dateAllow;
  }

  return dateAllow;
};

})();

/*
---
name: Picker.Date.Range
description: Select a Range of Dates
authors: Arian Stolwijk
requires: [Picker, Picker.Date]
provides: Picker.Date.Range
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/

Picker.Date.Range = new Class({

  Extends: Picker.Date,

  options: {
    getStartEndDate: function(input){
      return input.get('value').split('-').map(function(date){
        var parsed = Date.parse(date);
        return Date.isValid(parsed) ? parsed : null;
      }).clean();
    },
    setStartEndDate: function(input, dates){
      input.set('value', dates.map(function(date){
        return date.format(this.options.format);
      }, this).join(' - '));
    },
    footer: true,
    columns: 3
  },

  getInputDate: function(input){
    if (!input) return;

    var dates = input.retrieve('datepicker:value');
    if (dates && dates.length) dates = dates.map(Date.parse);
    if (!dates || !dates.length || dates.some(function(date){
      return !Date.isValid(date);
    })){
      dates = this.options.getStartEndDate.call(this, input);
      if (!dates.length || !dates.every(function(date){
        return Date.isValid(date);
      })) dates = [this.date];
    }
    if (dates.length == 1) this.date = this.startDate = this.endDate = dates[0];
    else if (dates.length == 2){
      this.date = this.startDate = dates[0];
      this.endDate = dates[1];
    }
  },

  constructPicker: function(){
    this.parent();
    var footer = this.footer, self = this;
    if (!footer) return;

    var events = {
      click: function(){
        this.focus();
      },
      blur: function(){
        var date = Date.parse(this.get('value'));
        if (date.isValid) self[(this == startInput ? 'start' : 'end') + 'Date'] = date;
        self.updateRangeSelection();
      },
      keydown: function(event){
        if (event.key == 'enter') self.selectRange();
      }
    };

    var startInput = this.startInput = new Element('input', {events: events}).inject(footer);
    new Element('span', {text: ' - '}).inject(footer);
    var endInput = this.endInput = new Element('input', {events: events}).inject(footer);

    this.applyButton = new Element('button.apply', {
      text: Locale.get('DatePicker.apply_range'),
      events: {click: self.selectRange.pass([], self)}
    }).inject(footer);

    this.cancelButton = new Element('button.cancel', {
      text: Locale.get('DatePicker.cancel'),
      events: {click: self.close.pass(false, self)}
    }).inject(footer);
  },

  renderDays: function(){
    this.parent.apply(this, arguments);
    this.updateRangeSelection();
  },

  select: function(date){
    if (this.startDate && (this.endDate == this.startDate || date > this.endDate) && date >= this.startDate) this.endDate = date;
    else {
      this.startDate = date;
      this.endDate = date;
    }
    this.updateRangeSelection();
  },

  selectRange: function(){
    this.date = this.startDate;
    var dates = [this.startDate, this.endDate], input = this.input;

    this.options.setStartEndDate.call(this, input, dates);
    input.store('datepicker:value', dates.map(function(date){
      return date.strftime();
    })).fireEvent('change');

    this.fireEvent('select', dates, input);
    this.close();
    return this;
  },

  updateRangeSelection: function(){
    var start = this.startDate,
      end = this.endDate || start;

    if (this.dateElements) for (var i = this.dateElements.length; i--;){
      var el = this.dateElements[i];
      if (el.time >= start && el.time <= end) el.element.addClass('selected');
      else el.element.removeClass('selected');
    }

    var formattedFirst = start.format(this.options.format)
      formattedEnd = end.format(this.options.format);

    this.startInput.set('value', formattedFirst);
    this.endInput.set('value', formattedEnd);

    return this;
  }

});

/*
---

name: Behavior.DatePicker

description: Behavior for instantiating a Datepicker.

requires:
  - Behavior/Behavior
  - More/Object.Extras
  - Picker.Date
  - Picker.Date.Range

provides: Behavior.DatePicker

...
*/

Behavior.addGlobalFilter('DatePicker', {
  defaults: {
    useFadeInOut: false,
    pickerClass: 'datepicker_minimal',
    timePicker: false,
    blockKeydown: false,
    submitTarget: null,
    columns: 1,
    draggable: false
  },
  returns: Picker.Date,
  setup: function(element, api){
    var toggles = [];
    if (api.get('toggles')) toggles = element.getElements(api.get('toggles'));
    var picker = new Picker.Date(element,
      Object.merge({
          toggle: toggles,
          onSelect: function(){
            var delegator = api.getDelegator();
            if (delegator) delegator.fireEventForElement(element, 'change');
            else element.fireEvent('change');
            if (api.get('submitTarget')){
              element.getElement(api.get('submitTarget')).submit();
            }
          }
        },
        Object.cleanValues(
          api.getAs({
            draggable: Boolean,
            columns: Number,
            useFadeInOut: Boolean,
            blockKeydown: Boolean,
            minDate: String,
            maxDate: String,
            format: String,
            timePicker: Boolean,
            yearPicker: Boolean,
            startView: String,
            startDay: Number,
            pickOnly: String,
            positionOffset: Object,
            pickerClass: String,
            updateAll: Boolean
          })
        )
      )
    );
    api.onCleanup(picker.detach.bind(picker));
    return picker;
  }
});

Behavior.addGlobalFilter('RangePicker', {
  defaults: {
    useFadeInOut: false,
    pickerClass: 'rangepicker_minimal',
    timePicker: false,
    blockKeydown: false,
    submitTarget: null,
    columns: 1,
    draggable: false
  },
  returns: Picker.Date,
  setup: function(element, api){
    var toggles = [];
    if (api.get('toggles')) toggles = element.getElements(api.get('toggles'));
    var picker = new Picker.Date.Range(element,
      Object.merge({
        toggle: toggles,
        onSelect: function(){
          var delegator = api.getDelegator();
          if (delegator) delegator.fireEventForElement(element, 'change');
          else element.fireEvent('change');
          if (api.get('submitTarget')){
            element.getElement(api.get('submitTarget')).submit();
          }
        }
      },
        Object.cleanValues(
          api.getAs({
            draggable: Boolean,
            columns: Number,
            useFadeInOut: Boolean,
            blockKeydown: Boolean,
            minDate: String,
            maxDate: String,
            format: String,
            timePicker: Boolean,
            yearPicker: Boolean,
            startView: String,
            startDay: Number,
            pickOnly: String,
            positionOffset: Object,
            pickerClass: String,
            updateAll: Boolean
          })
        )
      )
    );
    api.onCleanup(picker.detach.bind(picker));
    return picker;
  }
});

/*
---
name: Locale.cs-CZ.DatePicker
description: Czech Language File for DatePicker
authors: Jan Cerny
requires: [More/Locale]
provides: Locale.cs-CZ.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('cs-CZ', 'DatePicker', {
  select_a_time: 'Vyberte čas',
  use_mouse_wheel: 'Použijte kolečko myši k rychlé změně hodnoty',
  time_confirm_button: 'Zvolte čas'
});

/*
---
name: Locale.de-DE.DatePicker
description: German Language File for DatePicker
authors: Bastian Bringenberg
requires: [More/Locale]
provides: Locale.de-DE.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('de-DE', 'DatePicker', {
  select_a_time: 'Wähle eine Zeit',
  use_mouse_wheel: 'Mit dem Mausrad kannst du schneller die Werte ändern',
  time_confirm_button: 'OK'
});

/*
---
name: Locale.es-ES.DatePicker
description: Spanish Language File for DatePicker
authors: Juan Lago D.
requires: [More/Locale]
provides: Locale.es-ES.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('es-ES', 'DatePicker', {
  select_a_time: 'Selecciona una fecha',
  use_mouse_wheel: 'Utiliza la rueda del raton para cambiar rapidamente de valor',
  time_confirm_button: 'OK'
});

/*
---
name: Locale.fr-FR.DatePicker
description: French Language File for DatePicker
authors: ["Arian Stolwijk", "charlouze", "Abric Armand"]
requires: [More/Locale]
provides: Locale.fr-FR.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/

Locale.define('fr-FR', 'DatePicker', {
  select_a_time: 'Choisir l\'heure',
  use_mouse_wheel: 'Utiliser la molette pour changer l\'heure rapidement',
  time_confirm_button: 'OK',
  apply_range: 'Appliquer',
  cancel: 'Annuler',
  week: 'Sem'
});

/*
---
name: Locale.he-IL.DatePicker
description: Hebrew Language File for DatePicker
authors: Amitay Horwitz
requires: [More/Locale]
provides: Locale.he-IL.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('he-IL', 'DatePicker', {
  select_a_time: 'בחר זמן',
  use_mouse_wheel: 'השתמש בגלגלת העכבר לשינוי מהיר',
  time_confirm_button: 'אישור',
  apply_range: 'החל',
  cancel: 'ביטול',
  week: 'שבוע'
});

/*
---
name: Locale.it-IT.DatePicker
description: Italian Language File for DatePicker
authors: danielec (https://github.com/danielec)
requires: [More/Locale]
provides: Locale.it-IT.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/

Locale.define('it-IT', 'DatePicker', {
    select_a_time: 'Scegli un orario',
    use_mouse_wheel: 'Utilizza la rotellina del mouse per cambiare valore velocemente',
    time_confirm_button: 'OK'
});

/*
---
name: Locale.nl-NL.DatePicker
description: Dutch Language File for DatePicker
authors: Arian Stolwijk
requires: [More/Locale]
provides: Locale.nl-NL.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('nl-NL', 'DatePicker', {
  select_a_time: 'Selecteer een tijd',
  use_mouse_wheel: 'Gebruik uw scrollwiel om door de tijd te scrollen',
  time_confirm_button: 'OK',
  apply_range: 'OK',
  cancel: 'Annuleer',
  week: 'W'
});

/*
---
name: Locale.pl-PL.DatePicker
description: Polish Language File for DatePicker
authors: Tomek Wójcik
requires: [More/Locale]
provides: Locale.pl-PL.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('pl-PL', 'DatePicker', {
  select_a_time: 'Wybierz czas',
  use_mouse_wheel: 'Użyj rolki myszy aby szybko zmienić wartość',
  time_confirm_button: 'OK'
});

/*
---
name: Locale.pt-BR.DatePicker
description: Portuguese Language File for DatePicker
authors: Jonnathan Soares
requires: [More/Locale]
provides: Locale.pt-BR.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('pt-BR', 'DatePicker', {
  select_a_time: 'Selecione uma hora',
  use_mouse_wheel: 'Use a roda do mouse para rapidamente trocar de valor',
  time_confirm_button: 'OK',
  apply_range: 'Aplicar',
  cancel: 'Cancelar',
  week: 'Sem.'
});

/*
---
name: Locale.ru-RU.DatePicker
description: Russian Language File for DatePicker
authors: https://github.com/rwz
requires: [More/Locale]
provides: Locale.ru-RU.DatePicker
license: http://www.opensource.org/licenses/mit-license.php
source: https://github.com/arian/mootools-datepicker/
...
*/


Locale.define('ru-RU', 'DatePicker', {
  select_a_time: 'Выберите время',
  use_mouse_wheel: 'Используйте колесо мышки для быстрой смены значения',
  time_confirm_button: 'OK'
});

/*
---
description: Provides methods to add/remove/toggle a class on a given target.
provides: [Delegator.ToggleClass, Delegator.AddClass, Delegator.RemoveClass, Delegator.AddRemoveClass]
requires: [Behavior/Delegator, Core/Element]
script: Delegator.AddRemoveClass.js
name: Delegator.AddRemoveClass

...
*/
(function(){

  var triggers = {};

  ['add', 'remove', 'toggle'].each(function(action){

    triggers[action + 'Class'] = {
      require: ['class'],
      handler: function(event, link, api){
        var target = link;

        if (api.get('target')) target = api.getElement('target')
        else if (api.get('targets')) target = api.getElements('targets');

        target[action + 'Class'](api.get('class'));
      }
    };

  });

  Delegator.register('click', triggers);

})();
/*
---
description: Provides functionality for links that load content into a target element via ajax.
provides: [Delegator.Ajax]
requires: [Behavior/Delegator, Core/Request.HTML, More/Spinner, More/Object.Extras]
script: Delegator.Ajax.js
name: Delegator.Ajax
...
*/
(function(){
  var send = function(event, link, api){
    if (api.getAs(Boolean, 'loadOnce') === true && link.retrieve('ajaxLoaded')){
      api.warn('already loaded link via ajax. `once` option is true, so exiting quietly.', api.get('href') || link.get('href'));
      return;
    }
    var target,
      action = api.get('action'),
      selector = api.get('target');
    if (selector){
      if (selector == "self"){
        target = link;
      } else {
        target = link.getElement(selector);
      }
    }

    if (!target) api.fail('ajax trigger error: element matching selector %s was not found', selector);

    var requestTarget = new Element('div');

    var spinnerTarget = api.get('spinnerTarget') || api.get('spinner-target'); //spinner-target is deprecated
    if (spinnerTarget) spinnerTarget = link.getElement(spinnerTarget);

    var request = link.retrieve('Delegator.Ajax.Request');
    if (!request){
      request = new Request.HTML();
      link.store('Delegator.Ajax.Request', request);
    }
    request.removeEvents('success');
    request.setOptions(
      Object.cleanValues({
        method: api.get('method'),
        evalScripts: api.get('evalScripts'),
        url: api.get('href') || link.get('href'),
        spinnerTarget: spinnerTarget || target,
        useSpinner: api.getAs(Boolean, 'useSpinner'),
        update: requestTarget,
        onSuccess: function(){
          //reverse the elements and inject them
          //reversal is required since it injects each after the target
          //pushing down the previously added element
          var elements = requestTarget.getChildren();
          if (api.get('filter')){
            elements = new Element('div').adopt(elements).getElements(api.get('filter'));
          }
          switch(action){
            case 'ignore':
              break;
            case 'replace':
              var container = target.getParent();
              elements.reverse().inject(target , 'after');
              api.fireEvent('destroyDom', target);
              target.destroy();
              api.fireEvent('ammendDom', [container, elements]);
              break;
            case 'update':
              api.fireEvent('destroyDom', target.getChildren());
              target.empty();
              elements.inject(target);
              api.fireEvent('ammendDom', [target, elements]);
              break;
            default:
              //injectTop, injectBottom, injectBefore, injectAfter
              var where = action.replace('inject', '').toLowerCase();
              if (where == 'top' || where == 'after') elements.reverse();
              elements.inject(target, where);
              api.fireEvent('ammendDom', [target, elements]);
          }
          if (api.get('updateHistory')){
            api.fireEvent('updateHistory', api.get('historyURI') || api.get('href') || link.get('href'));
          }
        }
      })
    );

    // allow for additional data to be encoded into the request at the time of invocation
    var data;
    // if the encode option is set
    if (api.get('encode')){
      // go get the element to encode; allow 'self' or a selector
      var encode = api.get('encode') == 'self' ? link : link.getElement(api.get('encode'));
      // if one was found, encode it!
      if (encode){
        data = {};
        // if the reference is a single input, just capture its value
        if (encode.get('tag') == 'input') data[encode.get('name')] = encode.get('value');
        // else encode the element's children as a query string
        else data = encode.toQueryString();
      } else {
        api.warn("Warning: Ajax delegator could not find encode target " + api.get('encode'));
      }
    }
    if (data) request.send({data: data});
    else request.send();
    link.store('ajaxLoaded', true);
  };

  Delegator.register('click', 'ajax', {
    require: ['target'],
    defaults: {
      action: 'injectBottom',
      method: 'get',
      throttle: 0 //prevents sending repeatedly within this threshold
    },
    handler: function(event, link, api){
      event.preventDefault();
      // if the throttle is set and != 0
      if (api.get('throttle')){
        // store the timer on the element for subsequent requests
        var timer = link.retrieve('ajaxTimer');
        // clear the previous running timer if there is one
        if (timer) clearTimeout(timer);
        // store the new one; delaying the send call by the configured amount
        link.store('ajaxTimer', send.delay(api.getAs(Number, 'throttle'), this, arguments));
      } else {
        // otherwise hey, no throttle. send it.
        send.apply(this, arguments);
      }
    }
  });

  // legacy

  Delegator.cloneTrigger('ajax', 'Ajax');

})();

/*
---

name: Delegator.CharsRemaining

description: Changing an input (with a maxlength property) will decrement a target's value

requires:
 - Behavior/Delegator

provides: [Delegator.CharsRemaining]

...
*/


Delegator.register('keyup', {
  charsRemaining: {
    requireAs: {
      target: String
    },
    handler: function(event, element, api){
      var target = api.getElement('target');
      var maxChars = element.get('maxlength');
      if (!maxChars) api.fail('Could not read maxlength property of element.');
      var difference = maxChars - element.get('value').length;
      target.set('html', difference);
    }
  }
});

/*
---
description: Checks all or none of a group of checkboxes.
provides: [Delegator.CheckAllOrNone]
requires: [Behavior/Delegator]
script: Delegator.CheckAllOrNone.js
name: Delegator.CheckAllOrNone

...
*/

Delegator.register('click', {

  'checkAll': {
    require: ['targets'],
    handler: function(event, link, api){
      var targets = link.getElements(api.get('targets'));
      if (targets.length) targets.set('checked', true);
      else api.warn('There were no inputs found to check.');
    }
  },

  'checkNone': {
    require: ['targets'],
    handler: function(event, link, api){
      var targets = link.getElements(api.get('targets'));
      if (targets.length) targets.set('checked', false);
      else api.warn('There were no inputs found to uncheck.');
    }
  },

  'checkToggleAll': {
    require: ['targets'],
    handler: function(event, link, api){
      var classTarget = api.get('classTarget');
      var classForTarget = api.get('class');
      var targets = link.getElements(api.get('targets'));
      if (targets.length){
        if (link.get('data-state') == undefined) api.error('Must specify an initial state as data-state.');
        if (link.get('data-state') == '1'){
          targets.set('checked', false);
          link.set('data-state', '0');
          if (classTarget && classForTarget){
            if (!targets.getElement(classTarget)) api.fail('Could not find classTarget: ' + classTarget)
            targets.getElement(classTarget).removeClass(classForTarget);
          }
        } else {
          targets.set('checked', true);
          link.set('data-state', '1');
          if (classTarget && classForTarget){
            if (!targets.getElement(classTarget)) api.fail('Could not find classTarget: ' + classTarget)
            targets.getElement(classTarget).addClass(classForTarget);
          }
        }
      }
      else api.warn('There were no inputs found to uncheck.');
    }
  }

});
/*
---

script: Elements.From.js

name: Elements.From

description: Returns a collection of elements from a string of html.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/String
  - Core/Element
  - MooTools.More

provides: [Elements.from, Elements.From]

...
*/

Elements.from = function(text, excludeScripts){
	if (excludeScripts || excludeScripts == null) text = text.stripScripts();

	var container, match = text.match(/^\s*(?:<!--.*?-->\s*)*<(t[dhr]|tbody|tfoot|thead)/i);

	if (match){
		container = new Element('table');
		var tag = match[1].toLowerCase();
		if (['td', 'th', 'tr'].contains(tag)){
			container = new Element('tbody').inject(container);
			if (tag != 'tr') container = new Element('tr').inject(container);
		}
	}

	return (container || new Element('div')).set('html', text).getChildren();
};

/*
---
description: Prompts the user to confirm a link click.
provides: [Delegator.Confirm]
requires: [Behavior/Delegator, Bootstrap.Popup, More/Elements.from]
name: Delegator.Confirm

...
*/
(function(){

  Delegator.register('click', {
    confirm: {
      defaults: {
        authInput: '#auth_form_id input[name=authenticity_token]',
        caption: 'Confirm'
      },
      handler: function(event, link, api){
        event.preventDefault();

        var onConfirm = function(e){
          var doubleCheck = !api.get('doubleCheck') ||
                             confirm("No, SERIOUSLY. Do you like, double-dog, totally, for sure you want to do this?");
          // allow delete
          if (link.get('data-method')){
            e.preventDefault();
            // delete operations have to be sent as a POST w/ a hidden _method value
            var form = new Element('form',{
              method: 'POST',
              action: link.get('href'),
              styles: {
                display: 'none'
              }
            }).adopt(new Element('input',{
              type: 'hidden',
              name: '_method',
              value: link.get('data-method').toUpperCase()
            })).inject(link, 'after');
            var auth = $$(api.get('authInput'))[0];
            if (auth) auth.clone().inject(form);
            if (doubleCheck) form.fireEvent('submit').submit();
          } else if (!doubleCheck) return;

        };
        var onCancel = function(){};

        var isButton = link.get('type') == 'input' || link.get('type') == 'button' || link.get('type') == 'submit' || link.get('tag', 'button');
        if (api.get('form') || isButton){ // selector to find a form element relative to the clicked element: e.g. !form
          var form = link.getElement(api.get('form'));
          if (isButton && !form) form = link.getParent('form');
          if (!form && api.get('form')) api.fail('Could not find form (' + api.get('form') + ') relative to confirm element');
          if (form){
            if (form.retrieve('validator') && !form.retrieve('validator').validate()) return;
            var btnInfo = new Element(
              'input',
              {
                'type': 'hidden',
                'name': link.get('name'),
                'value': link.get('value') || 0
              }
            );
            btnInfo.inject(form);

            onConfirm = function(){
              // allow delete
              if (link.get('data-method')) form.set('method', link.get('data-method'));
              form.fireEvent('submit').submit();
              btnInfo.destroy();
            };
            onCancel = function(){
              btnInfo.destroy();
            };
          }
        }

        var prompt = make_prompt({
          caption: api.get('caption'),
          content: api.get('content'),
          body: api.get('body'),
          url: link.get('href'),
          onConfirm: onConfirm,
          onCancel: onCancel,
          deleting: (link.get('data-method')||"").toLowerCase() == 'delete'
        }).addClass('hide');
        prompt.inject(document.body);
        var popup = new Bootstrap.Popup(prompt, {persist: false});
        popup.show();
        link.store('Bootstrap.Popup', popup);
        return popup;
      }
    }
  });

  var make_prompt = function(options){
    content = options.body ? Elements.from(options.body) : options.content ? new Element('p').set('html', options.content) : '';
    buttons = options.buttons || [{
      'class': 'btn',
      'html': 'Cancel',
      'events': {
        'click': options.onCancel || function(){}
      }
    }, {
      'class': 'btn btn-ok ' + (options.deleting ? 'btn-danger' : 'btn-primary'),
      'html': options.deleting ? 'DELETE' : 'Ok',
      'href': options.url,
      'events': {
        'click': options.onConfirm || function(){}
      }
    }];
    if (Bootstrap.version == 2){
      return new Element('div.modal.confirm').adopt(
        new Element('div.modal-header').adopt(
          new Element('a.close').set('html', 'x'),
          new Element('h3').set('html', options.caption)
        ),
        new Element('div.modal-body').adopt(content),
        new Element('div.modal-footer').adopt(
          buttons.map(function(button){
            return new Element('a', button).addClass('dismiss');
          })
        )
      );
    } else {
      return new Element('div.modal.confirm').adopt(
        new Element('div.modal-dialog').adopt(
          new Element('div.modal-content').adopt(
            new Element('div.modal-header').adopt(
              new Element('a.close.fui-cross'),
              new Element('h6').set('html', options.caption)
            ),
            new Element('div.modal-body').adopt(content),
            new Element('div.modal-footer').adopt(
              buttons.map(function(button){
                return new Element('a', button).addClass('dismiss');
              })
            )
          )
        )
      );
    }
  };

})();
/*
---

name: Delegator.EnableForm

description: Delegator for enabling all form inputs and selects for the target form,
             unless that input has data-remain-locked set

requires:
 - Behavior/Delegator

provides: [Delegator.EnableForm]

...
*/

// <div class="locked"
//   data-trigger="enableForm"
//   data-enableform-options="'target': '!div#programs form#merchant_programs'"
//   <i class="icon-lock icon-white"></i>
// </div>

Delegator.register('click', {
  enableForm: {
    defaults: {
      inputSelector: 'input:not([data-remain-locked]), select:not([data-remain-locked]), textarea:not([data-remain-locked])'
    },
    requireAs: {
      target: String
    },
    handler: function(event, element, api){
      var target =  api.getElement('target');
      api.fireEvent('formUnlock', [target]);
      target.getElements(api.get('inputSelector')).set('disabled', false);
    }
  }
});
/*
---
description: Provides methods to reveal, dissolve, nix, and toggle using Fx.Reveal.
provides: [Delegator.FxReveal, Delegator.Reveal, Delegator.ToggleReveal, Delegator.Dissolve, Delegator.Nix, Delegator.Fx.Reveal]
requires: [Behavior/Delegator, More/Fx.Reveal]
script: Delegator.Fx.Reveal.js
name: Delegator.Fx.Reveal

...
*/
(function(){

  var triggers = {};

  ['reveal', 'toggleReveal', 'dissolve', 'nix'].each(function(action){

    triggers[action] = {
      handler: function(event, link, api){
        var targets;
        if (api.get('target')){
          targets = new Elements([api.getElement('target')]);
        } else if (api.get('targets')){
          targets = api.getElements('targets');
        } else {
          targets = new Elements([link]);
        }

        var fxOptions = api.getAs(Object, 'fxOptions');
        if (fxOptions){
          targets.each(function(target){
            target.get('reveal').setOptions(fxOptions);
          });
        }
        if (action == 'toggleReveal') targets.get('reveal').invoke('toggle');
        else targets[action]();
        if (!api.getAs(Boolean, 'allowEvent')) event.preventDefault();
      }
    };

  });

  Delegator.register('click', triggers);

})();
/*
---

name: Delegator.InputMirror

description: Delegator for tying the values of two inputs together

requires:
 - Behavior/Delegator

provides: [Delegator.InputMirror]

...
*/

  // <input
  // data-trigger="inputMirror"
  // data-inputmirror-options="{
  //   'targets':'!body .cardspring-business-id'
  // }" >

Delegator.register(['change','keyup'], {
  inputMirror: {
    requireAs: {
      targets: Array
    },
    handler: function(event, element, api){
      var targets = api.get('targets');

      if (!targets && targets.length) api.fail('Unable to find targets option.');


      targets.each(function(target){
        var targetElement = element.getElement(target.selector);
        if (!targetElement) api.warn('Unable to find element for inputMirror selector: '+target.selector);
        if (targetElement && targetElement != element){
          targetElement.set(target.property || 'value', element.get('value'));
        }
      });
    }
  }
});

/*
---

name: Delegator.Invoke.Toggle

description: Delegator for invoking two actions for a delegated event

requires:
 - Behavior/Delegator

provides: [Delegator.Invoke.Toggle]

...
*/


/*
  <a data-trigger="invoke.toggle"
    data-invoke-toggle-options="
      'target': 'self', //default
      'condition':{
        'method': 'get',
        'args': ['html'],
        'value': 'On'
      },
      'on': {
        'method': 'removeClass',
        'args': ['someClass']
      },
      'off': {
        'method': 'removeClass',
        'args': ['someClass']
      }
    "
  />
*/


Delegator.register('click', {
  'invoke.toggle': {
    requireAs: {
      on: Object,
      off: Object
    },
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElements('target');
      var condition = api.getAs(Object, 'condition'),
          on = api.getAs(Object, 'on'),
          off = api.getAs(Object, 'off');
      var hide = target[0][condition.method].apply(target[0], condition.args || []) == condition.value;
      var action = hide ? off : on;
      target[action.method].apply(target, action.args);
    }
  }
});

/*
---

name: Delegator.Invoke

description: Delegator for invoking an action for a delegated event

requires:
 - Behavior/Delegator

provides: [Delegator.Invoke]

...
*/


/*
  <input data-trigger="invoke"
    data-invoke-options="
      {
        'action': 'removeClass',
        'args': ['someClass'],
        'targets': '!.some-parent .some-child-of-that-parent'
      }
    "
  />
*/


Delegator.register('click', {
  invoke: {
    requireAs: {
      action: String,
      args: Array,
      targets: String
    },
    handler: function(event, element, api){
      var targets = api.getElements('targets');
      targets[api.get('action')].apply(targets, api.get('args'));
    }
  }
});

/*
---

name: Delegator.ScrollToElement

description: Scrolls the window (or another element) to a target element

requires:
 - Behavior/Delegator
 - More/Fx.Scroll

provides: [Delegator.ScrollToElement]

...
*/
(function(){

  Delegator.register('click', 'scrollToElement', {
    defaults: {
      target: 'window',
      scrollMethod: 'toElement' //alternates: toElementEdge, toElementCenter
    },
    handler: function(event, element, api){
      var fx = element.retrieve('scrollToElement');
      if (!fx){
        var target = api.get('target') ? api.getElement('target') : element;
        fx = new Fx.Scroll(target,
          Object.cleanValues({
            offset: api.getAs(Object, 'offset'),
            duration: api.getAs(Number, 'duration'),
            transition: api.get('transition')
          })
        );
        element.store('scrollToElement', fx);
      }
      var toElement;
      if (api.get('toElement')) toElement = api.getElement('toElement');
      else toElement = document.body.getElement(element.get('href')); // allows for simple #name links
      if (!toElement) api.fail('Could not scroll to element ', api.get('toElement') || element.get('href'));
      event.preventDefault();
      fx[api.get('scrollMethod')](toElement, api.get('axes'), api.get('offset'));
    }

  });

})();
/*
---
description: Sets an input value to equal the value selected in a select list when that list selection changes
provides: [Delegator.SelectToSet]
requires: [Behavior/Delegator]
name: Delegator.SelectToSet
...
*/
Delegator.register('change', {
  selectToSet: {
    handler: function(event, element, api){
      var target = api.getElement('target');
      target.set('value', element.getSelected()[0].get('value'));
    }
  }
});
/*
---
name: Delegator.SelectWithOther
description: Allows users to enter an "other" value for a select list.
provides: [Delegator.SelectWithOther, Behavior.FormValidatorChanges]
requires: [Behavior/Delegator, More/Fx.Reveal]
...
*/
Delegator.register('change', {
  selectWithOther: {
    requires: ['target'],
    defaults: {
      otherValue: 'other'
    },
    handler: function(event, element, api){
      var target = api.getElement('target');
      var after = function(){
        var b = api.getBehavior();
        if (b) b.fireEvent('formLayoutChange');
      };
      if (element.getSelected()[0].get('value') == api.get('otherValue')){
        target.reveal().get('reveal').chain(after);
      } else {
        target.dissolve().get('dissolve').chain(after);
      }
    }
  }
});

Behavior.addGlobalPlugin('FormValidator', 'FormValidatorChanges', function(element, api, fvInstance){
  var watcher = function(){
    fvInstance.reset().validate();
  };
  api.addEvent('formLayoutChange', watcher);
  api.onCleanup(function(){
    api.removeEvent('formLayoutChange', watcher);
  });
});
/*
---
description: Provides methods to set or toggle properties on target elements.
provides: [Delegator.setProperty, Delegator.eraseProperty, Delegator.toggleProperty]
requires: [Behavior/Delegator, Core/Element]
script: Delegator.SetProperty.js
name: Delegator.SetProperty

...
*/
(function(){
  var triggers = {};

  ['set', 'erase', 'toggle'].each(function(action){

    triggers[action + 'Property'] = {
      require: ['property'],
      handler: function(event, link, api){
        var target = link;
        if (api.get('target') && api.get('target') != 'self'){
          target = link.getElement(api.get('target'));
          if (!target) api.fail('could not locate target element to ' + action + ' its property', link);
        }
        var current = target.get(api.get('property'));
        if (current !== null) current = current.toString();
        if (action == 'set' || (action == 'toggle' && current != api.get('value'))){
          if (api.get('value') === null) api.fail('Could not retrieve eraseproperty-value option from element.');
          target.set(api.get('property'), api.get('value'));
        } else {
          target.erase(api.get('property'));
        }
      }
    };

  });

  Delegator.register('click', triggers);

})();
/*
---

name: Delegator.ShowOnSelect

description: ShowOnSelect trigger hides/shows a target element when it's corresponding
             option is selected.

requires:
 - Behavior/Delegator
 - Core/Element.Style

provides: [Delegator.ShowOnSelect]

...
*/

// ShowOnSelect trigger hides/shows a target element when it's corresponding
// option is selected. If the option does not reference a target, all are hidden.
// Option elements should specify a data-target selector relative to the select list
// OR specify an array of selectors in the behavior declaration

(function(){
  // hides all targets specified on options of the select list
  var hideAll = function(api, element){
    element.getElements('option').each(function(option){
      var targets = getTargetElements(api, element, option);
      if (targets.length){
        if (api.get('hideClass')) targets.addClass(api.get('hideClass'));
        else if (api.get('showClass')) targets.removeClass(api.get('showClass'));
        else targets.setStyle('display', 'none');

        // if disableInputs option is set, disable all nested input or
        // select elements of the given to-be-hidden target
        if(api.get('disableInputs')){
          targets.each(function(target){
            target.getElements('input, select:not([data-remain-locked])')
                  .set('disabled', 'true')
          });
        }
      }
    });
  };

  // function to get the element an option references
  var getTargetElements = function(api, element, option){
    // get the selector specific to the option
    if (option.get('data-target')) return element.getElements(option.get('data-target'));
    // if there isn't a data-target value on the option, get all the targets specified in the behavior
    // and the get the element at the same index as this option

    var selector = api.get('targets')[element.getElements('option').indexOf(option)];
    return selector ? element.getElements(selector) : [];
  };



  Delegator.register('change', {
    showOnSelect: {
      defaults: {
        // hideClass: '',
        // showClass: '',
        display: 'inline-block',
        disableInputs: false
      },
      handler: function(event, element, api){
        if (element.get('tag') != 'select') api.fail('ShowOnSelect only works on select elements.');

        // hide all the possible targets
        hideAll(api, element);
        // get the target that corresponds to the selected option
        var targets = getTargetElements(api, element, element.getSelected()[0]);
        if (targets.length){
          if (api.get('hideClass')) targets.removeClass(api.get('hideClass'));
          else if (api.get('showClass')) targets.addClass(api.get('showClass'));
          else targets.setStyle('display', api.get('display'));

          // if disableInputs option is set, reenable all nested input or
          // select elements of the given to-be-shown target
          if(api.get('disableInputs')){
            targets.each(function(target){
              target.getElements('input, select:not([data-remain-locked])')
                    .set('disabled', '')
            });
          }
        }
      }
    }
  });
})();

/*
---
name: Delegator.SpinOnClick
description: Starts the Spinner on a target element when the source element is clicked.
provides: [Delegator.SpinOnClick, Delegator.UnSpinOnClick]
requires: [Behavior/Delegator, More/Spinner]
...
*/

Delegator.register('click', {

  spinOnClick: {
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElement('target');
      target.spin();
      return target.get('spinner');
    }
  },

  unSpinOnClick: {
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElement('target');
      target.unspin();
      return target.get('spinner');
    }
  }

});

/*
---
description: Prompts the user to confirm a link click.
provides: [Delegator.SpinAndConfirm]
requires: [Delegator.Confirm, Delegator.SpinOnClick]
name: Delegator.SpinAndConfirm

...
*/
Delegator.register('click', {
  spinAndConfirm: {
    handler: function(event, link, api){
      var popup = api.trigger('confirm', link, event);
      var spinner = api.trigger('spinOnClick', link, event);

      var keepSpinning = false;

      popup.element.getElements('.btn-ok').addEvent('click', function(){
        keepSpinning = true;
      });
      popup.addEvent('hide', function(){
        (function(){
          if (!keepSpinning) spinner.hide();
        }).delay(100);
      });
    }
  }
});
/*
---

name: Delegator.SpinOnSubmit

description: Delegator for showing a spinner when a form is submitted.

requires:
 - Behavior/Delegator
 - More/Spinner

provides: [Delegator.SpinOnSubmit]

...
*/

Delegator.register('submit', {
  spinOnSubmit: {
    handler: function(event, form, api){
      form.spin();
    }
  }
});
/*
---
description: When the user clicks a link with this delegator, submit the target form.
provides: [Delegator.SubmitLink]
requires: [Behavior/Delegator]
script: Delegator.SubmitLink.js
name: Delegator.SubmitLink

...
*/

(function(){

  var injectValues = function(form, data){
    var injected = new Elements();
    Object.each(data, function(value, key){
      if (typeOf(value) == 'array'){
        value.each(function(val){
          injected.push(
            new Element('input', {
              type: 'hidden',
              name: key,
              value: val
            }).inject(form)
          );
        });
      } else {
        new Element('input', {
          type: 'hidden',
          name: key,
          value: value
        }).inject(form);
      }
    });
    return injected;
  };

  Delegator.register('click', {

    'submitLink': function(event, el, api){
      var formSelector = api.get('form') || '!form';
      var form = el.getElement(formSelector);
      if (!form) api.fail('Cannot find target form: "' +formSelector+ '" for submitLink delegator.');
      var rq = form.retrieve('form.request');
      var extraData = api.getAs(Object, 'extra-data');
      var injected;
      if (extraData) injected = injectValues(form, extraData);
      if (rq) rq.send();
      else form.submit();
      if (injected) injected.destroy();
    }

  });

})();
/*
---

name: Delegator.SubmitOnChange

description: Submits a form when an input within it is changed.

requires:
 - Behavior/Delegator

provides: [Delegator.SubmitOnChange]

...
*/

Delegator.register('change', 'submitOnChange', {
  defaults: {
    onlyOnce: true
  },
  handler: function(event, element, api){
    var form = element;
    if (api.get('target')) form = api.getElement('target');
    if (api.get('onlyIfSet') && !element.get('value')) return;
    if (!api.getAs(Boolean, 'onlyOnce') || (api.get('onlyOnce') && !form.retrieve('submitted'))){
      form.fireEvent('submit').submit();
      form.store('submitted', true);
    }
  }

});
/*
---

name: Behavior.FlatUI.FormValidator

description: Adds validation state css class to form-group elements when their inner inputs fail.

requires:
 - Behavior.FormValidator

provides: [Behavior.FlatUI.FormValidator]

...
*/

/*

  If you're using standard FlatUI / Bootstrap markup, this plugin will add the 'validation-failed' class
  to the parent '.form-group' element whenever an input fails validation. You can then style the contents
  as you like. In FlatUI, this means you can make inputs w/ suffix buttons both have the red outline.

*/


(function(){
  var plugin = {
    setup: function(element, api, instance){
      instance.addEvent('elementFail', function(field){
        var fg = field.getParent('.form-group');
        if (fg) fg.addClass('validation-failed');
      });

      instance.addEvent('elementPass', function(field){
        var fg = field.getParent('.form-group');
        if (fg) fg.removeClass('validation-failed');
      });
    }
  };

  Behavior.addGlobalPlugin("FormValidator", "FlatUI.FormValidator", plugin);
  Behavior.addGlobalPlugin("FormValidator.BS.Tips", "FlatUI.FormValidator.BS.Tips", plugin);

})();


/*
---

name: FlatUI.FormValidator

description: Patches form Validator.Tips to show validation errors on FlatUI replacement select lists.

requires:
 - Bootstrap.Form.Validator.Tips

provides: [FlatUI.FormValidator]

...
*/

(function(){

  var validatorFix = {
    makeAdvice: function(className, field, error, warn){
      var advice = this.previous.apply(this, arguments);
      var select = field.retrieve('select');
      if (select){
        advice.element = select.element;
        advice.show();
        select.addEvent('select', function(){
          this.validateField(field, true);
        }.bind(this));
      }
      return advice;
    },
    test: function(className, field, warn){
      var select = field.retrieve('select');
      if (select && !field.isVisible()){
        if (this.options.ignoreHidden && !select.element.isVisible()) return true;
        var styles = field.getStyles('position', 'visibility', 'display');
        field.setStyles({
          position: 'absolute',
          visibility: 'hidden',
          display: 'block'
        });
        var result = this.previous.apply(this, arguments);
        field.setStyles(styles);
        return result;
      } else {
        return this.previous.apply(this, arguments);
      }
    }
  };

  Form.Validator.Inline = Class.refactor(Form.Validator.Inline, validatorFix);
  Bootstrap.Form.Validator.Tips = Class.refactor(Bootstrap.Form.Validator.Tips, validatorFix);

})();

/*
---

name: FlatUI

description: Basic setup for FlatUI CSS to operate properly

requires:
 - Core/DomReady
 - Core/Element.Dimensions

provides: [FlatUI]

...
*/

var FlatUI = {};

window.addEvent('domready', function(){

  document.addEvents({
    // flatui expects that when you focus an input that the parent .form-group has the "focus" class
    // which allows all the controls in that container to be styled for that state.
    'focus:relay(input,select,textarea)': function(event, input){
      var parent = input.getParent('.form-group, .input-group');
      if (parent) parent.addClass('focus');
    },
    'blur:relay(input,select,textarea)': function(event, input){
      var parent = input.getParent('.form-group, .input-group');
      if (parent) parent.removeClass('focus');
    }
  });

});

window.addEvent('load', function(){
  if (!window.behavior || !behavior.getFilter('FlatUI.Select')) return;

  var styleSelect = function(select){
    if (select.hasBehavior('FlatUI.Select') || select.hasClass('no-flat-select')) return;
    behavior.applyFilter(select, behavior.getFilter('FlatUI.Select'));
  };

  var styleSelects = function(container){
    if (container.get('tag') == 'select') styleSelect(container);
    else container.getElements('select').each(styleSelect);
  };
  styleSelects(document.body);
  behavior.addEvent('ammendDom', styleSelects);
});

/*
---

name: FlatUI.Select

description: FlatUI Select styling.

requires:
 - Core/Element.Event
 - Core/Element.Style
 - More/Fx.Scroll
 - FlatUI


provides: [FlatUI.Select]

...
*/


FlatUI.Select = new Class({

  Implements: [Options, Events],

  options: {
    // menuClass: '',
    buttonClass: 'btn-primary',
    noneSelectedText : 'Nothing selected',
    arrowClass: 'dropdown-arrow',
    closeOnEsc: true
  },

  initialize: function(element, options){
    this.select = document.id(element);
    this.select.store('select', this);
    this.setOptions(options);
    // store whether or not we're doing multi-select
    this.multiple = this.options.multiple || !!this.select.get('multiple');
    // bound functions for events
    this.bound = {
      show: this.show.bind(this),
      bodyClickHandler: function(e){
        if (e.target != this.element && !this.element.contains(e.target)){
          this.hide();
          this.disableKeys();
        }
      }.bind(this),
      keyMonitor: function(e){
        if (e.key == 'esc') this.hide();
      }.bind(this),
      focus: this.focus.bind(this),
      checkFocus: this.checkFocus.bind(this)
    };
    // build the UI
    this.build();
    // attach events
    this.attach();
    // disable if needed
    if (this.select.get('disabled')) this.disable();
    // hide the original select element
    this.select.setStyle('display', 'none');
  },

  build: function(){
    // get the classes from the select element and transfer them to our HTML UI
    var elementClasses = this.select.get('class') ? this.select.get('class').split(' ') : [];
    var classes = elementClasses.erase('selectpicker').combine(['btn-group','select']);
    // the container for the HTML UI
    this.element = new Element('div.' + classes.join('.')).inject(this.select, 'after');
    // The button the user clicks to interact
    this.button = new Element('button.btn.dropdown-toggle.clearfix', {
      html: "<span class='filter-option pull-left'></span>&nbsp;" +
            "<span class='caret'></span>",
      events: {
        click: function(e){
          /*
            When you hit enter in a form input, the browser finds the nearest button and
            calls its click event. The event passed to it is even marked as being a click.
            The only way to tell that it wasn't a click is that there are no coords for
            it. So I check if the input has x and y values and if it does, I treat it
            like a mouse event, otherwise, the keyboard.
          */
          if (e.page.x && e.page.y) this.show(e);
        }.bind(this),
        focus: this.bound.focus
      }
    }).addClass(this.options.buttonClass || '').inject(this.element);
    new Element('i.dropdown-arrow').inject(this.element).addClass(this.options.arrowClass || '');
    // the element that shows the selected values
    this.filterOption = this.button.getElement('.filter-option');
    // the list of options to click
    this.list = new Element('ul.dropdown-menu.full-width').addClass(this.options.menuClass || '').inject(this.element);
    // build the options for the list
    this.buildOptions();
    // update the button to show what's selected now
    this.updateButton();
  },

  // attaches event handlers to our dom elements
  attach: function(_detach){
    var method = _detach ? 'removeEvent' : 'addEvent';
    // if this element has an id
    var id = this.select.get('id');
    // add an event listener for labels to select it
    if (id) document[method]('click:relay(label[for="' + id + '"])', this.bound.show);
    // monitor for click-out to hide it
    document[method]('click', this.bound.bodyClickHandler);
    // close when the user hits esc
    if (this.options.closeOnEsc) document[method]('keyup', this.bound.keyMonitor);
  },

  // detach and destroy; restore original input
  destroy: function(){
    this.attach(true);
    this.element.destroy();
    this.select.setStyle('display', '');
  },

  // disable the UI
  disable: function(){
    this.disabled = true;
    this.button.addClass('disabled');
  },

  // enable the UI
  enable: function(){
    this.disabled = false;
    this.button.removeClass('disabled');
  },

  buildOptions: function(){
    // empty the list
    this.list.empty();
    // get the elements and option groups
    this.select.getElements('> optgroup, > option').map(function(opt, i){
      // if it's an option group
      if (opt.get('tag') == 'optgroup'){
        // get all the options in the option group
        var options = opt.getElements('option');
        // drop the first as makeOptGroupItem uses the first one
        options.shift();

        // great the option gropu header which needs the first option
        var optGroup = this.makeOptGroupItem(opt);
        // if we're not on the first item, drop in a divider
        if (i > 0) new Element('div.divider').inject(optGroup, 'top');
        // inject it into the list
        this.list.adopt(optGroup);
        // go through the remaining options in the group and drop them into the list
        options.each(function(option){
          this.list.adopt(this.makeOptionItem(option, 'opt'));
        }, this);
      } else {
        // otherwise it's an option, drop it in the list.
        this.list.adopt(this.makeOptionItem(opt));
      }
    }, this);
  },

  // updates the button w/ the text of the selected elements.
  updateButton: function(){
    this.filterOption.set('html', this.select.getSelected().map(this.getOptionText, this).join(', ') || this.options.noneSelectedText);
  },

  // makes a group item
  makeOptGroupItem: function(optGroup){
    // grab the first option
    var firstOption = optGroup.getElement('option');
    // create our list item
    var item = new Element('li', {
      'class': firstOption.get('selected') ? 'selected' : ''
    }).adopt(
      // the group header
      new Element('dt', {
        html: optGroup.get('label')
      })
    );
    if (firstOption){
      item.adopt(
        // the option itself
        this.makeOptionLink(firstOption, 'opt')
      );
      firstOption.store('select.item', item);
    }
    return item;
  },

  // make a regular option item for the list
  makeOptionItem: function(option, itemClass, linkClass){
    // the list item
    var item = new Element('li', {
      // the class is the itemClass from the args, selected if the
      // option is selected, disabled if the option disabled
      'class': (itemClass || '') +
               (option.get('selected') ? ' selected': '') +
               (option.hasClass('disabled') || option.get('disabled') ? 'disabled' : '')
    }).adopt(
      // inject the link into the list item
      this.makeOptionLink(option, linkClass)
    );
    option.store('select.item', item);
    return item;
  },

  // makes the link for the option
  makeOptionLink: function(option, linkClass){
    // the link
    var link = new Element('a', {
      // no tab index for you
      tabindex: -1,
      // class is the linkClass from args, selected if option is selected, plus any class on the option itself
      'class': [(linkClass || ''), (option.get('selected') ? ' active' : ''), option.get('class')].join(' '),
      events: {
        // when you click it, select unless the option is disabled
        click: function(e){
          e.stop();
          if (!link.hasClass('disabled')) this.selectOption(option, e);
        }.bind(this)
      }
    }).adopt(
      // the text of the option
      new Element('span.pull-left', {
        html: this.getOptionText(option)
      })
    );
    // add disabled class if the option is disabled
    if (option.get('disabled')) link.addClass('disabled');
    option.store('select.link', link);
    return link;
  },

  // gets the text of an option; if no text found, uses value
  getOptionText: function(option){
    return option.get('text') === null ? option.get('value') : option.get('text');
  },

  // removes selected state from all HTML UI elements
  reset: function(){
    this.element.getElements('.selected').removeClass('selected');
    this.element.getElements('.active').removeClass('active');
  },

  // selects an option - argument here is the option in the original select list
  selectOption: function(option, e){
    // are we doing multiple here? then toggle
    var select = this.multiple ? !option.get('selected') : true;
    // if we're selecting, we're adding the classes, otherwise remove
    var action = select ? 'addClass' : 'removeClass';
    // if we're not doing multiple, deselect everything else
    if (!this.multiple) this.reset();
    // get the link and add the active class
    option.retrieve('select.link')[action]('active');
    // get the list item and add the selected class
    option.retrieve('select.item')[action]('selected');
    // set the original option's selected state so we can submit it
    option.set('selected', select);
    this.select.fireEvent('change', e);
    // fire an event for this action
    this.fireEvent(select ? 'select' : 'deselect', [option, e]);
    // update the button state to show what's selected
    this.updateButton();
    // if we're not doing multiple, hide it
    if (!this.multiple){
      this.hide();
      this.button.focus();
    }
  },

  // shows the dropdown
  show: function(e){
    if (e) e.preventDefault();
    if (this.disabled || this.open) return;
    this.button.focus();
    this.element.addClass('open');
    this.scrollTo();
    this.open = true;
    this.enableKeys();
    this.fireEvent('show');
  },

  focus: function(e){
    this.enableKeys();
  },

  checkFocus: function(e){
    if (!this.element.contains(e.target)) this.disableKeys();
  },

  scrollTo: function(option){
    option = option || this.element.getElements('li > a')[this.select.getElements('option').indexOf(this.select.getSelected()[0])];
    if (!option) return;
    if (!this.fx) this.fx = new Fx.Scroll(this.list, {duration: 0, offset: {y: -50}});
    this.fx.toElement(option);
  },

  // hides the dropdown
  hide: function(){
    this.element.removeClass('open');
    this.open = false;
    this.fireEvent('hide');
  },

  enableKeys: function(){
    if (this.keysOn) return;
    if (!this.bound.interaction){
      this.bound.keystopper = function(e){
        switch(e.key){
          case 'up':
          case 'down':
          case 'enter':
            e.stop();
            break;
        }
      };
      this.bound.interaction = function(e){
        switch(e.key){
          case 'up':
            this.up();
            break;
          case 'down':
            this.down();
            break;
          case 'enter':
            this.enter(e);
            break;
          case 'tab':
            if (!this.element.contains(e.target)){
              this.hide();
              this.disableKeys();
            }
            break;
        }
      }.bind(this);
    }

    document.addEvent('relay:focus(*)', this.bound.checkFocus);
    document.addEvent('keyup', this.bound.interaction);
    document.addEvent('keydown', this.bound.keystopper);
    this.keysOn = true;
  },

  disableKeys: function(){
    if (!this.keysOn) return;
    document.removeEvent('relay:focus(*)', this.bound.checkFocus);
    document.removeEvent('keyup', this.bound.interaction);
    document.removeEvent('keydown', this.bound.keystopper);
    this.keysOn = false;
  },

  getFocused: function(){
    if (this.focused === undefined){
      this.focused = this.select.getElements('option')
                         .indexOf(this.select.getSelected()[0]);
    }
    if (this.focused == -1) this.focused = 0;
    return this.focused;
  },

  up: function(){
    this.show();
    this.getFocused();
    if (this.focused === 0) return;
    this.focused = this.focused - 1;
    var option = this.list.getElements('li > a')[this.focused];
    option.focus();
    this.scrollTo(option);
  },

  down: function(){
    var open = this.open;
    this.show();
    this.getFocused();
    if (this.focused == this.select.getElements('option').length - 1) return;
    this.focused = this.focused + 1;
    var option = this.list.getElements('li > a')[this.focused];

    if (!open){
      // if it's not open yet, some browsers (*cough*Chrome*cough*) don't focuse
      // the option beause of the transition in showing, so we delay the first one.
      (function(){
        option.focus();
      }).delay(20);
    } else {
      option.focus();
    }

    this.scrollTo(option);
  },

  enter: function(e){
    if (this.focused !== undefined && this.open){
      this.selectOption(this.select.getElements('option')[this.focused], e);
    }
  }

});
/*
---

name: Behavior.FlatUI.Select

description: Converts select lists into HTML rendered UIs per FlatUI.

requires:
 - Behavior/Behavior
 - FlatUI.Select

provides: [Behavior.FlatUI.Select]

...
*/

Behavior.addGlobalFilter('FlatUI.Select', {

  returns: FlatUI.Select,

  setup: function(el, api){
    var select = new FlatUI.Select(el,
      Object.cleanValues(
        api.getAs({
          menuClass: String,
          buttonClass: String,
          arrowClass: String,
          noneSelectedText : String,
          closeOnEsc: Boolean
        })
      )
    );
    select.addEvent('select', function(option, event){
      if (el.getTriggers().length){
        var delegator = api.getDelegator();
        if (!delegator) return;
        event.type = 'change';
        delegator._eventHandler(event, el);
      }
    });
    if (el.hasClass('disabled')) select.disable();
    api.onCleanup(select.destroy.bind(select));
    return select;
  }
});
/*
---

name: Form.Filter

description: Filters a DOM element as the user types.

requires:
 - Core/Class.Extras
 - Core/Element.Event

provides: [Form.Filter]

...
*/

Form.Filter = new Class({

  Implements: [Options, Events],

  options: {
    items: '+ul li',
    text: 'a',
    hideClass: 'hide',
    rateLimit: 200
  },

  initialize: function(element, options){
    this.element = document.id(element);
    this.setOptions(options);
    this.bound = {
      filter: this.filter.bind(this)
    };
    this.attach();
  },

  attach: function(_detach){
    var method = _detach ? 'removeEvents' : 'addEvents';
    this.element[method]({
      keyup: this.bound.filter
    });
    return this;
  },

  detach: function(){
    return this.attach(true);
  },

  filter: function(){
    clearTimeout(this.timer);
    this.timer = this._filter.delay(this.options.rateLimit, this);
  },

  _filter: function(){
    var value = this.element.get('value');
    var elements = this.element.getElements(this.options.items)
    if (!value){
      elements.removeClass(this.options.hideClass);
    } else {
      elements.each(function(item){
        var text = item;
        if (this.options.text) text = item.getElement(this.options.text);
        if (!text){
          item.addClass(this.options.hideClass);
          return;
        }
        if (text.get('html').test(value, 'i')) item.removeClass(this.options.hideClass);
        else item.addClass(this.options.hideClass);
      }, this);
    }
  }
});
/*
---

name: Behavior.Filter

description: Filters a DOM element as the user types.

requires:
 - Behavior/Behavior
 - Form.Filter

provides: [Behavior.Filter]

...
*/

Behavior.addGlobalFilter('Filter', {

  returns: Form.Filter,

  setup: function(el, api){
    api.getElements('items'); //throws error if no items are found.

    var filter = new Form.Filter(el,
      Object.cleanValues(
        api.getAs({
          items: String,
          text: String,
          hideClass: String,
          rateLimit: Number
        })
      )
    );
    api.onCleanup(function(){
      filter.detach();
    });
    return filter;
  }
});
/*
---

script: OverText.js

name: OverText

description: Shows text over an input that disappears when the user clicks into it. The text remains hidden if the user adds a value.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Event
  - Class.Binds
  - Class.Occlude
  - Element.Position
  - Element.Shortcuts

provides: [OverText]

...
*/

var OverText = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['reposition', 'assert', 'focus', 'hide'],

	options: {/*
		textOverride: null,
		onFocus: function(){},
		onTextHide: function(textEl, inputEl){},
		onTextShow: function(textEl, inputEl){}, */
		element: 'label',
		labelClass: 'overTxtLabel',
		positionOptions: {
			position: 'upperLeft',
			edge: 'upperLeft',
			offset: {
				x: 4,
				y: 2
			}
		},
		poll: false,
		pollInterval: 250,
		wrap: false
	},

	property: 'OverText',

	initialize: function(element, options){
		element = this.element = document.id(element);

		if (this.occlude()) return this.occluded;
		this.setOptions(options);

		this.attach(element);
		OverText.instances.push(this);

		if (this.options.poll) this.poll();
	},

	toElement: function(){
		return this.element;
	},

	attach: function(){
		var element = this.element,
			options = this.options,
			value = options.textOverride || element.get('alt') || element.get('title');

		if (!value) return this;

		var text = this.text = new Element(options.element, {
			'class': options.labelClass,
			styles: {
				lineHeight: 'normal',
				position: 'absolute',
				cursor: 'text'
			},
			html: value,
			events: {
				click: this.hide.pass(options.element == 'label', this)
			}
		}).inject(element, 'after');

		if (options.element == 'label'){
			if (!element.get('id')) element.set('id', 'input_' + String.uniqueID());
			text.set('for', element.get('id'));
		}

		if (options.wrap){
			this.textHolder = new Element('div.overTxtWrapper', {
				styles: {
					lineHeight: 'normal',
					position: 'relative'
				}
			}).grab(text).inject(element, 'before');
		}

		return this.enable();
	},

	destroy: function(){
		this.element.eliminate(this.property); // Class.Occlude storage
		this.disable();
		if (this.text) this.text.destroy();
		if (this.textHolder) this.textHolder.destroy();
		return this;
	},

	disable: function(){
		this.element.removeEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		});
		window.removeEvent('resize', this.reposition);
		this.hide(true, true);
		return this;
	},

	enable: function(){
		this.element.addEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		});
		window.addEvent('resize', this.reposition);
		this.reposition();
		return this;
	},

	wrap: function(){
		if (this.options.element == 'label'){
			if (!this.element.get('id')) this.element.set('id', 'input_' + String.uniqueID());
			this.text.set('for', this.element.get('id'));
		}
	},

	startPolling: function(){
		this.pollingPaused = false;
		return this.poll();
	},

	poll: function(stop){
		//start immediately
		//pause on focus
		//resumeon blur
		if (this.poller && !stop) return this;
		if (stop){
			clearInterval(this.poller);
		} else {
			this.poller = (function(){
				if (!this.pollingPaused) this.assert(true);
			}).periodical(this.options.pollInterval, this);
		}

		return this;
	},

	stopPolling: function(){
		this.pollingPaused = true;
		return this.poll(true);
	},

	focus: function(){
		if (this.text && (!this.text.isDisplayed() || this.element.get('disabled'))) return this;
		return this.hide();
	},

	hide: function(suppressFocus, force){
		if (this.text && (this.text.isDisplayed() && (!this.element.get('disabled') || force))){
			this.text.hide();
			this.fireEvent('textHide', [this.text, this.element]);
			this.pollingPaused = true;
			if (!suppressFocus){
				try {
					this.element.fireEvent('focus');
					this.element.focus();
				} catch(e){} //IE barfs if you call focus on hidden elements
			}
		}
		return this;
	},

	show: function(){
		if (document.id(this.text) && !this.text.isDisplayed()){
			this.text.show();
			this.reposition();
			this.fireEvent('textShow', [this.text, this.element]);
			this.pollingPaused = false;
		}
		return this;
	},

	test: function(){
		return !this.element.get('value');
	},

	assert: function(suppressFocus){
		return this[this.test() ? 'show' : 'hide'](suppressFocus);
	},

	reposition: function(){
		this.assert(true);
		if (!this.element.isVisible()) return this.stopPolling().hide();
		if (this.text && this.test()){
			this.text.position(Object.merge(this.options.positionOptions, {
				relativeTo: this.element
			}));
		}
		return this;
	}

});

OverText.instances = [];

Object.append(OverText, {

	each: function(fn){
		return OverText.instances.each(function(ot, i){
			if (ot.element && ot.text) fn.call(OverText, ot, i);
		});
	},

	update: function(){

		return OverText.each(function(ot){
			return ot.reposition();
		});

	},

	hideAll: function(){

		return OverText.each(function(ot){
			return ot.hide(true, true);
		});

	},

	showAll: function(){
		return OverText.each(function(ot){
			return ot.show();
		});
	}

});


/*
---
description: Sets up an input to have an OverText instance for inline labeling. This is a global filter.
provides: [Behavior.OverText]
requires: [Behavior/Behavior, More/OverText]
script: Behavior.OverText.js
name: Behavior.OverText
...
*/
Behavior.addGlobalFilter('OverText', function(element, api){

  //create the overtext instance
  var ot = new OverText(element, {
    textOverride: api.get('textOverride')
  });
  if (element.get('class')){
    element.get('class').split(' ').each(function(cls){
      if (cls) ot.text.addClass('overText-'+cls);
    });
  }
  element.getBehaviors().each(function(filter){
    if (filter != "OverText") ot.text.addClass('overText-'+filter);
  });

  //this method updates the text position with a slight delay
  var updater = function(){
    ot.reposition.delay(10, ot);
  };

  //update the position whenever the behavior element is shown
  api.addEvent('layout:display', updater);

  api.onCleanup(function(){
    api.removeEvent('layout:display', updater);
    ot.destroy();
  });

  return ot;

});

/*
---

name: Form.Filler

description: Given a set of input values, fills in the appropriate value into the appropriate inputs.

requires:
 - Core/Class.Extras
 - Core/Element.Event

provides: [Form.Filler]

...
*/


Form.Filler = new Class({

  Implements: [Options, Events],

  options: {
    // onFill: function(){},
    // allows you to override how target elements are found; by default, by ID
    getElement: function(key){
      return document.id(key);
    },
    formatters: {
      /* example formatter:
      //some-count is the id of the element and also the key for the data
      'some-count': {
        format: function(value){
          //formats the value and returns the result
          return value * (document.id('someTarget').get('value') || 0).toInt();
        }
      }
      */
    },
    // given a key and value, set the value into the element
    // by default calls .set('value', value), but, for example,
    // could easily use .set('html', value);
    setValue: function(key, value){
      this.options.getElement(key).set('value', value)
          .set('tween', {duration: 700})
          .tween('background-color', '#FFFAB3', '#ffffff');
    }
  },


  /*
    select - the selet input you want to monitor for changes
    data - a set of objects where the key for each object is the value of
           an option in the select list and the value is an object with
           key/value pairs of (typically) element ids and their corresponding value

    Example:

    <select>
      <option>bold</option>
      <option>pastel</option>
    </select>
    <input id="blue-hex"/>
    <input id="red-hex"/>

    Data would be:
    {
      "bold": {
        "blue-hex": '#0000FF',
        "red-hex":  '#FF0000'
      },
      "pastel": {
        "blue-hex": '#8493CA',
        "red-hex":  '#F7977A'
      }
    }

  */

  initialize: function(select, data, options){
    this.select = document.id(select);
    this.data = data;
    this.setOptions(options);
    this.attach();
  },

  attach: function(_method){
    _method = _method || 'addEvents';
    if (!this.bound){
      this.bound = {
        fill: this.fill.bind(this)
      };
    }
    this.select[_method]({
      change: this.bound.fill
    });
  },

  detach: function(){
    this.attach('removeEvents');
  },

  // fills all the specified inputs with provided data
  fill: function(){
    // get the data that maps to the selected item
    var data = this.data[this.select.getSelected()[0].get('value')];
    // if we found any, let's run through
    if (data){
      Object.each(data, function(value, key){
        // if there's a custom formatter for any given key,
        // use it to format the value
        var formatter = this.options.formatters[key];
        if (formatter) value = formatter.format(value);
        // set the value
        this.options.setValue.apply(this, [key, value]);
      }, this);
      this.fireEvent('fill');
    }
  }

});

/*
---

name: FrameFlow

description: Provides a simplified Finite State Machine for managing UI flows in which
  transitions and states are encapsulated into Frame instances

requires:
 - Core/Class.Extras
 - Core/Element.Delegation
 - Behavior/Element.Data

provides: [FrameFlow]

...
*/

var FrameFlow = new Class({

  Implements: [Options],

  options: {
    startIndex: 0
  },

  frames: [],

  initialize: function(element, options){
    this.element = element;
    this.setOptions(options);

    this.currentIndex = this.options.startIndex;

    this.refresh();
    // set up the controls
    this.attach();

    // set the first frame to active
    this.frames.some(function(frame, index){
      frame.addState('activeState');
      if (index == this.options.startIndex) return true;
      frame.addState('exitState');
      return false;
    }, this);
    // this.frames[this.options.startIndex].addState('activeState');
  },

  refresh: function(){

    // find all frames
    this.frameElements = this.element.getElements('[data-frameflow-frame]');

    // and turn them into an array of Frame instances
    this.frameElements.each(function(frameElement){
      this.frames.include(new FrameFlow.Frame(frameElement));
    }, this);

  },

  attach: function(_detach){
    if (!this.boundEvents){
      this.boundEvents = {
        next: this.next.bind(this),
        previous: this.previous.bind(this),
        target: this.getTarget.bind(this)
      };
    }
    var eventMethod = _detach || 'addEvents';
    this.element[eventMethod]({
      'click:relay([data-frameflow-previous])': this.boundEvents.previous,
      'click:relay([data-frameflow-next])': this.boundEvents.next,
      'click:relay([data-frameflow-target])': this.boundEvents.target
    });
  },

  detach: function(){
    this.attach('removeEvents');
  },

  getFrameIndexBySelector: function(selector){
    var foundIndex;
    this.frameElements.some(function(frameElement, index){
      if (frameElement.match(selector)){
        foundIndex = index;
        return true;
      }
      return false;
    });

    return foundIndex;
  },

  next: function(){
    // goes to the next frame in array order
    if (this.currentIndex + 1 == this.frames.length) return;
    this.transition(this.currentIndex + 1);
  },

  previous: function(){
    // goes back to the last active frame, not back 1

    if (this.currentIndex - 1 < 0) return;

    var lastActiveIndex = 0;
    this.frames.slice(0, this.currentIndex).each(function(frame, index){
      if (frame.active) lastActiveIndex = index;
    });

    this.transition(lastActiveIndex);
  },

  getTarget: function(event, element){
    var targetSelector = element.getData('frameflow-target');
    var targetIndex = this.getFrameIndexBySelector(targetSelector);
    this.transition(targetIndex);
  },

  transition: function(index){
    if (index == this.currentIndex) return;
    if (index > this.currentIndex){
      this.frames[this.currentIndex].addState('exitState');
      this.frames[index].addState('activeState');
    } else {
      this.frames[this.currentIndex].removeState('activeState');
      this.frames[index].removeState('exitState');
    }
    this.currentIndex = index;
  }

});

FrameFlow.Frame = new Class({
  active: false,
  exited: false,
  initialize: function(element){
    this.element = element;
    var data = element.getJSONData('frameflow-frame');
    // if anything goes wrong in parsing the JSON (with getJSONData, above), it
    // returns a string. so we check the type of data to see if it's a string.
    // if it is, there was a parsing error, so print an error
    if (typeof data == 'string'){
      if (window.console && console.error){
        console.error('Error parsing frame data for', element);
      }
    } else {
      this.activeState = data.activeState || {};
      this.exitState = data.exitState || {};
    }
  },

  addState: function(state){
    if (state == 'activeState') this.active = true;
    if (state == 'exitState') this.exited = true;
    this.changeState(state);
  },

  removeState: function(state){
    if (state == 'activeState') this.active = false;
    if (state == 'exitState') this.exited = false;
    this.changeState(state, 'removeClass');
  },

  changeState: function(state, changeType){
    if (this.activeState && this.exitState){
      changeType = changeType || 'addClass';
      Object.keys(this[state]).each(function(selector){
        var el = $$(selector);
        this[state][selector].classes.each(function(klass){
          el[changeType](klass);
        });
      }, this);
    }
  },


});

/*
---

name: Behavior.FrameFlow

description: Provides a simplified Finite State Machine for managing UI flows in which
  transitions and states are encapsulated into Frame instances

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - FrameFlow

provides: [Behavior.FrameFlow]

...
*/

Behavior.addGlobalFilter('FrameFlow', {
  defaults: {
    startIndex: 0
  },

  returns: FrameFlow,

  setup: function(element, api){
    var frameFlow = new FrameFlow(element, Object.cleanValues(
      api.getAs({
        startIndex: Number
      })
    ));

    api.onCleanup(frameFlow.detach.bind(frameFlow));

    return frameFlow;
  }
});
/*
---

name: Delegator.FrameFlowControl

description: Delegator for controlling a FrameFlow Behavior

requires:
 - Behavior/Delegator
 - FrameFlow

provides: [Delegator.FrameFlowControl]

...
*/

Delegator.register('click', {

  frameflowControl: {

    requireAs: {
      target: String,
      frame: String
    },

    defaults: {
      target: '!body .frameflow-container'
    },

    handler: function(event, element, api){

      var target = api.getElement('target');
      var frame = api.get('frame');
      if (!target.hasBehavior("FrameFlow")) api.fail(
        'Target does not have a FrameFlow Behavior.'
      );

      var ffInstance = target.getBehaviorResult("FrameFlow");
      ffInstance.transition(ffInstance.getFrameIndexBySelector(frame));
    }
  }
});

/*
---

name: Fx.Progress

description: Tweens a progress bar width at the same time as updating a progress percentage.

license: MIT-style license.

requires:
 - Core/Fx.Tween

provides: [Fx.Progress]

...
*/

Fx.Progress = new Class({
  Extends: Fx.Tween,
  options: {
    unit: '%'
  },
  initialize: function(element, progressNum, options){
    this.progressNum = document.id(progressNum);
    this.parent(element, options);
  },
  render: function(element, property, value, unit){
    this.progressNum.set('html', value[0].value.toInt()+'%');
    this.parent(element, property, value, unit);
  }
});
/*
---

name: GoogleMap.js

description: An abstraction of the Google Maps API.

requires:
 - Core/Fx.Tween

provides: [GoogleMap, GoogleMap.Box, GoogleMap.Annotated]

...
*/

(function(){
  if (!window.google){
    try {
      console.log("not running google map class code as google maps is not included.");
    } catch(e){}
    return;
  }

  window.GoogleMap = new Class({

    Implements: [Options, Events],

    options: {
      getMapType: function(){
        return google.maps.MapTypeId.ROADMAP;
      },
      pinIcon: null,
      shadowImage: null,
      lat: 37.759465,
      lng: -122.427864,
      locationIcon: null,
      locationAnchorX: null,
      locationAnchorY: null,
      showUserPosition: true,
      pinTTL: 0, //zero lives forever
      size: null,
      useZ: true,
      maxBounds: 10,
      timeout: 4000,
      zoom: 20,
      zoomToFit: true,
      showZoomControl: true,
      // {
      //   width: '100%',
      //   height: 400
      // },
      showMapControls: true,
      animation: google.maps.Animation.DROP,
      mapStyles: {}
    },

    initialize: function(container, options){
      this.setOptions(options);
      this.container = document.id(container);
      if (this.options.size) this.container.setStyles(this.options.size);
      this.buildMap();
      if (this.options.showUserPosition) this.centerOnUser();
      else this.center();
    },

    makeBounds: function(){
      this.bounds = new google.maps.LatLngBounds();
    },

    checkBounds: function(){
      if (this.points.length > this.options.maxBounds && this.points.length%this.options.maxBounds){
        this.makeBounds();
        for (var i = this.points.length - this.options.maxBounds; i < this.points.length; i++){
          this.bounds.extend(this.points[i]);
        }
      }
    },

    buildMap: function(){
      this.makeBounds();
      if (this.options.showMapControls){
        this.map = new google.maps.Map(this.container, {
          zoom: this.options.zoom,
          mapTypeId: this.options.getMapType(),
          styles: this.options.mapStyles,
          panControl: this.options.panControl,
          showMapControls: this.options.showMapControls
        });
      }
      else {
        this.map = new google.maps.Map(this.container, {
          zoom: this.options.zoom,
          mapTypeId: this.options.getMapType(),
          mapTypeControl: false,
          draggable: true,
          scaleControl: false,
          scrollwheel: false,
          navigationControl: false,
          streetViewControl: false,
          showMapControls: this.options.showMapControls,
          panControl: this.options.panControl,
          zoomControl:this.options.showZoomControl,
          zoomControlOptions: {
            style:google.maps.ZoomControlStyle.SMALL
          },
          styles: this.options.mapStyles
        });
      };
      return this;
    },

    lastCenter: null,

    setZoom: function(zoom){
      this.map.setZoom(zoom);
      return this;
    },

    getZoom: function(){
      return this.map.getZoom();
    },

    center: function(lat, lng){
      var zoom = this.getZoom() || this.options.zoom;
      this.map.setCenter(new google.maps.LatLng(lat || this.options.lat, lng || this.options.lng));
      this.setZoom(zoom);
      this.lastCenter = this.center.bind(this, arguments);
      return this;
    },

    centerOnBounds: function(){
      this.map.panTo(this.bounds.getCenter());
    },

    zoomToBounds: function(){
      this.map.fitBounds(this.bounds);
      this.map.setCenter(this.bounds.getCenter());
    },

    resize: function(){
      google.maps.event.trigger(this.map, "resize");
      if (this.lastCenter) this.lastCenter();
    },

    markCenter: function(lat, lng){
      if (!this.userPosition){
        this.userPosition = this.dropPin({
          lat: lat || this.options.lat,
          lng: lng || this.options.lng,
          icon: this.options.locationIcon,
          anchorX: this.options.locationAnchorX,
          anchorY: this.options.locationAnchorY,
          saveMarker: false
        });
      } else {
        this.userPosition.setPosition(
          new google.maps.LatLng(lat || this.options.lat, lng || this.options.lng)
        );
      }
      return this;
    },

    centerOnUser: function(callback){
      callback = callback || function(){};
      var zoom = this.getZoom() || this.options.zoom;
      // Try HTML5 geolocation
      if (navigator.geolocation){
        this.fireEvent('getLocation');
        navigator.geolocation.getCurrentPosition(
          // success handler
          function(position){
            this.fireEvent('receiveLocation', position);
            this.markCenter(position.coords.latitude, position.coords.longitude);
            this.center(position.coords.latitude, position.coords.longitude);
            Cookie.write('location', JSON.encode(position.coords));
            this.setZoom(zoom);
            callback();
          }.bind(this),
          // error handler
          function(){
            this.fireEvent('receiveLocation');
            if (Cookie.read('location')){
              var cookie = JSON.decode(Cookie.read('location'));
              this.center(cookie.lat, cookie.latitude);
              this.markCenter(cookie.lat, cookie.longitude);
            } else {
              this.defaultCenter();
            }
            this.setZoom(zoom);
            callback();
          }.bind(this),
          {timeout:this.options.timeout}
        );
      }
      else {
        this.fireEvent('receiveLocation');
        this.center(this.options.lat, this.options.lng);
        this.markCenter(this.options.lat, this.options.lng);
        this.setZoom(zoom);
        callback();
      }
      return this;
    },
    defaultCenter: function(lat, lng){
      lat = lat || this.options.lat;
      lng = lng || this.options.lng;
      this.center(lat, lng);
      this.markCenter(lat, lng);
    },
    _pinZIndex: 1,
    points: [],
    markers: [],
    dropPin: function(options){
      options = options || {};
      if (!options.lat || !options.lng || options.lat == "0.0" || options.lng == "0.0") return {};
      /*
        options = {
          icon: urlToIcon, //defaults to the icon named in the options
          zindex: integer,
          lat: integer,
          lng: integer,
          zIndex: integer,
          title: string,
          TTL: integer // (zero lives for ever),
          saveMarker: boolean
        }
      */
      if (typeof(options.saveMarker)==='undefined') options.saveMarker = true;
      var point = new google.maps.LatLng(options.lat, options.lng);
      this.points.push(point);
      this.checkBounds();
      this.bounds.extend(point);
      this.zoomToBounds();
      var anchor = null;
      if (options.anchorX && options.anchorY) anchor = new google.maps.Point(options.anchorX, options.anchorY);

      var shadowIcon = null;
      var shadowImage = options.shadowImage || this.options.shadowImage
      if (shadowImage){

        var shadowAnchor = null;
        if (options.shadowAnchorX && options.shadowAnchorY){
          shadowAnchor = new google.maps.Point(options.shadowAnchorX, options.shadowAnchorY);
        };
        shadowIcon = new google.maps.MarkerImage(
          shadowImage,
          null,
          null,
          shadowAnchor
        );
      };

      var markerIcon = new google.maps.MarkerImage(
          options.icon || this.options.pinIcon,
          null,
          null,
          anchor
      );

      // icon overrides the markerImage because of the merge below.
      // leaving the name the same for backwards compatibility
      delete options['icon'];

      var localZ = this.options.useZ ? this._pinZIndex : null;
      var marker = new google.maps.Marker(
        Object.merge({
          position: point,
          map: this.map,
          icon: markerIcon,
          zIndex: localZ,
          shadow: shadowIcon,
          animation: this.options.animation
        }, options)
      );

      if (options.saveMarker) this.markers.push(marker);
      this._pinZIndex++;
      if (this.options.pinTTL || options.TTL) marker.setVisible.delay(this.options.pinTTL || options.TTL, marker, false);
      return marker;
    }

  });

  GoogleMap.Box = new Class({

    //see https://developers.google.com/maps/documentation/javascript/overlays
    Extends: google.maps.OverlayView,

    Implements: [Options, Events],

    options: {
      position: { lat: 0, lat: 0},
      size: {width: 100, height: 40},
      offset: {x: 0, y: 0},
      content: '',
      fxOptions: {
        transition: 'bounce:out',
        duration: 800
      },
      TTL: 0 //zero lives forever
    },

    initialize: function (map, options){
      this.setOptions(options);
      this.map = map;
      this.setMap(map);
      this.overlay = new google.maps.OverlayView(this.map).getProjection();
    },

    onAdd: function(){
      // Create the DIV and set some basic attributes.
      this.div = new Element('div', {
        class: 'mapBox',
        styles: {
          position: 'absolute',
          visibility: 'hidden'
        }
      }).set('tween', this.options.fxOptions);
      if (typeOf(this.options.content) == "string") this.div.set('html', this.options.content);
      else this.div.empty().adopt(this.options.content);
      var panes = this.getPanes();
      panes.overlayLayer.adopt(this.div);
      this.show();
      if (this.options.TTL) this.hide.delay(this.options.TTL, this);
    },

    draw: function(){
      // Size and position the overlay. We use a southwest and northeast
      // position of the overlay to peg it to the correct position and size.
      // We need to retrieve the projection from this overlay to do this.
      var overlayProjection = this.getProjection();

      // Retrieve the southwest and northeast coordinates of this overlay
      // in latlngs and convert them to pixels coordinates.
      // We'll use these coordinates to resize the DIV.
      var nw = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.options.position.lat, this.options.position.lng));

      // Resize the image's DIV to fit the indicated dimensions.
      this.div.setStyles({
        left: nw.x + this.options.offset.x,
        top: nw.y + this.options.offset.y,
        width: this.options.size.width,
        height: this.options.size.height
      });
    },

    remove: function(){
      this.div.dispose();
    },

    hide: function(){
      this.div.setStyle('visibility', 'hidden');
    },

    show: function(){
      this.div.setStyle('marginTop', -800).setStyles({
        visibility: 'visible'
      }).tween('marginTop', -800, 0);
    },

    toggle: function(){
      this.div.setStyle('display', this.div.getStyle('display') == 'none' ? 'block' : 'none');
    }

  });

  GoogleMap.Annotated = new Class({

    Extends: GoogleMap,

    boxes: [],

    dropPin: function(options){
      var elements = {};
      if (!options.lat || !options.lng || options.lat == "0.0" || options.lng == "0.0") return elements;

      if (options.content){

        var point = new google.maps.LatLng(options.lat, options.lng);
        this.points.push(point);
        this.checkBounds();
        this.bounds.extend(point);
        if (this.options.zoomToFit){
          this.map.fitBounds(this.bounds);
          this.map.panTo(this.bounds.getCenter());
        }

        elements.box = new GoogleMap.Box(this.map, {
          position: {
            lat: options.lat,
            lng: options.lng
          },
          size: {
            width: options.width || 20,
            height: options.height || 20
          },
          offset: options.offset || {x: 0, y: 0},
          content: options.content,
          TTL: options.TTL || this.options.pinTTL
        });
        this.boxes.push(elements.box);
      }
      if (!options.noPin){
        elements.marker = this.parent(options);
      }
      return elements;
    }

  });

})();

/*
---

script: HtmlTable.js

name: HtmlTable

description: Builds table elements with methods to add rows.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Class.Occlude

provides: [HtmlTable]

...
*/

var HtmlTable = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		properties: {
			cellpadding: 0,
			cellspacing: 0,
			border: 0
		},
		rows: [],
		headers: [],
		footers: []
	},

	property: 'HtmlTable',

	initialize: function(){
		var params = Array.link(arguments, {options: Type.isObject, table: Type.isElement, id: Type.isString});
		this.setOptions(params.options);
		if (!params.table && params.id) params.table = document.id(params.id);
		this.element = params.table || new Element('table', this.options.properties);
		if (this.occlude()) return this.occluded;
		this.build();
	},

	build: function(){
		this.element.store('HtmlTable', this);

		this.body = document.id(this.element.tBodies[0]) || new Element('tbody').inject(this.element);
		$$(this.body.rows);

		if (this.options.headers.length) this.setHeaders(this.options.headers);
		else this.thead = document.id(this.element.tHead);

		if (this.thead) this.head = this.getHead();
		if (this.options.footers.length) this.setFooters(this.options.footers);

		this.tfoot = document.id(this.element.tFoot);
		if (this.tfoot) this.foot = document.id(this.tfoot.rows[0]);

		this.options.rows.each(function(row){
			this.push(row);
		}, this);
	},

	toElement: function(){
		return this.element;
	},

	empty: function(){
		this.body.empty();
		return this;
	},

	set: function(what, items){
		var target = (what == 'headers') ? 'tHead' : 'tFoot',
			lower = target.toLowerCase();

		this[lower] = (document.id(this.element[target]) || new Element(lower).inject(this.element, 'top')).empty();
		var data = this.push(items, {}, this[lower], what == 'headers' ? 'th' : 'td');

		if (what == 'headers') this.head = this.getHead();
		else this.foot = this.getHead();

		return data;
	},

	getHead: function(){
		var rows = this.thead.rows;
		return rows.length > 1 ? $$(rows) : rows.length ? document.id(rows[0]) : false;
	},

	setHeaders: function(headers){
		this.set('headers', headers);
		return this;
	},

	setFooters: function(footers){
		this.set('footers', footers);
		return this;
	},

	update: function(tr, row, tag){
		var tds = tr.getChildren(tag || 'td'), last = tds.length - 1;

		row.each(function(data, index){
			var td = tds[index] || new Element(tag || 'td').inject(tr),
				content = ((data && Object.prototype.hasOwnProperty.call(data, 'content')) ? data.content : '') || data,
				type = typeOf(content);

			if (data && Object.prototype.hasOwnProperty.call(data, 'properties')) td.set(data.properties);
			if (/(element(s?)|array|collection)/.test(type)) td.empty().adopt(content);
			else td.set('html', content);

			if (index > last) tds.push(td);
			else tds[index] = td;
		});

		return {
			tr: tr,
			tds: tds
		};
	},

	push: function(row, rowProperties, target, tag, where){
		if (typeOf(row) == 'element' && row.get('tag') == 'tr'){
			row.inject(target || this.body, where);
			return {
				tr: row,
				tds: row.getChildren('td')
			};
		}
		return this.update(new Element('tr', rowProperties).inject(target || this.body, where), row, tag);
	},

	pushMany: function(rows, rowProperties, target, tag, where){
		return rows.map(function(row){
			return this.push(row, rowProperties, target, tag, where);
		}, this);
	}

});


['adopt', 'inject', 'wraps', 'grab', 'replaces', 'dispose'].each(function(method){
	HtmlTable.implement(method, function(){
		this.element[method].apply(this.element, arguments);
		return this;
	});
});



/*
---

script: HtmlTable.Sort.js

name: HtmlTable.Sort

description: Builds a stripy, sortable table with methods to add rows.

license: MIT-style license

authors:
  - Harald Kirschner
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/Hash
  - HtmlTable
  - Class.refactor
  - Element.Delegation.Pseudo
  - String.Extras
  - Date

provides: [HtmlTable.Sort]

...
*/
(function(){

var readOnlyNess = document.createElement('table');
try {
	readOnlyNess.innerHTML = '<tr><td></td></tr>';
	readOnlyNess = readOnlyNess.childNodes.length === 0;
} catch (e){
	readOnlyNess = true;
}

HtmlTable = Class.refactor(HtmlTable, {

	options: {/*
		onSort: function(){}, */
		sortIndex: 0,
		sortReverse: false,
		parsers: [],
		defaultParser: 'string',
		classSortable: 'table-sortable',
		classHeadSort: 'table-th-sort',
		classHeadSortRev: 'table-th-sort-rev',
		classNoSort: 'table-th-nosort',
		classGroupHead: 'table-tr-group-head',
		classGroup: 'table-tr-group',
		classCellSort: 'table-td-sort',
		classSortSpan: 'table-th-sort-span',
		sortable: false,
		thSelector: 'th'
	},

	initialize: function (){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		this.sorted = {index: null, dir: 1};
		if (!this.bound) this.bound = {};
		this.bound.headClick = this.headClick.bind(this);
		this.sortSpans = new Elements();
		if (this.options.sortable){
			this.enableSort();
			if (this.options.sortIndex != null) this.sort(this.options.sortIndex, this.options.sortReverse);
		}
	},

	attachSorts: function(attach){
		this.detachSorts();
		if (attach !== false) this.element.addEvent('click:relay(' + this.options.thSelector + ')', this.bound.headClick);
	},

	detachSorts: function(){
		this.element.removeEvents('click:relay(' + this.options.thSelector + ')');
	},

	setHeaders: function(){
		this.previous.apply(this, arguments);
		if (this.sortable) this.setParsers();
	},

	setParsers: function(){
		this.parsers = this.detectParsers();
	},

	detectParsers: function(){
		return this.head && this.head.getElements(this.options.thSelector).flatten().map(this.detectParser, this);
	},

	detectParser: function(cell, index){
		if (cell.hasClass(this.options.classNoSort) || cell.retrieve('htmltable-parser')) return cell.retrieve('htmltable-parser');
		var thDiv = new Element('div');
		thDiv.adopt(cell.childNodes).inject(cell);
		var sortSpan = new Element('span', {'class': this.options.classSortSpan}).inject(thDiv, 'top');
		this.sortSpans.push(sortSpan);
		var parser = this.options.parsers[index],
			rows = this.body.rows,
			cancel;
		switch (typeOf(parser)){
			case 'function': parser = {convert: parser}; cancel = true; break;
			case 'string': parser = parser; cancel = true; break;
		}
		if (!cancel){
			HtmlTable.ParserPriority.some(function(parserName){
				var current = HtmlTable.Parsers[parserName],
					match = current.match;
				if (!match) return false;
				for (var i = 0, j = rows.length; i < j; i++){
					var cell = document.id(rows[i].cells[index]),
						text = cell ? cell.get('html').clean() : '';
					if (text && match.test(text)){
						parser = current;
						return true;
					}
				}
			});
		}
		if (!parser) parser = this.options.defaultParser;
		cell.store('htmltable-parser', parser);
		return parser;
	},

	headClick: function(event, el){
		if (!this.head || el.hasClass(this.options.classNoSort)) return;
		return this.sort(Array.indexOf(this.head.getElements(this.options.thSelector).flatten(), el) % this.body.rows[0].cells.length);
	},

	serialize: function(){
		var previousSerialization = this.previous.apply(this, arguments) || {};
		if (this.options.sortable){
			previousSerialization.sortIndex = this.sorted.index;
			previousSerialization.sortReverse = this.sorted.reverse;
		}
		return previousSerialization;
	},

	restore: function(tableState){
		if(this.options.sortable && tableState.sortIndex){
			this.sort(tableState.sortIndex, tableState.sortReverse);
		}
		this.previous.apply(this, arguments);
	},

	setSortedState: function(index, reverse){
		if (reverse != null) this.sorted.reverse = reverse;
		else if (this.sorted.index == index) this.sorted.reverse = !this.sorted.reverse;
		else this.sorted.reverse = this.sorted.index == null;

		if (index != null) this.sorted.index = index;
	},

	setHeadSort: function(sorted){
		var head = $$(!this.head.length ? this.head.cells[this.sorted.index] : this.head.map(function(row){
			return row.getElements(this.options.thSelector)[this.sorted.index];
		}, this).clean());
		if (!head.length) return;
		if (sorted){
			head.addClass(this.options.classHeadSort);
			if (this.sorted.reverse) head.addClass(this.options.classHeadSortRev);
			else head.removeClass(this.options.classHeadSortRev);
		} else {
			head.removeClass(this.options.classHeadSort).removeClass(this.options.classHeadSortRev);
		}
	},

	setRowSort: function(data, pre){
		var count = data.length,
			body = this.body,
			group,
			rowIndex;

		while (count){
			var item = data[--count],
				position = item.position,
				row = body.rows[position];

			if (row.disabled) continue;
			if (!pre){
				group = this.setGroupSort(group, row, item);
				this.setRowStyle(row, count);
			}
			body.appendChild(row);

			for (rowIndex = 0; rowIndex < count; rowIndex++){
				if (data[rowIndex].position > position) data[rowIndex].position--;
			}
		}
	},

	setRowStyle: function(row, i){
		this.previous(row, i);
		row.cells[this.sorted.index].addClass(this.options.classCellSort);
	},

	setGroupSort: function(group, row, item){
		if (group == item.value) row.removeClass(this.options.classGroupHead).addClass(this.options.classGroup);
		else row.removeClass(this.options.classGroup).addClass(this.options.classGroupHead);
		return item.value;
	},

	getParser: function(){
		var parser = this.parsers[this.sorted.index];
		return typeOf(parser) == 'string' ? HtmlTable.Parsers[parser] : parser;
	},

	sort: function(index, reverse, pre, sortFunction){
		if (!this.head) return;

		if (!pre){
			this.clearSort();
			this.setSortedState(index, reverse);
			this.setHeadSort(true);
		}

		var parser = this.getParser();
		if (!parser) return;

		var rel;
		if (!readOnlyNess){
			rel = this.body.getParent();
			this.body.dispose();
		}

		var data = this.parseData(parser).sort(sortFunction ? sortFunction : function(a, b){
			if (a.value === b.value) return 0;
			return a.value > b.value ? 1 : -1;
		});

		if (this.sorted.reverse == (parser == HtmlTable.Parsers['input-checked'])) data.reverse(true);
		this.setRowSort(data, pre);

		if (rel) rel.grab(this.body);
		this.fireEvent('stateChanged');
		return this.fireEvent('sort', [this.body, this.sorted.index]);
	},

	parseData: function(parser){
		return Array.map(this.body.rows, function(row, i){
			var value = parser.convert.call(document.id(row.cells[this.sorted.index]));
			return {
				position: i,
				value: value
			};
		}, this);
	},

	clearSort: function(){
		this.setHeadSort(false);
		this.body.getElements('td').removeClass(this.options.classCellSort);
	},

	reSort: function(){
		if (this.sortable) this.sort.call(this, this.sorted.index, this.sorted.reverse);
		return this;
	},

	enableSort: function(){
		this.element.addClass(this.options.classSortable);
		this.attachSorts(true);
		this.setParsers();
		this.sortable = true;
		return this;
	},

	disableSort: function(){
		this.element.removeClass(this.options.classSortable);
		this.attachSorts(false);
		this.sortSpans.each(function(span){
			span.destroy();
		});
		this.sortSpans.empty();
		this.sortable = false;
		return this;
	}

});

HtmlTable.ParserPriority = ['date', 'input-checked', 'input-value', 'float', 'number'];

HtmlTable.Parsers = {

	'date': {
		match: /^\d{2}[-\/ ]\d{2}[-\/ ]\d{2,4}$/,
		convert: function(){
			var d = Date.parse(this.get('text').stripTags());
			return (typeOf(d) == 'date') ? d.format('db') : '';
		},
		type: 'date'
	},
	'input-checked': {
		match: / type="(radio|checkbox)"/,
		convert: function(){
			return this.getElement('input').checked;
		}
	},
	'input-value': {
		match: /<input/,
		convert: function(){
			return this.getElement('input').value;
		}
	},
	'number': {
		match: /^\d+[^\d.,]*$/,
		convert: function(){
			return this.get('text').stripTags().toInt();
		},
		number: true
	},
	'numberLax': {
		match: /^[^\d]+\d+$/,
		convert: function(){
			return this.get('text').replace(/[^-?^0-9]/, '').stripTags().toInt();
		},
		number: true
	},
	'float': {
		match: /^[\d]+\.[\d]+/,
		convert: function(){
			return this.get('text').replace(/[^-?^\d.e]/, '').stripTags().toFloat();
		},
		number: true
	},
	'floatLax': {
		match: /^[^\d]+[\d]+\.[\d]+$/,
		convert: function(){
			return this.get('text').replace(/[^-?^\d.]/, '').stripTags().toFloat();
		},
		number: true
	},
	'string': {
		match: null,
		convert: function(){
			return this.get('text').stripTags().toLowerCase();
		}
	},
	'title': {
		match: null,
		convert: function(){
			return this.title;
		}
	}

};

//<1.2compat>
HtmlTable.Parsers = new Hash(HtmlTable.Parsers);
//</1.2compat>

HtmlTable.defineParsers = function(parsers){
	HtmlTable.Parsers = Object.append(HtmlTable.Parsers, parsers);
	for (var parser in parsers){
		HtmlTable.ParserPriority.unshift(parser);
	}
};

})();


/*
---

script: HtmlTable.Zebra.js

name: HtmlTable.Zebra

description: Builds a stripy table with methods to add rows.

license: MIT-style license

authors:
  - Harald Kirschner
  - Aaron Newton

requires:
  - HtmlTable
  - Element.Shortcuts
  - Class.refactor

provides: [HtmlTable.Zebra]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		classZebra: 'table-tr-odd',
		zebra: true,
		zebraOnlyVisibleRows: true
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		if (this.options.zebra) this.updateZebras();
	},

	updateZebras: function(){
		var index = 0;
		Array.each(this.body.rows, function(row){
			if (!this.options.zebraOnlyVisibleRows || row.isDisplayed()){
				this.zebra(row, index++);
			}
		}, this);
	},

	setRowStyle: function(row, i){
		if (this.previous) this.previous(row, i);
		this.zebra(row, i);
	},

	zebra: function(row, i){
		return row[((i % 2) ? 'remove' : 'add')+'Class'](this.options.classZebra);
	},

	push: function(){
		var pushed = this.previous.apply(this, arguments);
		if (this.options.zebra) this.updateZebras();
		return pushed;
	}

});

/*
---

name: Element.Event.Pseudos.Keys

description: Adds functionality fire events if certain keycombinations are pressed

license: MIT-style license

authors:
  - Arian Stolwijk

requires: [Element.Event.Pseudos]

provides: [Element.Event.Pseudos.Keys]

...
*/

(function(){

var keysStoreKey = '$moo:keys-pressed',
	keysKeyupStoreKey = '$moo:keys-keyup';


DOMEvent.definePseudo('keys', function(split, fn, args){

	var event = args[0],
		keys = [],
		pressed = this.retrieve(keysStoreKey, []),
		value = split.value;

	if (value != '+') keys.append(value.replace('++', function(){
		keys.push('+'); // shift++ and shift+++a
		return '';
	}).split('+'));
	else keys = ['+'];

	pressed.include(event.key);

	if (keys.every(function(key){
		return pressed.contains(key);
	})) fn.apply(this, args);

	this.store(keysStoreKey, pressed);

	if (!this.retrieve(keysKeyupStoreKey)){
		var keyup = function(event){
			(function(){
				pressed = this.retrieve(keysStoreKey, []).erase(event.key);
				this.store(keysStoreKey, pressed);
			}).delay(0, this); // Fix for IE
		};
		this.store(keysKeyupStoreKey, keyup).addEvent('keyup', keyup);
	}

});

DOMEvent.defineKeys({
	'16': 'shift',
	'17': 'control',
	'18': 'alt',
	'20': 'capslock',
	'33': 'pageup',
	'34': 'pagedown',
	'35': 'end',
	'36': 'home',
	'144': 'numlock',
	'145': 'scrolllock',
	'186': ';',
	'187': '=',
	'188': ',',
	'190': '.',
	'191': '/',
	'192': '`',
	'219': '[',
	'220': '\\',
	'221': ']',
	'222': "'",
	'107': '+',
	'109': '-', // subtract
	'189': '-'  // dash
})

})();

/*
---

script: Keyboard.js

name: Keyboard

description: KeyboardEvents used to intercept events on a class for keyboard and format modifiers in a specific order so as to make alt+shift+c the same as shift+alt+c.

license: MIT-style license

authors:
  - Perrin Westrich
  - Aaron Newton
  - Scott Kyle

requires:
  - Core/Events
  - Core/Options
  - Core/Element.Event
  - Element.Event.Pseudos.Keys

provides: [Keyboard]

...
*/

(function(){

	var Keyboard = this.Keyboard = new Class({

		Extends: Events,

		Implements: [Options],

		options: {/*
			onActivate: function(){},
			onDeactivate: function(){},*/
			defaultEventType: 'keydown',
			active: false,
			manager: null,
			events: {},
			nonParsedEvents: ['activate', 'deactivate', 'onactivate', 'ondeactivate', 'changed', 'onchanged']
		},

		initialize: function(options){
			if (options && options.manager){
				this._manager = options.manager;
				delete options.manager;
			}
			this.setOptions(options);
			this._setup();
		},

		addEvent: function(type, fn, internal){
			return this.parent(Keyboard.parse(type, this.options.defaultEventType, this.options.nonParsedEvents), fn, internal);
		},

		removeEvent: function(type, fn){
			return this.parent(Keyboard.parse(type, this.options.defaultEventType, this.options.nonParsedEvents), fn);
		},

		toggleActive: function(){
			return this[this.isActive() ? 'deactivate' : 'activate']();
		},

		activate: function(instance){
			if (instance){
				if (instance.isActive()) return this;
				//if we're stealing focus, store the last keyboard to have it so the relinquish command works
				if (this._activeKB && instance != this._activeKB){
					this.previous = this._activeKB;
					this.previous.fireEvent('deactivate');
				}
				//if we're enabling a child, assign it so that events are now passed to it
				this._activeKB = instance.fireEvent('activate');
				Keyboard.manager.fireEvent('changed');
			} else if (this._manager){
				//else we're enabling ourselves, we must ask our parent to do it for us
				this._manager.activate(this);
			}
			return this;
		},

		isActive: function(){
			return this._manager ? (this._manager._activeKB == this) : (Keyboard.manager == this);
		},

		deactivate: function(instance){
			if (instance){
				if (instance === this._activeKB){
					this._activeKB = null;
					instance.fireEvent('deactivate');
					Keyboard.manager.fireEvent('changed');
				}
			} else if (this._manager){
				this._manager.deactivate(this);
			}
			return this;
		},

		relinquish: function(){
			if (this.isActive() && this._manager && this._manager.previous) this._manager.activate(this._manager.previous);
			else this.deactivate();
			return this;
		},

		//management logic
		manage: function(instance){
			if (instance._manager) instance._manager.drop(instance);
			this._instances.push(instance);
			instance._manager = this;
			if (!this._activeKB) this.activate(instance);
			return this;
		},

		drop: function(instance){
			instance.relinquish();
			this._instances.erase(instance);
			if (this._activeKB == instance){
				if (this.previous && this._instances.contains(this.previous)) this.activate(this.previous);
				else this._activeKB = this._instances[0];
			}
			return this;
		},

		trace: function(){
			Keyboard.trace(this);
		},

		each: function(fn){
			Keyboard.each(this, fn);
		},

		/*
			PRIVATE METHODS
		*/

		_instances: [],

		_disable: function(instance){
			if (this._activeKB == instance) this._activeKB = null;
		},

		_setup: function(){
			this.addEvents(this.options.events);
			//if this is the root manager, nothing manages it
			if (Keyboard.manager && !this._manager) Keyboard.manager.manage(this);
			if (this.options.active) this.activate();
			else this.relinquish();
		},

		_handle: function(event, type){
			//Keyboard.stop(event) prevents key propagation
			if (event.preventKeyboardPropagation) return;

			var bubbles = !!this._manager;
			if (bubbles && this._activeKB){
				this._activeKB._handle(event, type);
				if (event.preventKeyboardPropagation) return;
			}
			this.fireEvent(type, event);

			if (!bubbles && this._activeKB) this._activeKB._handle(event, type);
		}

	});

	var parsed = {};
	var modifiers = ['shift', 'control', 'alt', 'meta'];
	var regex = /^(?:shift|control|ctrl|alt|meta)$/;

	Keyboard.parse = function(type, eventType, ignore){
		if (ignore && ignore.contains(type.toLowerCase())) return type;

		type = type.toLowerCase().replace(/^(keyup|keydown):/, function($0, $1){
			eventType = $1;
			return '';
		});

		if (!parsed[type]){
		    if (type != '+'){
				var key, mods = {};
				type.split('+').each(function(part){
					if (regex.test(part)) mods[part] = true;
					else key = part;
				});

				mods.control = mods.control || mods.ctrl; // allow both control and ctrl

				var keys = [];
				modifiers.each(function(mod){
					if (mods[mod]) keys.push(mod);
				});

				if (key) keys.push(key);
				parsed[type] = keys.join('+');
			} else {
			    parsed[type] = type;
			}
		}

		return eventType + ':keys(' + parsed[type] + ')';
	};

	Keyboard.each = function(keyboard, fn){
		var current = keyboard || Keyboard.manager;
		while (current){
			fn(current);
			current = current._activeKB;
		}
	};

	Keyboard.stop = function(event){
		event.preventKeyboardPropagation = true;
	};

	Keyboard.manager = new Keyboard({
		active: true
	});

	Keyboard.trace = function(keyboard){
		keyboard = keyboard || Keyboard.manager;
		var hasConsole = window.console && console.log;
		if (hasConsole) console.log('the following items have focus: ');
		Keyboard.each(keyboard, function(current){
			if (hasConsole) console.log(document.id(current.widget) || current.wiget || current);
		});
	};

	var handler = function(event){
		var keys = [];
		modifiers.each(function(mod){
			if (event[mod]) keys.push(mod);
		});

		if (!regex.test(event.key)) keys.push(event.key);
		Keyboard.manager._handle(event, event.type + ':keys(' + keys.join('+') + ')');
	};

	document.addEvents({
		'keyup': handler,
		'keydown': handler
	});

})();

/*
---

script: Keyboard.Extras.js

name: Keyboard.Extras

description: Enhances Keyboard by adding the ability to name and describe keyboard shortcuts, and the ability to grab shortcuts by name and bind the shortcut to different keys.

license: MIT-style license

authors:
  - Perrin Westrich

requires:
  - Keyboard
  - MooTools.More

provides: [Keyboard.Extras]

...
*/
Keyboard.prototype.options.nonParsedEvents.combine(['rebound', 'onrebound']);

Keyboard.implement({

	/*
		shortcut should be in the format of:
		{
			'keys': 'shift+s', // the default to add as an event.
			'description': 'blah blah blah', // a brief description of the functionality.
			'handler': function(){} // the event handler to run when keys are pressed.
		}
	*/
	addShortcut: function(name, shortcut){
		this._shortcuts = this._shortcuts || [];
		this._shortcutIndex = this._shortcutIndex || {};

		shortcut.getKeyboard = Function.from(this);
		shortcut.name = name;
		this._shortcutIndex[name] = shortcut;
		this._shortcuts.push(shortcut);
		if (shortcut.keys) this.addEvent(shortcut.keys, shortcut.handler);
		return this;
	},

	addShortcuts: function(obj){
		for (var name in obj) this.addShortcut(name, obj[name]);
		return this;
	},

	removeShortcut: function(name){
		var shortcut = this.getShortcut(name);
		if (shortcut && shortcut.keys){
			this.removeEvent(shortcut.keys, shortcut.handler);
			delete this._shortcutIndex[name];
			this._shortcuts.erase(shortcut);
		}
		return this;
	},

	removeShortcuts: function(names){
		names.each(this.removeShortcut, this);
		return this;
	},

	getShortcuts: function(){
		return this._shortcuts || [];
	},

	getShortcut: function(name){
		return (this._shortcutIndex || {})[name];
	}

});

Keyboard.rebind = function(newKeys, shortcuts){
	Array.from(shortcuts).each(function(shortcut){
		shortcut.getKeyboard().removeEvent(shortcut.keys, shortcut.handler);
		shortcut.getKeyboard().addEvent(newKeys, shortcut.handler);
		shortcut.keys = newKeys;
		shortcut.getKeyboard().fireEvent('rebound');
	});
};


Keyboard.getActiveShortcuts = function(keyboard){
	var activeKBS = [], activeSCS = [];
	Keyboard.each(keyboard, [].push.bind(activeKBS));
	activeKBS.each(function(kb){ activeSCS.extend(kb.getShortcuts()); });
	return activeSCS;
};

Keyboard.getShortcut = function(name, keyboard, opts){
	opts = opts || {};
	var shortcuts = opts.many ? [] : null,
		set = opts.many ? function(kb){
				var shortcut = kb.getShortcut(name);
				if (shortcut) shortcuts.push(shortcut);
			} : function(kb){
				if (!shortcuts) shortcuts = kb.getShortcut(name);
			};
	Keyboard.each(keyboard, set);
	return shortcuts;
};

Keyboard.getShortcuts = function(name, keyboard){
	return Keyboard.getShortcut(name, keyboard, { many: true });
};

/*
---

script: HtmlTable.Select.js

name: HtmlTable.Select

description: Builds a stripy, sortable table with methods to add rows. Rows can be selected with the mouse or keyboard navigation.

license: MIT-style license

authors:
  - Harald Kirschner
  - Aaron Newton

requires:
  - Keyboard
  - Keyboard.Extras
  - HtmlTable
  - Class.refactor
  - Element.Delegation.Pseudo
  - Element.Shortcuts

provides: [HtmlTable.Select]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		/*onRowFocus: function(){},
		onRowUnfocus: function(){},*/
		useKeyboard: true,
		classRowSelected: 'table-tr-selected',
		classRowHovered: 'table-tr-hovered',
		classSelectable: 'table-selectable',
		shiftForMultiSelect: true,
		allowMultiSelect: true,
		selectable: false,
		selectHiddenRows: false
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;

		this.selectedRows = new Elements();

		if (!this.bound) this.bound = {};
		this.bound.mouseleave = this.mouseleave.bind(this);
		this.bound.clickRow = this.clickRow.bind(this);
		this.bound.activateKeyboard = function(){
			if (this.keyboard && this.selectEnabled) this.keyboard.activate();
		}.bind(this);

		if (this.options.selectable) this.enableSelect();
	},

	empty: function(){
		if (this.body.rows.length) this.selectNone();
		return this.previous();
	},

	enableSelect: function(){
		this.selectEnabled = true;
		this.attachSelects();
		this.element.addClass(this.options.classSelectable);
		return this;
	},

	disableSelect: function(){
		this.selectEnabled = false;
		this.attachSelects(false);
		this.element.removeClass(this.options.classSelectable);
		return this;
	},

	push: function(){
		var ret = this.previous.apply(this, arguments);
		this.updateSelects();
		return ret;
	},

	toggleRow: function(row){
		return this[(this.isSelected(row) ? 'de' : '') + 'selectRow'](row);
	},

	selectRow: function(row, _nocheck){
		//private variable _nocheck: boolean whether or not to confirm the row is in the table body
		//added here for optimization when selecting ranges
		if (this.isSelected(row) || (!_nocheck && !this.body.getChildren().contains(row))) return;
		if (!this.options.allowMultiSelect) this.selectNone();

		if (!this.isSelected(row)){
			this.selectedRows.push(row);
			row.addClass(this.options.classRowSelected);
			this.fireEvent('rowFocus', [row, this.selectedRows]);
			this.fireEvent('stateChanged');
		}

		this.focused = row;
		document.clearSelection();

		return this;
	},

	isSelected: function(row){
		return this.selectedRows.contains(row);
	},

	getSelected: function(){
		return this.selectedRows;
	},

	serialize: function(){
		var previousSerialization = this.previous.apply(this, arguments) || {};
		if (this.options.selectable){
			previousSerialization.selectedRows = this.selectedRows.map(function(row){
				return Array.indexOf(this.body.rows, row);
			}.bind(this));
		}
		return previousSerialization;
	},

	restore: function(tableState){
		if(this.options.selectable && tableState.selectedRows){
			tableState.selectedRows.each(function(index){
				this.selectRow(this.body.rows[index]);
			}.bind(this));
		}
		this.previous.apply(this, arguments);
	},

	deselectRow: function(row, _nocheck){
		if (!this.isSelected(row) || (!_nocheck && !this.body.getChildren().contains(row))) return;

		this.selectedRows = new Elements(Array.from(this.selectedRows).erase(row));
		row.removeClass(this.options.classRowSelected);
		this.fireEvent('rowUnfocus', [row, this.selectedRows]);
		this.fireEvent('stateChanged');
		return this;
	},

	selectAll: function(selectNone){
		if (!selectNone && !this.options.allowMultiSelect) return;
		this.selectRange(0, this.body.rows.length, selectNone);
		return this;
	},

	selectNone: function(){
		return this.selectAll(true);
	},

	selectRange: function(startRow, endRow, _deselect){
		if (!this.options.allowMultiSelect && !_deselect) return;
		var method = _deselect ? 'deselectRow' : 'selectRow',
			rows = Array.clone(this.body.rows);

		if (typeOf(startRow) == 'element') startRow = rows.indexOf(startRow);
		if (typeOf(endRow) == 'element') endRow = rows.indexOf(endRow);
		endRow = endRow < rows.length - 1 ? endRow : rows.length - 1;

		if (endRow < startRow){
			var tmp = startRow;
			startRow = endRow;
			endRow = tmp;
		}

		for (var i = startRow; i <= endRow; i++){
			if (this.options.selectHiddenRows || rows[i].isDisplayed()) this[method](rows[i], true);
		}

		return this;
	},

	deselectRange: function(startRow, endRow){
		this.selectRange(startRow, endRow, true);
	},

/*
	Private methods:
*/

	enterRow: function(row){
		if (this.hovered) this.hovered = this.leaveRow(this.hovered);
		this.hovered = row.addClass(this.options.classRowHovered);
	},

	leaveRow: function(row){
		row.removeClass(this.options.classRowHovered);
	},

	updateSelects: function(){
		Array.each(this.body.rows, function(row){
			var binders = row.retrieve('binders');
			if (!binders && !this.selectEnabled) return;
			if (!binders){
				binders = {
					mouseenter: this.enterRow.pass([row], this),
					mouseleave: this.leaveRow.pass([row], this)
				};
				row.store('binders', binders);
			}
			if (this.selectEnabled) row.addEvents(binders);
			else row.removeEvents(binders);
		}, this);
	},

	shiftFocus: function(offset, event){
		if (!this.focused) return this.selectRow(this.body.rows[0], event);
		var to = this.getRowByOffset(offset, this.options.selectHiddenRows);
		if (to === null || this.focused == this.body.rows[to]) return this;
		this.toggleRow(this.body.rows[to], event);
	},

	clickRow: function(event, row){
		var selecting = (event.shift || event.meta || event.control) && this.options.shiftForMultiSelect;
		if (!selecting && !(event.rightClick && this.isSelected(row) && this.options.allowMultiSelect)) this.selectNone();

		if (event.rightClick) this.selectRow(row);
		else this.toggleRow(row);

		if (event.shift){
			this.selectRange(this.rangeStart || this.body.rows[0], row, this.rangeStart ? !this.isSelected(row) : true);
			this.focused = row;
		}
		this.rangeStart = row;
	},

	getRowByOffset: function(offset, includeHiddenRows){
		if (!this.focused) return 0;
		var index = Array.indexOf(this.body.rows, this.focused);
		if ((index == 0 && offset < 0) || (index == this.body.rows.length -1 && offset > 0)) return null;
		if (includeHiddenRows){
			index += offset;
		} else {
			var limit = 0,
			    count = 0;
			if (offset > 0){
				while (count < offset && index < this.body.rows.length -1){
					if (this.body.rows[++index].isDisplayed()) count++;
				}
			} else {
				while (count > offset && index > 0){
					if (this.body.rows[--index].isDisplayed()) count--;
				}
			}
		}
		return index;
	},

	attachSelects: function(attach){
		attach = attach != null ? attach : true;

		var method = attach ? 'addEvents' : 'removeEvents';
		this.element[method]({
			mouseleave: this.bound.mouseleave,
			click: this.bound.activateKeyboard
		});

		this.body[method]({
			'click:relay(tr)': this.bound.clickRow,
			'contextmenu:relay(tr)': this.bound.clickRow
		});

		if (this.options.useKeyboard || this.keyboard){
			if (!this.keyboard) this.keyboard = new Keyboard();
			if (!this.selectKeysDefined){
				this.selectKeysDefined = true;
				var timer, held;

				var move = function(offset){
					var mover = function(e){
						clearTimeout(timer);
						e.preventDefault();
						var to = this.body.rows[this.getRowByOffset(offset, this.options.selectHiddenRows)];
						if (e.shift && to && this.isSelected(to)){
							this.deselectRow(this.focused);
							this.focused = to;
						} else {
							if (to && (!this.options.allowMultiSelect || !e.shift)){
								this.selectNone();
							}
							this.shiftFocus(offset, e);
						}

						if (held){
							timer = mover.delay(100, this, e);
						} else {
							timer = (function(){
								held = true;
								mover(e);
							}).delay(400);
						}
					}.bind(this);
					return mover;
				}.bind(this);

				var clear = function(){
					clearTimeout(timer);
					held = false;
				};

				this.keyboard.addEvents({
					'keydown:shift+up': move(-1),
					'keydown:shift+down': move(1),
					'keyup:shift+up': clear,
					'keyup:shift+down': clear,
					'keyup:up': clear,
					'keyup:down': clear
				});

				var shiftHint = '';
				if (this.options.allowMultiSelect && this.options.shiftForMultiSelect && this.options.useKeyboard){
					shiftHint = " (Shift multi-selects).";
				}

				this.keyboard.addShortcuts({
					'Select Previous Row': {
						keys: 'up',
						shortcut: 'up arrow',
						handler: move(-1),
						description: 'Select the previous row in the table.' + shiftHint
					},
					'Select Next Row': {
						keys: 'down',
						shortcut: 'down arrow',
						handler: move(1),
						description: 'Select the next row in the table.' + shiftHint
					}
				});

			}
			this.keyboard[attach ? 'activate' : 'deactivate']();
		}
		this.updateSelects();
	},

	mouseleave: function(){
		if (this.hovered) this.leaveRow(this.hovered);
	}

});

/*
---
description: Creates instances of HtmlTable for tables with the HtmlTable filter
provides: [Behavior.HtmlTable]
requires: [Behavior/Behavior, More/HtmlTable.Sort, More/HtmlTable.Zebra, More/HtmlTable.Select, More/Object.Extras]
script: Behavior.HtmlTable.js
name: Behavior.HtmlTable
...
*/

/*
  Refactor HtmlTable.Sort functionality:
  don't detect the parsers on startup
  wait for click
  unless the option says to sort on startup
*/

HtmlTable = Class.refactor(HtmlTable, {
  detectParsers: function(){
    //if we are parsing on startup, then set ready to true
    if (this.options.sortOnStartup) this._readyToParse = true;
    //otherwise, don't parse until ready
    if (this._readyToParse){
      this._parsed = true;
      return this.previous();
    }
  },
  headClick: function(event, el){
    //on click, if we haven't parsed, set ready to true and run the parser
    if (!this._parsed){
      this._readyToParse = true;
      this.setParsers();
    }
    this.previous(event, el);
  },
  sort: function(index, reverse, pre){
    //don't sort if we haven't parsed; this prevents sorting on startup
    if (this._parsed) return this.previous(index, reverse, pre);
  }
});


Behavior.addGlobalFilter('HtmlTable', {

  deprecatedAsJSON: {
    resize: 'table-resize'
  },

  defaults: {
    classNoSort: 'noSort'
  },

  setup: function(element, api){
    //make all data tables sortable
    var firstSort;
    element.getElements('thead th').each(function(th, i){
      if (firstSort == null && !th.hasClass('noSort')) firstSort = i;
      if (th.hasClass('defaultSort')) firstSort = i;
    });
    api.setDefault('firstSort', firstSort);
    var multiselectable = api.getAs(Boolean, 'multiselect', element.hasClass('multiselect')) || api.getAs(Boolean, 'allowMultiSelect');
    var table = new HtmlTable(element,
      Object.cleanValues({
        parsers: api.getAs(Array, 'parsers'),
        sortOnStartup: api.getAs(Boolean, 'sortOnStartup'),
        sortIndex: api.getAs(Number, 'firstSort'),
        sortable: api.getAs(Boolean, 'sortable', /* deprecated default: */ element.hasClass('sortable')),
        sortReverse: api.getAs(Boolean, 'sortReverse'),
        classNoSort: api.get('noSort'),
        selectable: api.getAs(Boolean, 'selectable', /* deprecated default: */ element.hasClass('selectable') || multiselectable),
        allowMultiSelect: multiselectable,
        useKeyboard: api.getAs(Boolean, 'useKeybaord', /* deprecated default: */ !element.hasClass('noKeyboard'))
      })
    );
    api.onCleanup(function(){
      if (table.keyboard) table.keyboard.relinquish();
    });
    // Hack to make tables not jump around in Chrome.
    if (Browser.Engine.webkit){
      var width = element.style.width;
      element.setStyle('width', '99%');
      (function(){
        element.style.width = width;
      }).delay(1);
    }
    return table;
  }

});

HtmlTable.defineParsers({
  //A parser to allow numeric sorting by any value.
  dataSortNumeric: {
    match: /data-sort-numeric/,
    convert: function(){
      return this.getElement('[data-sort-numeric]').getData('sort-numeric').toFloat();
    },
    number: true
  },
  //A parser to allow lexicographical sorting by any string.
  dataSortString: {
    match: /data-sort-string/,
    convert: function(){
      return this.getElement('[data-sort-string]').getData('sort-string');
    },
    number: false
  }
});

/*
---

name: InteractiveList

description: Able to mark selected list members with a class and can optionally scroll that member to the top of the list

requires:
 - More/Fx.Scroll
 - Core/Element.Delegation
 - Swipe

provides: [InteractiveList]

...
*/

InteractiveList = new Class({
  Implements: [Options, Events],
  options: {
    selectedClass: 'selected',
    listItems: 'li',
    autoScroll: true,
    scrollAxes: null,
    firstItemSelected: false,
    // scrolls to the item when clicked even if it's already been scrolled to
    doubleScroll: true,
    scrollType: 'toElement',
    swipeToNext: false
  },
  // currentlySelected: null,
  initialize: function(listElement, options){
    this.element = document.id(listElement);
    this.scroll = new Fx.Scroll(this.element);
    this.setOptions(options);
    this.bound = {};
    if (this.options.swipeToNext){
      this.bound.swipeHandler = function(e){
        this.fireEvent('interaction', 'swipe');
        if (e.direction == 'left') this.next(e);
        else if (e.direction == 'right') this.back(e);
      }.bind(this);
    }
    this.attach();
  },
  clickHandler: function(event, clickedElement){
    this.select(clickedElement, event);
  },
  attach: function(){
    this.element.addEvent('click:relay('+this.options.listItems+')', this.clickHandler.bind(this));
    if (this.options.firstItemSelected) this.select(this.getListItems()[0]);
    if (this.options.swipeToNext) this.element.addEvent('swipe', this.bound.swipeHandler);
  },
  getListItems: function(){
    return this.element.getElements(this.options.listItems);
  },
  select: function(selectedElement, event){
    // marks li as selected
    if (!this.disabled){
      this.reset();
      if (this.options.autoScroll && (this.options.doubleScroll || this.currentlySelected != selectedElement)){
        this.scroll[this.options.scrollType](selectedElement, this.options.scrollAxes);
      }
      this.currentlySelected = selectedElement;
      selectedElement.addClass(this.options.selectedClass);
    }
    this.fireEvent('select', [selectedElement, event]);
  },
  next: function(e){
    var listItems = this.getListItems();
    var selectedIndex = listItems.indexOf(this.currentlySelected);
    if (selectedIndex != listItems.length-1) this.select(listItems[selectedIndex+1]);
  },
  back: function(e){
    var listItems = this.getListItems();
    var selectedIndex = listItems.indexOf(this.currentlySelected);
    if (selectedIndex !== 0) this.select(listItems[selectedIndex-1]);
  },
  disable: function(){
    this.disabled = true;
  },
  enable: function(){
    this.disabled = false;
  },
  reset: function(){
    if (this.currentlySelected) this.currentlySelected.removeClass(this.options.selectedClass);
  }
});
/*
---

name: Behavior.InteractiveList

description: Behavior for showing a spinner when a form is submitted.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - InteractiveList

provides: [Behavior.InteractiveList]

...
*/

Behavior.addGlobalFilter('InteractiveList', {

  returns: InteractiveList,

  setup: function(element, api){
    var list = new InteractiveList(element, Object.cleanValues(
        api.getAs({
          selectedClass: String,
          listItems: String,
          autoScroll: Boolean,
          scrollAxes: String,
          firstItemSelected: Boolean,
          doubleScroll: Boolean,
          scrollType: String,
          swipeToNext: Boolean
        })
      )
    );
    if (list.options.swipeToNext && !list.options.firstItemSelected) api.error('To use swipeToNext, you must enable firstItemSelected.');
    // mark the first element that has the selected class already as being so
    var items;
    if (list && list.options.listItems) items = element.getElements(list.options.listItems);
    if (!items.length) api.error('Could not find any list items in Interactive List');

    var selected = items.filter('.' + list.options.selectedClass)[0];
    if (selected){
      list.currentlySelected = selected;
      list.select(selected);
    }

    list.addEvent('select', function(selectedEl){
      api.fireEvent('interactiveListSelect', [selectedEl, list]);
    });
    return list;
  }
});

/*
---

name: Behavior.InteractiveMessageList

description: Gives InteractiveList the ability to initially select an arbitrary member,
             decrement a counter and add a 'read' class. It also allows more than
             one InteractiveMessageList to share a group, and only one is marked
             as selected at a time.

license: MIT-style license.

authors: [Davy Wentworth]

requires:
 - InteractiveList

provides: [Behavior.InteractiveMessageList]

...
*/

Behavior.addGlobalPlugin('InteractiveList', 'InteractiveMessageList', function(el, api, instance){
  var selected = el.getElement(api.get('initialSelect'));
  instance.addEvent('select', function(){
    el.getElements('.blur').removeClass('blur');
    var date = instance.currentlySelected.getElement(api.get('markAsRead'));
    if (date && !date.hasClass('read')){
      date.addClass('read');
    }
    var unreadSection = el.getElement(api.get('unreadSection'));
    if (unreadSection){
      var count = unreadSection.getElement('span.count');
      if (count){
        count.set('html', count.get('html').toInt() - 1);
        if (count.get('html').toInt() < 1) unreadSection.addClass('hide');
      }
    }
  });

  if (selected){
    instance.select(selected);
  }

  api.addEvent('interactiveListSelect', function(selectedEl, list){
    if (list != instance && instance.currentlySelected) instance.currentlySelected.addClass('blur').removeClass('selected');
  });
});
/*
---

name: Mask.BoxModel

description: Makes Mask work with elements when their box-sizing is border-box.

requires:
 - Core/DomReady
 - Core/Element.Dimensions
 - More/Mask

provides: [Mask.BoxModel]

...
*/

(function(){

  var isBorderBox = function(element){
    return element == document.body || element.getStyle('box-sizing') != 'border-box';
  };

  Class.refactor(Mask, {
    useIframeShim: false,
    resize: function(x, y){

      // this patch also supports border-radius
      this.element.setStyle('borderRadius', this.target.getStyle('border-radius'));

      // if target isn't border-box, just do what original implementation does.
      if (isBorderBox(this.target)) return this.previous.apply(this, arguments);
      // otherwise, do everything the original does but don't include border and padding
      var dim = this.target.getSize();
      this.element.setStyles({
        width: x || dim.x,
        height: y || dim.y,
      });

      return this;
    },

    position: function(){
      // if target isn't border-box, just do what original implementation does.
      if (isBorderBox(this.target)){
        return this.previous.apply(this, arguments);
      }

      this.resize(this.options.width, this.options.height);

      this.element.position({
        relativeTo: this.target,
        position: 'topLeft',
        ignoreMargins: !this.options.maskMargins,
        ignoreScroll: this.target == document.body,
        offset: {
          x: - this.target.getStyle('border-left-width').toInt(),
          y: - this.target.getStyle('border-top-width').toInt()
        }
      });

      return this;
    }
  });

})();
/*
---

name: Behavior.ClickOutToHide

description: Behavior that removes an element when you click out of it.

requires:
 - Behavior/Behavior
 - Core/Element.Style

provides: [Behavior.ClickOutToHide]

...
*/

Behavior.addGlobalFilter('ClickOutToHide', {
  defaults: {
    useEscapeKey: true,
    destroyElement: false
  },
  setup: function(el, api){

    var destroy = function(){
      if (api.get('destroyElement')){
        api.cleanup(el);
        el.destroy();
      } else {
        el.setStyle('display', 'none');
      }
    };

    var events = {
      click: function(e){
        if (e.target != el && !el.contains(e.target)) destroy();
      }
    };
    if (api.get('useEscapeKey')){
      events.keyup = function(e){
        if (e.key == "esc") destroy();
      };
    }

    document.body.addEvents(events);
    api.onCleanup(function(){
      document.body.removeEvents(events);
    });

    return el;
  }
});
/*
---

name: Behavior.Highlight

description: Highlights a DOM element that's been updated with Fx.Tween's .highlight function

requires:
 - Core/Fx.Tween
 - Behavior/Behavior

provides: [Behavior.Highlight]

...
*/

Behavior.addGlobalFilter('Highlight', {
  defaults: {
    // start: '#ffff88',
    // end: 'transparent',
    fxOptions: {
      duration: 1000
    }
  },
  setup: function(el, api){
    el.set('tween', api.get('fxOptions'));
    el.highlight(api.get('start'), api.get('end'));
    return el.get('tween');
  }
});
/*
---

name: Behavior.Invoke

description: Behavior for invoking an action for a delegated event

requires:
 - Behavior/Behavior
 - Core/Element.Delegation

provides: [Behavior.Invoke]

...
*/


/*
  Example: watch child elements of a form for clicks or change and then invoke
  a method on an element relative to the one that was clicked/changed:

  this example would watch all inputs and selects for click/change and
  then find the element matching '!tr .foo-btn' relative to the element clicked
  and call .removeClass('btn-grey') on that element.
 <form data-behavior="Invoke"
   data-invoke-options="{
     'events':[
       'click:relay(input)',
       'change:relay(select)'
       ],
     'action':'removeClass',
     'args':['btn-grey'],
     'targets':'!tr .foo-btn'
   }">
  </form>


  Example: same as above, but on the element itself:
  <input data-behavior="Invoke"
    data-invoke-options="
      {
        'events': ['click'],
        'action': 'removeClass',
        'args': ['btn-grey'],
        'targets': '!tr .foo-btn'
      }
    "
  />
*/


Behavior.addGlobalFilter('Invoke', {
  defaults: {
    events: ['click']
  },
  requireAs: {
    action: String,
    args: Array
  },
  setup: function(element, api){
    var eventHandler = function(event, el){
      var targets;
      if (api.get('targets')) targets = api.getElements('targets');
      else if (api.get('targetsFromEventTarget')) targets = el.getElements(api.get('targetsFromEventTarget'));
      if (!targets.length) api.fail('could not get target elements for invoke filter for selector ' + api.get('targets'));
      targets[api.get('action')].apply(targets, api.get('args'));
    };
    api.get('events').each(function(selector){
      element.addEvent(selector, eventHandler);
    });
    return element;
  }
});

/*
---

name: Behavior.SetMinSize

description: Measures the heights of any number of elements and then sets the min-size of a specified target to the largest.

requires:
 - Core/Element.Style
 - More/Element.Measure
 - More/Events.Pseudos
 - Behavior/Behavior

provides: [Behavior.SetMinSize]

...
*/

(function(){

  var sizer = function(element, api){
    element.setStyle('min-height', '');
    var sizes = api.getElements('targets').map(function(target){
      return target.measure(function(){
        return this.getSize().y;
      });
    });
    element.setStyle('min-height', Math.max.apply(Math, sizes));
  };

  Behavior.addGlobalFilter('SetMinSize', {

    defaults: {
      targets: '>'
    },

    setup: function(element, api){
      // apply immediately
      sizer(element, api);
      // but then run it once more when Behavior has finished its
      // run through the DOM to accomodate to changes made to the DOM
      api.addEvent('apply:once', sizer.pass([element, api]));
      // finally, if this is the first time we're running and the page
      // hasn't loaded, run it again to provide time for layout rendering
      window.addEvent('load', sizer.pass([element, api]));

      return element;
    }

  });

})();


/*
---

name: Request.PollForUpdate

description: Hits a JSON endpoint and if the status entry of the response JSON
             is 'update' it fires the countUpdated event. if there is an updated_at
             entry in the response, the updatedAt attribute is updated as well.

requires:
 - Core/Request.JSON

provides: [Request.PollForUpdate]

...
*/

/*
  example response: {
    'status':     'update',     // this can be anything, but 'update' is the only one this responds to
    'date':       1380133559,   // this is the date to check against on the server
    'updated_at': 1380135000    // optional. if present, the instance's updatedAt attribute
                                // will be set to this if an 'update' status is returned
  }
*/

Request.PollForUpdate = new Class({
  Implements: [Options, Events],
  options: {
    pollInterval: 1000
    // url: some url returning json,
    // date: some_time_in_seconds
  },
  initialize: function(options){
    this.setOptions(options);
    this.updatedAt = this.options.date;
    // format the data payload for the server
    this.data = {
      'date': this.options.date,
      'status': 'initial'
    };
    this.url = this.options.url;
  },
  poll: function(){
    this.poller = this._fetch.periodical(this.options.pollInterval, this);
    return this;
  },
  stop: function(){
    clearInterval(this.poller);
    return this;
  },
  _fetch: function(){
    if (!this.request){
      this.request = new Request.JSON({
        url: this.url,
        onComplete: this._handleData.bind(this),
        method: 'get'
      });
    }
    this.request.send({data: this.data});
  },
  _handleData: function(){
    var data = this.request.response.json;
    // if the server provides an 'updated_at' timestamp,
    // store as an attribute
    if (data.status == 'update'){
      if (data.updated_at) this.updatedAt = data.updated_at.toInt();
      this.data = data;
      this.fireEvent('update', data);
    }
  }
});
/*
---

name: Behavior.PollForUpdate

description: Behavior that polls a URL and runs delegators and actions upon an update response.

requires:
 - Request.PollForUpdate
 - Behavior/Behavior
 - Behavior/Delegator.verifyTargets

provides: [Behavior.PollForUpdate]

...
*/
(function(){
  Behavior.addGlobalFilter('PollForUpdate', {

    requireAs: {
      url: String,
      date: Number
    },

    returns: Request.PollForUpdate,

    setup: function(el, api){
      // instantiate the pollForUpdate object and start polling
      var pollForUpdate = new Request.PollForUpdate({
        url: api.get('url'),
        date: api.get('date'),
        pollInterval: api.get('pollInterval') || 60000,
      }).poll();

      var target = api.get('target') ? api.getElement('target') : null;
      var dataKey = api.get('dataKey');

      // if this is enabled, when the element is clicked we send the 'updatedAt'
      // instead of the 'date'. this way, we can only update the date that we
      // are comparing on the server after user interaction.
      if (api.get('updateDateOnClick')){
        el.addEvent('click', function(){
          pollForUpdate.data.date = pollForUpdate.updatedAt;
        });
      }

      //get the delegators and actions to call
      var delegators = api.get('delegators');
      var actions = api.get('actions');

      // when we detect an update from the server, run any delegators we've specified
      // and update the target's html with data[dataKey] (if specified)
      pollForUpdate.addEvent('update', function(data){
        if (target && dataKey){
          if (data[dataKey]){
            api.fireEvent('destroyDom', target);
            target.set('html', data[dataKey]);
            api.fireEvent('ammendDom', target);
          } else {
            api.error('Could not find the specified dataKey (' + dataKey + ') in the data returned from the server.');
          }
        }
        if (delegators){
          Object.each(delegators, function(delegatorOptions, delegator){
            if (Delegator.verifyTargets(el, delegatorOptions, api)){
              api.getDelegator().trigger(delegator, el);
            }
          });
        }
      });
      api.onCleanup(function(){
        pollForUpdate.stop();
      });
      return pollForUpdate;
    }
  });
})();
/*
---

script: Request.Periodical.js

name: Request.Periodical

description: Requests the same URL to pull data from a server but increases the intervals if no data is returned to reduce the load

license: MIT-style license

authors:
  - Christoph Pojer

requires:
  - Core/Request
  - MooTools.More

provides: [Request.Periodical]

...
*/

Request.implement({

	options: {
		initialDelay: 5000,
		delay: 5000,
		limit: 60000
	},

	startTimer: function(data){
		var fn = function(){
			if (!this.running) this.send({data: data});
		};
		this.lastDelay = this.options.initialDelay;
		this.timer = fn.delay(this.lastDelay, this);
		this.completeCheck = function(response){
			clearTimeout(this.timer);
			this.lastDelay = (response) ? this.options.delay : (this.lastDelay + this.options.delay).min(this.options.limit);
			this.timer = fn.delay(this.lastDelay, this);
		};
		return this.addEvent('complete', this.completeCheck);
	},

	stopTimer: function(){
		clearTimeout(this.timer);
		return this.removeEvent('complete', this.completeCheck);
	}

});

/*
---

name: Request.BindData

description: Adds ability to rate limit all requests on a page.

requires:
 - Core/Request.JSON
 - More/Request.Periodical

provides: [Request.BindData]

...
*/

Request.BindData = new Class({

  Implements: [Options, Events],

  options: {
    // onUpdate: function(element, key, value){},
    // onBeforeUpdate: function(element, key, value){},
    // onError: function(key){},
    requestOptions: {
      delay: 1000,
      limit: 3000,
      method: 'get'
    },
    elementMap: {
      /*
        example:

        users: '#users',
        transactions: 'div.transactions',
        etc

      */
    },
    property: 'html'
  },

  initialize: function(container, options){
    this.element = document.id(container);
    this.setOptions(options);
  },

  start: function(){
    if (!this.req){
      this.req = new Request.JSON(this.options.requestOptions);
      this.req.addEvent('success', this.update.bind(this));
    }
    this.req.startTimer();
    this.req.send();
  },

  stop: function(){
    if (this.req) this.req.stopTimer();
  },

  update: function(data){
    Object.each(data, function(v, k){ this.set(k, v); }, this);
  },

  set: function(key, value){
    var element = this.getElement(key);
    if (element){
      this.fireEvent('beforeUpdate', [element, key, value]);
      element.set(this.options.property, value);
      this.fireEvent('update', [element, key, value]);
    } else {
      this.fireEvent('error', key);
    }
  },

  getElement: function(key){
    return this.element.getElement(this.options.elementMap[key] || '#' + key);
  }

});
/*
---

name: Behavior.Request.BindData

description: Binds an element's innerhtml to te contents of an
             ajax endpoint that is repeatedly polled for updates.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Request.BindData

provides: [Behavior.Request.BindData]

...
*/

Behavior.addGlobalFilter('Request.BindData', {

  requires: 'url',

  returns: Request.BindData,

  setup: function(element, api){
    var req = new Request.BindData(element,
      Object.cleanValues(
        api.getAs({
          elementMap: Object,
          requestOptions: Object
        })
      )
    );
    req.setOptions({
      requestOptions: {
        url: api.get('url')
      }
    });
    req.addEvents({
      beforeUpdate: function(target){
        api.fireEvent('destroyDom', target);
      },
      update: function(target){
        api.fireEvent('ammendDom', target.getParent());
      },
      error: function(key){
        api.warn('could not find element for key ' + key);
      }
    });
    req.start();
    api.onCleanup(req.stop.bind(api));
    return req;
  }
});
/*
---

name: Request.Limit

description: Adds ability to rate limit all requests on a page.

requires:
 - Core/Request.JSON
 - Core/Request.HTML
 - More/Class.Refactor

provides: [Request.Limit]

...
*/

/*

  This class implements functionality to rate limit the number of running requests on a page.
  The change is global, so all instances of Request should obey the limit.

  To use, simply implement into Request the option value you desire:

  Request.implement({
    options: {
      limit: 2
    }
  });

  This will set the default maximum number of requests to 2 for all instances. Note that
  individual instances can overwrite this limit by specifying a different option. This
  means that you can rate limit different requests as you like. For instance, you could
  set your default, as above, to 2, but then for a request that allows the user to
  edit a form (the response to which you want to prioritize) you could set that instance's
  limit to zero and it'll ignore the queue.

*/

(function(){
  // this function moves on in the queue if the request is finished, used when the request
  // is canceled and when the xhr changes state
  var nextRequest = function(){
    // run the parent's cancel or onStateChange method
    this.previous.apply(this, arguments);
    // if the result of that call sets this.running to false
    // and there's a limit set at all...
    if (Request.active.contains(this) && !this.running){
      // remove this instance from the list of active requests; not harmful if called more than once
      Request.active.splice(Request.active.indexOf(this), 1);
      // if there's anying left in the queue
      // and the number of active requests is < the limit
      if (Request.queue.length && Request.active.length < this.options.limit){
        // pop off the oldest request call and execute it. this syntax with the double parens is a little
        // weird but that's what it does.
        var bound = Request.queue.shift();
        Request.active.push(bound.instance);
        bound();
        this.fireEvent('onContinue');
      }
    }
    return this;
  };

  Class.refactor(Request, {
    options: {
      // when the limit is zero, there is no rate limit applied
      limit: 0
    },
    send: function(options){
      if (!this.check()) return;
      if (this._uid === undefined) this._uid = 1 + Request.uids++;
      // if there's a limit and the active requests is less than that limit
      if (!this.options.limit || Request.active.length < this.options.limit){
        // then run the request and push this instance into the active list
        this.previous.apply(this, arguments);
        Request.active.push(this);
      } else {
        // else queue the send request
        var bound = this.previous.bind(this, arguments);
        bound.instance = this;
        Request.queue.push(bound);
        this.fireEvent('onQueue');
      }
      return this;
    },
    onStateChange: nextRequest,
    cancel: nextRequest
  });

  // array of queued calls to .send()
  Request.queue = [];
  // array of running requests
  Request.active = [];

  Request.uids = 0;

})();
/*
---

name: ScrollTween

description: Animates things based on scroll behavior

requires:
 - Core/DomReady
 - Core/Element.Dimensions
 - More/Fx.Scroll
 - Core/DomReady

provides: [ScrollTween, ScrollTween.manager]

...
*/

var ScrollTween = new Class({
  Implements: [Options],
  options: {
    from: 0,
    to: null,
    onTween: null, //function(percent, [number])
    onStart: null,  //function(scroll, winSize, docSize)
    onEnd: null,  //function(scroll, winSize, docSize)
    tween: {
      element: null,
      style: null,
      from: 0,
      to: 1
    }
  },
  initialize: function(options){
    this.setOptions(options);
    this.element = typeOf(this.options.tween.element) == 'string' ? document.id(this.options.tween.element) : this.options.tween.element;
    this.tween = this.element && this.options.tween.style;
    ScrollTween.manager.register(this);
  },
  start: function(scroll, winSize, docSize){
    this.active = true;
    this.scroll(scroll, winSize, docSize);
    if (this.options.onStart) this.options.onStart.apply(this, arguments);
  },
  end: function(scroll, winSize, docSize){
    this.active = false;
    this.scroll(scroll, winSize, docSize);
    if (this.options.onEnd) this.options.onEnd.apply(this, arguments);
  },
  _now: {},
  scroll: function(scroll, winSize, docSize){
    var to = this.options.to || docSize - winSize;
    this.percent = percent = (scroll - this.options.from) / (to - this.options.from);
    this.under = scroll <= this.options.from;
    this.over = scroll >= this.options.to;
    this.now = scroll;
    if (this.tween){
      var tween = this.options.tween;
      var point = this.getPoint(tween.from, tween.to, this.options.tween.unit);
      this.element.setStyle(this.tween, point.value);
      if (this.options.onTween) this.options.onTween.apply(this, [percent, point.number]);
    } else {
      if (this.options.onTween) this.options.onTween.apply(this, [percent]);
    }
  },
  getPoint: function(start, end, unit){
    var to,
        diff = end - start,
        offset = diff * this.percent,
        point = offset + start;
    if (start > end) to = point.limit(end, start);
    else to = point.limit(start, end);
    return {
      number: to,
      value: unit ? to + unit : to
    };
  }
});

ScrollTween.manager = {
  _instances: [],
  init: function(){
    this.bound = {
      onScroll: this.onScroll.bind(this),
      onResize: this.onResize.bind(this)
    };
    this.attach();
    this.onResize();
  },
  attach: function(detach){
    window[detach ? 'removeEvent' : 'addEvent']('scroll', this.bound.onScroll);
    window[detach ? 'removeEvent' : 'addEvent']('resize', this.bound.onResize);
  },
  register: function(instance){
    this._instances.push(instance);
    instance.scroll(this.scroll, this.winSize, this.docSize);
  },
  scrollEnd: null,
  onScroll: function(finalize){
    this.scroll = window.getScroll().y;
    for (var i = 0; i < this._instances.length; i++){
      this.calculate(this._instances[i], this.scroll, false, i);
    }
    clearTimeout(this.scrollEnd);
    if (finalize) this.scrollEnd = this.onScroll.delay(20, this, [true]);
  },
  calculate: function(instance, scroll, finalize, index){
    var to = instance.options.to || this.docSize,
        from = instance.options.from;
    var inRange = to > scroll &&
                  from < scroll;
    if (inRange){
      if (!instance.active) instance.start(scroll, this.winSize, this.docSize);
      instance.scroll(scroll, this.winSize, this.docSize);
    } else if (instance.active ||
        (instance.now < instance.options.from && scroll > instance.options.to) ||
        (instance.now > instance.options.to && scroll < instance.options.from)
      ){
      instance.end(scroll, this.winSize, this.docSize);
    }
  },
  onResize: function(){
    this.scroll = window.getScroll().y;
    this.winSize = window.getSize().y;
    this.docSize = document.body.getScrollSize().y;
  }
};

window.addEvent('domready', function(){
  ScrollTween.manager.init();
});
/*
---

name: Slider.Modify

description: Extends Slider, allowing it to modify DOM elements based on the value
             of the slider.

license: MIT-Style
authors:
  - Davy Wentworth

requires:
  - More/Slider
  - Behavior-UI/Number

provides: [Slider.Modify]

...
*/

/*
    Example input for targets:
      'targets': [
        {
          'selector': '!body #html-example',
          'property': 'html',
          'operators': [
            {'operate': ['pow', 2]},
            {'humanize': [{'decimalsLessThanBase': false}]}
          ],
          'completeClass': 'complete'
        },
        {
          'selector': '!body #value-example',
          'property': 'value'
        },
        {
          'selector': '!body #simple-operator',
          'operators': [{
            'operate': ['*', 7]
          }]
        }
      ]
*/

Slider.Modify = new Class({
  Extends: Slider,
  options: {
    // slideFill: Element,
    targets: [],

    onMove: function(){
      this.updateSlideFill();
      this.updateTargets();
    },

    onComplete: function(){
      this.targets.each(function(target){
        if (target['completeClass'] && target['element']) target['element'].addClass(target['completeClass']);
      });
    }
  },
  initialize: function(element, knob, options){
    this.targets = options.targets;
    this.slideFill = document.id(options.slideFill);
    this.parent(element, knob, options);
    this.buildTargets();
  },

  buildTargets: function(){
    this.targets.each(function(target){
      target['element'] = this.element.getElement(target['selector']);
      if (!target['element'] && console && console.warn) console.warn('Unable to find target from selector '+target['selector']);
    }, this);
  },

  updateSlideFill: function(){
    var percentage = 100*this.step/this.max;
    if (this.slideFill) this.slideFill.setStyle('width', percentage+"%");
  },

  updateTargets: function(){
    this.targets.each(this.updateTarget, this);
  },

  updateTarget: function(target){
    var modifiedCount = this.step;
    var property = target['property'] || 'html';

    if (target['operators']){
      target['operators'].each(function(operatorObj){
        Object.each(operatorObj, function(params, operator){
          modifiedCount = this.applyOperator(modifiedCount, operator, params);
        }, this);
      }, this);
    }

    if (target['completeClass'] && target['element']) target['element'].removeClass(target['completeClass']);

    if (target['element']) target['element'].set(property, modifiedCount);
  },

  applyOperator: function(modifiedCount, operator, params){
    // ensure the 'this' for apply is the Number.
    return modifiedCount[operator].apply(modifiedCount, params);
  }
});

/*
---

name: Behavior.Slider.Modify

description: Behavior for creating an interactive slider that can update and
             modify the contents of elements with the value from the slider.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - /Slider.Modify

provides: [Behavior.Slider.Modify]

...
*/
Behavior.addGlobalFilter('Slider.Modify', {
  defaults: {
    knob: '~.slider-knob',
    fill: '.slider-fill',
    startRange: 1
  },
  requireAs: {
    endRange: Number,
    initialStep: Number
  },
  returns: Slider.Modify,

  setup: function(element, api){
    // slideFill is optional
    var slideFill = api.get('fill') ? api.getElement('fill') : null;
    var knob = api.getElement('knob');
    var targets = api.getAs(Array, 'targets');

    if (!targets && targets.length) api.fail('Unable to find targets option.');

    // instantiate a new Slider.Modify instance.
    var slider = new Slider.Modify(
      element,
      knob,
      {
        steps: api.getAs(Number, 'steps'),
        range: [api.getAs(Number, 'startRange'), api.getAs(Number, 'endRange')],
        initialStep: api.getAs(Number, 'initialStep'),
        slideFill: slideFill,
        targets: targets
      }
    );
    api.onCleanup(slider.detach.bind(slider));

    return slider;
  }
});

/*
---

name: Spinner.CSS

description: Allows Spinner class to render more complex DOM for CSS spinner styling.

requires:
 - More/Spinner
 - More/Class.Refactor

provides: [Spinner.CSS]

...
*/

Class.refactor(Spinner, {

  options: {
    cssSpinner: true
  },

  render: function(){
    this.previous.apply(this, arguments);
    this.img.destroy();
    var img = this.img = new Element('div.css-spinner');
    var size = this.target.getSize();
    if (size.x && size.y && (size.x < 100 || size.y < 100)) img.addClass('spinner-small');

    if (this.target.get('data-spinner-class')) img.addClass(this.target.get('data-spinner-class'));
    if (this.target.get('data-mask-class')) this.element.addClass(this.target.get('data-mask-class'));

    (12).times(function(i){
      img.adopt(new Element('div.bar' + (i+1)));
    });
    img.inject(this.content);
  }

});

/*
---

name: Behavior.Tabs.ShowAll

description: Adds support for a "show all" button for the tabs UI

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior.BS.Tabs

provides: [Behavior.Tabs.ShowAll]

...
*/
(function(){
  var getFilter = function(prefix){
    return {
      setup: function(el, api, instance){
        var instanceApi = new BehaviorAPI(el, prefix);
        var showAll = instanceApi.get('showAllSelector');
        if (showAll){
          var elements = el.getElements(showAll);
          if (elements.length == 0){
            api.warn('Cannot attach to "show all" buttons as none were found with this selector: ', showAll)
          } else {
            elements.addEvent('click', function(e){
              instance.sections.each(function(el){
                el.setStyle('display', 'block');
              });
              if (instance.now !== null){
                var tab = instance.tabs[instance.now];
                tab.removeClass('active');
                parentTab = tab.getElement('!.active');
                if (el.hasChild(parentTab)) parentTab.removeClass('active');
              }
              instance.now = null;
              elements.addClass('active');
            });
          }
        }
      }
    };
  };

  Behavior.addGlobalPlugin('Tabs', 'Behavior.Tabs.ShowAll', getFilter('Tabs'));
  Behavior.addGlobalPlugin('BS.Tabs', 'Behavior.BS.Tabs.ShowAll', getFilter('BS.Tabs'));
})();
/*
---

name: dbug

description: A wrapper for Firebug console.* statements.

license: MIT-style license.

authors:
 - Aaron Newton

provides: dbug

...
*/
var dbug = {
  logged: [],
  timers: {},
  firebug: false,
  enabled: false,
  log: function(){
    dbug.logged.push(arguments);
  },
  nolog: function(msg){
    dbug.logged.push(arguments);
  },
  time: function(name){
    dbug.timers[name] = new Date().getTime();
  },
  timeEnd: function(name){
    if (dbug.timers[name]){
      var end = new Date().getTime() - dbug.timers[name];
      dbug.timers[name] = false;
      dbug.log('%s: %s', name, end);
    } else dbug.log('no such timer: %s', name);
  },
  enable: function(silent){
    var con = window.firebug ? firebug.d.console.cmd : window.console;

    if((!!window.console && !!window.console.warn) || window.firebug){
      try {
        dbug.enabled = true;
        dbug.log = function(){
            try {
              (con.debug || con.log).apply(con, arguments);
            } catch(e){
              console.log(Array.slice(arguments));
            }
        };
        dbug.time = function(){
          con.time.apply(con, arguments);
        };
        dbug.timeEnd = function(){
          con.timeEnd.apply(con, arguments);
        };
        if(!silent) dbug.log('enabling dbug');
        for(var i=0;i<dbug.logged.length;i++){ dbug.log.apply(con, dbug.logged[i]); }
        dbug.logged=[];
      } catch(e){
        dbug.enable.delay(400);
      }
    }
  },
  disable: function(){
    if(dbug.firebug) dbug.enabled = false;
    dbug.log = dbug.nolog;
    dbug.time = function(){};
    dbug.timeEnd = function(){};
  },
  cookie: function(set){
    var value = document.cookie.match('(?:^|;)\\s*jsdebug=([^;]*)');
    var debugCookie = value ? unescape(value[1]) : false;
    if((set == null && debugCookie != 'true') || (set != null && set)){
      dbug.enable();
      dbug.log('setting debugging cookie');
      var date = new Date();
      date.setTime(date.getTime()+(24*60*60*1000));
      document.cookie = 'jsdebug=true;expires='+date.toGMTString()+';path=/;';
    } else dbug.disableCookie();
  },
  disableCookie: function(){
    dbug.log('disabling debugging cookie');
    document.cookie = 'jsdebug=false;path=/;';
  },
  conditional: function(fn, fnIfError){
    if (dbug.enabled){
      return fn();
    } else {
      try {
        return fn();
      } catch(e){
        if (fnIfError) fnIfError(e);
      }
    }
  }
};

(function(){
  var fb = !!window.console || !!window.firebug;
  var con = window.firebug ? window.firebug.d.console.cmd : window.console;
  var debugMethods = ['debug','info','warn','error','assert','dir','dirxml'];
  var otherMethods = ['trace','group','groupEnd','profile','profileEnd','count'];
  function set(methodList, defaultFunction){

    var getLogger = function(method){
      return function(){
        con[method].apply(con, arguments);
      };
    };

    for(var i = 0; i < methodList.length; i++){
      var method = methodList[i];
      if (fb && con[method]){
        dbug[method] = getLogger(method);
      } else {
        dbug[method] = defaultFunction;
      }
    }
  };
  set(debugMethods, dbug.log);
  set(otherMethods, function(){});
})();
if ((!!window.console && !!window.console.warn) || window.firebug){
  dbug.firebug = true;
  var value = document.cookie.match('(?:^|;)\\s*jsdebug=([^;]*)');
  var debugCookie = value ? unescape(value[1]) : false;
  if(window.location.href.indexOf("jsdebug=true")>0 || debugCookie=='true') dbug.enable();
  if(debugCookie=='true')dbug.log('debugging cookie enabled');
  if(window.location.href.indexOf("jsdebugCookie=true")>0){
    dbug.cookie();
    if(!dbug.enabled)dbug.enable();
  }
  if(window.location.href.indexOf("jsdebugCookie=false")>0)dbug.disableCookie();
}

/*
---

name: Form.Validator.EasyUrl

description: A url validator that adds the http:// for the user

requires:
 - More/Form.Validator

provides: [Form.Validator.EasyUrl]

...
*/

Form.Validator.add('easy-url', {
  errorMsg: Form.Validator.getMsg.pass('url'),
  test: function(element){
    if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
    if (!(/^(https?|ftp|rmtp|mms)/).test(element.get('value'))) element.set('value', 'http://' + element.get('value'));
    return Form.Validator.getValidator('validate-url').test(element);
  }
});
/*
---

name: Form.Validator.NoSpaces

description: A url validator that does not allow spaces

requires:
 - More/Form.Validator

provides: [Form.Validator.NoSpaces]

...
*/



Form.Validator.add('no-spaces', {
  errorMsg: Form.Validator.getMsg.pass('no-spaces'),
  test: function(element){
    // remove leading and trailing whitespace
    element.set('value', element.get('value').trim());
    return Form.Validator.getValidator('IsEmpty').test(element) || !(/\s/).test(element.get('value'));
  }
});

Locale.define('en-US', 'FormValidator', {

  'no-spaces': 'No spaces, tabs, or line breaks are allowed in this field.'

});
/*
---

name: Form.Validator.Range

description: Provides min and max validators (for validating integers).

requires:
 - More/Form.Validator

provides: [Form.Validator.Range]

...
*/

Form.Validator.addAllThese([

  ['min', {
    errorMsg: function(element, props){
      if (isNaN(element.get('value').toInt())) return Form.Validator.getMsg.pass('numeric');

      if (typeOf(props.min) != 'null'){
        return Form.Validator.getMsg('min').substitute({min: props.min});
      } else {
        return '';
      }
    },
    test: function(element, props){
      if (Form.Validator.getValidator('IsEmpty').test(element)) return true;

      if (typeOf(props.min) != 'null'){
        var value = element.get('value').toInt()
        if (isNaN(value)) return false;

        return value >= props.min;
      } else {
        return true;
      }
    }
  }],
  ['max', {
    errorMsg: function(element, props){
      if (isNaN(element.get('value').toInt())) return Form.Validator.getMsg.pass('numeric');

      if (typeOf(props.max) != 'null'){
        return Form.Validator.getMsg('max').substitute({max: props.max});
      } else {
        return '';
      }
    },
    test: function(element, props){
      if (Form.Validator.getValidator('IsEmpty').test(element)) return true;

      if (typeOf(props.max) != 'null'){
        var value = element.get('value').toInt()
        if (isNaN(value)) return false;

        return value <= props.max;
      } else {
        return true;
      }
    }
  }]
]);

Locale.define('en-US', 'FormValidator', {
  'min':   'Please enter a number greater at least {min}.',
  'max':   'Please enter a number no greater than {max}.'
});
/*
---

name: Form.Validator.Tag

description: Validates the entry is a comma separated list of space-less alpha-numeric strings allowing for underscores and dashes.

requires:
 - More/Form.Validator

provides: [Form.Validator.Tag]

...
*/

Form.Validator.add('tag', {
  errorMsg: Form.Validator.getMsg.pass('tag'),
  test: function(element){
    element.set('value', element.get('value').replace(/,( +)?$/,''));
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-z0-9\-\_]*$/).test(element.get('value'));
  }
});

Form.Validator.add('tags', {
  errorMsg: Form.Validator.getMsg.pass('tag'),
  test: function(element){
    element.set('value', element.get('value').replace(/,( +)?$/,''));
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-z0-9\-\_]+(,( +)?[a-z0-9\-\_]+)*$/).test(element.get('value'));
  }
});


Locale.define('en-US', 'FormValidator', {

  'tag': 'no spaces, only letters or numbers, underscores and dashes allowed. e.g. "foo", "bar", "foo-bar"',
  'tags': 'Comma separated list of tags: no spaces, only letters or numbers, underscores and dashes allowed. e.g. "foo, bar, foo-bar"'

});
/*
---
name: Behavior.Events
description: Allows for the triggering of delegators when classes instantiated by Behavior fire arbitrary events.
requires: [/Behavior, /Delegator]
provides: [Behavior.Events]
...
*/

/*

	<div data-behavior="addEvent" data-addevent-options="
		'events': {
			'.foo::BehaviorName': {
				'show': [
					{
						'.bar::addClass': {
							'class': 'hide',
							'if': {
								'self::hasClass': 'baz'
							}
						}
					},
					{
						'.biz::removeClass': {
							'class': 'hide',
							'if': {
								'eventArguments[1]': true  // triggers if the 2nd argument passed to the onShow event == true
							}
						}
					},
					{
						'.boz::removeClass': {
							'class': 'hide',
							'if': {
								'instance.now': 0   // triggers if the instance returned by BehaviorName has a 'now' property == 0
							}
						}
					},
					{
						'.boz::removeClass': {
							'class': 'hide',
							'if': {
								'instance.getNow()': 0  // triggers if the instance returned by BehaviorName has a `getNow`
							}                         // method that, when invoked with no arguments, == 0
						}
					},
					{
						'.buz::removeClass': {
							'class': 'hide',
							'if': {
								'instance.getNow()': 0,  // triggers if the instance returned by BehaviorName has a `getNow` method
								'arguments': ['foo']     // that returns 0 when invoked with the argument 'foo' (i.e. instance.getNow('foo') == 0)
							}
						}
					}
				]
			}
		}
	"></div>

*/
(function(){

	var reggies = {
		eventArguments: /^eventArguments/,
		eventArgumentIndex: /.*\[(.*)\]/,
		instanceMethod: /^instance\.([a-zA-Z].*)\(/,
		instanceProperty: /^instance\./
	};

	var parseConditional = function(element, api, conditional, instance, eventArguments){
		var result = Object.every(conditional, function(value, key){
			// key == "eventArguments[1]"
			if (key.match(reggies.eventArguments)){
				var index = key.match(reggies.eventArgumentIndex)[1].toInt();
				// index == 1
				return eventArguments[index] == value;
			}
			// key == instance.foo()
			if (key.match(reggies.instanceMethod)){
				var method = key.match(reggies.instanceMethod)[1];
				if (instance[method]){
					if (conditional['arguments']) return instance[method].apply(instance, conditional['arguments']) == value;
					else return instance[method]() == value;
				}

			}
			// key == instance.foo
			if (key.match(reggies.instanceProperty)){
				return instance[key.split('.')[1]] == value;
			}
			return Delegator.verifyTargets(element, conditional, api);
		});
		return result;
	};

	Behavior.addGlobalFilter('addEvent', {
		setup: function(element, api){
			api.addEvent('apply:once', function(){
				var events = api.getAs(Object, 'events');
				Object.each(events, function(eventsToAdd, key){
					var selector = key.split('::')[0];
					var behaviorName = key.split('::')[1];
					var target = Behavior.getTarget(element, selector);
					if (!target) return api.warn('Could not find element at ' + selector + ' to add event to ' + behaviorName);
					var instance = target.getBehaviorResult(behaviorName);
					if (!instance) return api.warn('Could not find instance of ' + behaviorName + ' for element at ' + selector);
					Object.each(eventsToAdd, function(triggers, eventName){
						instance.addEvent(eventName, function(){
							var eventArgs = arguments;
							triggers.each(function(trigger){
								Object.each(trigger, function(options, delegatorTarget){
									var valid = true;
									if (options['if'] && !parseConditional(element, api, options['if'], instance, eventArgs)) valid = false;
									if (options['unless'] && parseConditional(element, api, options['unless'], instance, eventArgs)) valid = false;

									if (valid){
										// we've already tested these, so remove
										options['_if'] = options['if'];
										options['_unless'] = options['unless'];
										delete options['if'];
										delete options['unless'];
										// invoke the trigger
										api.getDelegator()._invokeMultiTrigger(element, null, delegatorTarget, options);
										// put them back
										options['if'] = options['_if'];
										options['unless'] = options['_unless'];
										delete options['_if'];
										delete options['_unless'];
									}
								});
							});
						});
					});
				});
			});
			return element;
		}
	});
})();
/*
---
name: Behavior.Startup
description: Invokes delegators on startup when specified conditions are met.
requires: [/Behavior, /Delegator, /Delegator.verifyTargets]
provides: [Behavior.Startup]
...
*/
(function(){
	Behavior.addGlobalFilter('Startup', {
		setup: function(el, api){
			//get the delegators to set up
			var delegators = api.get('delegators');
			if (delegators){
				Object.each(delegators, function(conditional, delegator){
					var timer =(function(){
						//if any were true, fire the delegator ON THIS ELEMENT
						if (Delegator.verifyTargets(el, conditional, api)) {
							api.getDelegator().trigger(delegator, el);
						}
					}).delay(conditional.delay || 0)
					api.onCleanup(function(){
						clearTimeout(timer);
					});
				});
			}
		}
	});
})();
/*
---
name: Behavior.Trigger
description: Because Delegator is inefficient for mouse over/out events, this behavior
             allows you to invoke delegator triggers on elements when they occur using
             normal event monitoring.
requires: [/Behavior, /Delegator]
provides: [Behavior.Trigger]
...
*/

/*

  <div data-behavior="Trigger"
      data-trigger-options="
        'triggers': [
          {
            'events': ['mouseover', 'focus'], //which events to monitor
            'targets': {
              'div.monitorMouseOver': { //elements whose events we monitor
                'div.foo::addClass': { //selector for elements to invoke trigger :: trigger name
                  'class': 'foo', //api options for trigger
                  'if': {
                    'div.bar::hasClass': ['boo']
                  }
                }
              }
            }
          }
        ]
      "
  >...</div>

  on mouse over of any div.foo, the addClass trigger is invoked
  IF div.bar has the class .boo.

*/

Behavior.addGlobalFilter('Trigger', {

  requireAs: {
    triggers: Array
  },

  setup: function(element, api){
    var delegator = api.getDelegator();
    if (!delegator) api.fail('MouseTrigger behavior requires that Behavior be connected to an instance of Delegator');

    api.getAs(Array, 'triggers').each(function(triggerConfig){



      // get the configuration for mouseover/mouseout
      Object.each(triggerConfig.targets, function(triggers, selector){
        // get the selector for the elements to monitor
        var eventTargets = Behavior.getTargets(element, selector);
        // loop over the elements that match
        eventTargets.each(function(eventTarget){
          // add our mouse event on each target

          var eventHandler = function(event){
            // when the user mouses over/out, loop over the triggers
            Object.each(triggers, function(config, trigger){
              // split the trigger name - '.foo::addClass' > {name: addClass, selector: .foo}
              trigger = delegator._splitTriggerName(trigger);
              if (!trigger) return;

              // iterate over the elements that match that selector using the event target as the root
              Behavior.getTargets(eventTarget, trigger.selector).each(function(target){
                var api;
                // create an api for the trigger/element combo and set defaults to the config (if config present)
                if (config) api = delegator._getAPI(target, trigger).setDefault(config);
                // invoke the trigger
                delegator.trigger(trigger.name, target, event, true, api);
              });
            });
          };

          Array.from(triggerConfig.events).each(function(eventType){
            eventType = {mouseover: 'mouseenter', mouseout: 'mouseleave'}[eventType] || eventType;
            eventTarget.addEvent(eventType, eventHandler);
          });
        });
      });

    });
  }
});