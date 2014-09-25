/**
 * Mimimal jQuery-like event emitter implementation
 */
module.exports = function(obj, elem) {
  if (!elem) elem = document.createElement('div'); //In this case we always want to trigger (Custom)Events on dom element
  var handlers = {};

  var listenEvent = function(type, hndlr) {
    var actualEvent = type.split('.')[0]; //Strip namespace
    var internalHandler = function(ev) {
      var args = [ev].concat(ev.detail && ev.detail.args || []);
      hndlr.apply(undefined, args);
    };
    elem.addEventListener(actualEvent, internalHandler);

    //Store handlers for unbinding
    if (!handlers[type]) handlers[type] = [];
    handlers[type].push(internalHandler);
  };

  obj.on = function(typ, hndlr) {
    var types = typ.split(' ');
    types.forEach(function(type) {
      listenEvent(type, hndlr);
    });
  };

  // Function to check if all items in toBeContained array are in the containing array
  var containsAll = function(containing, toBeContained) {
    return toBeContained.filter(function(i) {
      return containing.indexOf(i) === -1;
    }).length === 0;
  };


  obj.off = function(typ) {
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
  };

  obj.trigger = function(typ, args) {
    args = args || [];
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(typ, false, true, {args: args});
    elem.dispatchEvent(event);
    return event;
  };
};

