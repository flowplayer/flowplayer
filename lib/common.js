var common = module.exports = {},
    ClassList = require('class-list');

common.removeNode = function(el) {
  if (!el || !el.parentNode) return;
  el.parentNode.removeChild(el);
};

common.css = function(el, property, value) {
  if (typeof value !== 'undefined') {
    return el.style[property] = value;
  }
  return window.getComputedStyle(el, null).getPropertyValue(property);
};

common.createElement = function(tag, attributes, innerHTML) {
  var el = document.createElement(tag);
  for (var key in attributes) {
    if (!attributes.hasOwnProperty(key)) continue;
    el.setAttribute(key, attributes[key]);
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
