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
  el.innerHTML = innerHTML;
  return el;
};

common.toggleClass = function(el, cls, flag) {
  var classes = ClassList(el);
  if (flag) classes.add(cls);
  if (!flag) classes.remove(cls);
};
