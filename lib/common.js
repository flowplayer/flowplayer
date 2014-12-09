var common = module.exports = {},
    ClassList = require('class-list'),
    Sizzle = require('sizzle'),
    $ = window.jQuery;

common.removeNode = function(el) {
  if (!el || !el.parentNode) return;
  el.parentNode.removeChild(el);
};

common.css = function(el, property, value) {
  if (el && !el.style.setProperty) { // Once again IE8
    if (!$) throw new Error('jQuery is needed for legacy browsers');
    return value ? $(el).css(property, value) : $(el).css(property);
  }
  if (typeof property === 'object') {
    return Object.keys(property).forEach(function(key) {
      common.css(el, key, property[key]);
    });
  }
  if (typeof value !== 'undefined') {
    if (value === '') return el ? el.style.removeProperty(property)  : undefined;
    return el ? el.style.setProperty(property, value) : undefined;
  }
  return el ? window.getComputedStyle(el, null).getPropertyValue(property) : undefined;
};

common.createElement = function(tag, attributes, innerHTML) {
  try {
    var el = document.createElement(tag);
    for (var key in attributes) {
      if (!attributes.hasOwnProperty(key)) continue;
      if (key === 'css') {
        common.css(el, attributes[key]);
      } else {
        common.attr(el, key, attributes[key]);
      }
    }
    el.innerHTML = innerHTML || '';
    return el;
  } catch (e) {
    if (!$) throw e;
    return $('<' + tag + '>' + innerHTML + '</' + tag + '>').attr(attributes)[0];
  }
};

common.toggleClass = function(el, cls, flag) {
  if (!el) return;
  var classes = ClassList(el);
  if (typeof flag === 'undefined') classes.toggle(cls);
  else if (flag) classes.add(cls);
  else if (!flag) classes.remove(cls);
};

common.addClass = function(el, cls) {
  return common.toggleClass(el, cls, true);
};

common.removeClass = function(el, cls) {
  return common.toggleClass(el, cls, false);
};

common.append = function(par, child) {
  par.appendChild(child);
  return par;
};

common.appendTo = function(child, par) {
  common.append(par, child);
  return child;
}

common.prepend = function(par, child) {
  par.insertBefore(child, par.firstChild);
};


// Inserts `el` after `child` that is child of `par`
common.insertAfter = function(par, child, el) {
  if (child == common.lastChild(par)) par.appendChild(el);
  var childIndex = Array.prototype.indexOf.call(par.children, child);
  par.insertBefore(el, par.children[childIndex + 1]);
};

common.html = function(elms, val) {
  elms = elms.length ? elms : [elms];
  elms.forEach(function(elm) {
    elm.innerHTML = val;
  });
};


common.attr = function(el, key, val) {
  if (key === 'class') key = 'className';
  if (common.hasOwnOrPrototypeProperty(el, key)) {
    try {
      el[key] = val;
    } catch (e) { // Most likely IE not letting set property
      if ($) {
        $(el).attr(key, val);
      } else {
        throw e;
      }
    }
  } else {
    el.setAttribute(key, val);
  }
  return el;
};

common.prop = function(el, key, val) {
  if (typeof val === 'undefined') {
    return el && el[key];
  }
  el[key] = val;
};

common.offset = function(el) {
  return el.getBoundingClientRect();
};

common.width = function(el, val) {
  if (val) return el.style.width = (''+val).replace(/px$/, '') + 'px';
  return common.offset(el).width;
};

common.height = function(el, val) {
  if (val) return el.style.height = (''+val).replace(/px$/, '') + 'px';
  return common.offset(el).height;
};

common.lastChild = function(el) {
  return el.children[el.children.length - 1];
};

common.hasParent = function(el, parentSelector) {
  var parent = el.parentElement;
  while (parent) {
    if (Sizzle.matchesSelector(parent, parentSelector)) return true;
    parent = parent.parentElement;
  }
  return false;
};

common.createAbsoluteUrl = function(url) {
  return common.createElement('a', {href: url}).href; // This won't work on IE7
};

common.xhrGet = function(url, successCb, errorCb) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState !== 4) return;
    if (this.status >= 400) return errorCb();
    successCb(this.responseText);
  };
  xhr.open('get', url, true);
  xhr.send();
};



//Hacks
common.browser = {
  webkit: 'WebkitAppearance' in document.documentElement.style
};

common.getPrototype = function(el) {
  if (!Object.getPrototypeOf) return el.__proto__;
  return Object.getPrototypeOf(el);
};

common.hasOwnOrPrototypeProperty = function(obj, prop) {
  var o = obj;
  while (o) {
    if (Object.prototype.hasOwnProperty.call(o, prop)) return true;
    o = common.getPrototype(o);
  }
  return false;
};
