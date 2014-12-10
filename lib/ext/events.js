/**
 * Mimimal jQuery-like event emitter implementation
 */
module.exports = function(obj, elem) {
  if (!elem) elem = document.createElement('div'); //In this case we always want to trigger (Custom)Events on dom element
  var handlers = {};
  if (!document.createEvent) { // Workaround for IE8 etc
    if (!window.jQuery) throw new Error('jQuery is needed for legacy browsers');
    var $ = jQuery,
        $elem = $(elem);
    $.each(['bind', 'one', 'unbind'], function(i, key) {
      obj[key] = function(type, fn) {
        $elem[key](type, fn);
        return obj;
      };
    });

    obj.trigger = function(typ, args, returnEvent) {
      var ev = $.Event(typ);
      $elem.trigger(ev, args);
      return returnEvent ? ev : obj;
    };

    obj.on = obj.bind;
    obj.off = obj.unbind;
    return;
  }

  var listenEvent = function(type, hndlr, disposable) {
    var actualEvent = type.split('.')[0]; //Strip namespace
    var internalHandler = function(ev) {
      if (disposable) {
        elem.removeEventListener(type, internalHandler);
        handlers[type].splice(handlers[type].indexOf(internalHandler), 1);
      }
      var args = [ev].concat(ev.detail && ev.detail.args || []);
      hndlr && hndlr.apply(undefined, args);
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
        registererHandlers.forEach(function(hndlr) {
          elem.removeEventListener(actualEvent, hndlr);
          registererHandlers.splice(registererHandlers.indexOf(hndlr), 1);
        });
      });
    });
    return obj;
  };

  obj.trigger = function(typ, args, returnEvent) {
    if (!typ) return;
    args = (args || []).length ? args || [] : [args];
    var event = document.createEvent('CustomEvent'), typStr;
    if (typeof typ === 'string') typStr = typ;
    else {
      typStr = typ.type;
      delete typ.type;
      Object.keys(typ).forEach(function(key) {
        event[key] = typ[key];
      });
    }
    event.initCustomEvent(typStr, false, true, {args: args});
    elem.dispatchEvent(event);
    return returnEvent ? event : obj;
  };
};

