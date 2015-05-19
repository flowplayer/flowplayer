'use strict';
var bean =  require('bean');
/**
 * Mimimal jQuery-like event emitter implementation
 */
module.exports = function(obj, elem) {
  var identity = function(i) { return i; };
  if (!elem) elem = document.createElement('div'); //In this case we always want to trigger (Custom)Events on dom element

  obj.on = obj.bind = function(typ, hndlr) {
    var args = [elem].concat(Array.prototype.map.call(arguments, identity));
    bean.on.apply(undefined, args);
    return obj;
  };

  obj.one = function(typ, hndlr) {
    return obj;
  };

  obj.off = obj.unbind = function() {
    var args = [elem].concat(Array.prototype.map.call(arguments, identity));
    bean.off.apply(undefined, args);
    return obj;
  };

  obj.trigger = function(typ, args, returnEvent) {
    if (typ && typ.type) typ = typ.type;
    if (typeof typ !== 'string') return obj;
    var event = document.createEvent('Event');
    event.initEvent(typ, true, true);
    bean.fire(elem, typ, [event].concat(args));
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
