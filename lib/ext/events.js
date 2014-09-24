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

  obj.off = function(typ) {
    var types = typ.split(' ');
    types.forEach(function(type) {
      Object.keys(handlers).filter(function(t) {
        return t.indexOf(type) === 0;
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
};

