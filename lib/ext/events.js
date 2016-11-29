'use strict';
/**
 * Mimimal jQuery-like event emitter implementation
 */
module.exports = function(obj, elem) {
  if (!elem) elem = document.createElement('div'); //In this case we always want to trigger (Custom)Events on dom element
  var handlers = {}, eventArguments = {};

  var listenEvent = function(type, hndlr, disposable) {
    var actualEvent = type.split('.')[0]; //Strip namespace
    var internalHandler = function(ev) {
      if (disposable) {
        elem.removeEventListener(actualEvent, internalHandler);
        handlers[type].splice(handlers[type].indexOf(internalHandler), 1);
      }
      var args = [ev].concat(eventArguments[ev.timeStamp + ev.type] || []);
      if (hndlr) hndlr.apply(undefined, args);
    };
    elem.addEventListener(actualEvent, internalHandler);

    //Store handlers for unbinding
    if (!handlers[type]) handlers[type] = [];
    handlers[type].push(internalHandler);
  };

  obj.on = obj.bind = function(typ, hndlr) {
    var types = typ.split(' ');
    types.forEach(function(type) {
      listenEvent(type, hndlr);
    });
    return obj; //for chaining
  };

  obj.one = function(typ, hndlr) {
    var types = typ.split(' ');
    types.forEach(function(type) {
      listenEvent(type, hndlr, true);
    });
    return obj;
  };

  // Function to check if all items in toBeContained array are in the containing array
  var containsAll = function(containing, toBeContained) {
    return toBeContained.filter(function(i) {
      return containing.indexOf(i) === -1;
    }).length === 0;
  };


  obj.off = obj.unbind = function(typ) {
    var types = typ.split(' ');
    types.forEach(function(type) {
      var typeNameSpaces = type.split('.').slice(1),
          actualType = type.split('.')[0];
      Object.keys(handlers).filter(function(t) {
        var handlerNamespaces = t.split('.').slice(1);
        return (!actualType || t.indexOf(actualType) === 0) && containsAll(handlerNamespaces, typeNameSpaces);
      }).forEach(function(t) {
        var registererHandlers = handlers[t],
            actualEvent = t.split('.')[0];
        handlers[t] = registererHandlers.filter(function(hndlr) {
          elem.removeEventListener(actualEvent, hndlr);
          return false;
        });
      });
    });
    return obj;
  };

  obj.trigger = function(typ, args, returnEvent) {
    if (!typ) return;
    args = (args || []).length ? args || [] : [args];
    var event = document.createEvent('Event'), typStr;
    typStr = typ.type || typ;
    event.initEvent(typStr, false, true);
    if (Object.defineProperty) event.preventDefault = function() {
      Object.defineProperty(this, 'defaultPrevented', { get: function() { return true; } });
    };
    eventArguments[event.timeStamp + event.type] = args;
    elem.dispatchEvent(event);
    return returnEvent ? event : obj;
  };
};


module.exports.EVENTS = [
  'beforeseek',
  'disable',
  'error',
  'finish',
  'fullscreen',
  'fullscreen-exit',
  'load',
  'mute',
  'pause',
  'progress',
  'ready',
  'resume',
  'seek',
  'speed',
  'stop',
  'unload',
  'volume',
  'boot',
  'shutdown'
];
