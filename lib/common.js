var common = module.exports = {},
    ClassList = require('class-list'),
    Sizzle = require('sizzle');

common.removeNode = function(el) {
  if (!el || !el.parentNode) return;
  el.parentNode.removeChild(el);
};

common.css = function(el, property, value) {
  if (typeof property === 'object') {
    return Object.keys(property).forEach(function(key) {
      common.css(el, key, property[key]);
    });
  }
  if (typeof value !== 'undefined') {
    return el.style[property] = value;
  }
  return window.getComputedStyle(el, null).getPropertyValue(property);
};

common.createElement = function(tag, attributes, innerHTML) {
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
};

common.toggleClass = function(el, cls, flag) {
  var classes = ClassList(el);
  if (flag) classes.add(cls);
  if (!flag) classes.remove(cls);
};

common.append = function(par, child) {
  par.appendChild(child);
};

common.prepend = function(par, child) {
  par.insertBefore(child, par.firstChild);
};

common.html = function(elms, val) {
  elms = elms.length ? elms : [elms];
  elms.forEach(function(elm) {
    elm.innerHTML = val;
  });
};


common.attr = function(el, key, val) {
  if (el.hasOwnProperty(key)) {
    el[key] = val;
  } else {
    el.setAttribute(key, val);
  }
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

common.width = function(el) {
  return common.offset(el).width;
};

common.height = function(el) {
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
}

//Hacks
common.browser = {
  webkit: 'WebkitAppearance' in document.documentElement.style
};
