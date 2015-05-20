'use strict';
var bean =  require('bean');
/**
 * Mimimal jQuery-like event emitter implementation
 */

function typStr(typ) {
  if (typ && typ.type) return typStr(typ.type);
  var parts = typ.split(' ');
  if (parts.length > 1) return parts.map(typStr).join(' ');
  var re = /^unload(\.[a-z])*/;
  if (re.test(typ)) return typ.replace(re, "fpunload$1"); //Special case for unload
  return typ;
}

module.exports = function(obj, elem) {
  var identity = function(i) { return i; };
  if (!elem) elem = {}; //In this case we always want to trigger (Custom)Events on dom element

  obj.on = obj.bind = function(typ, hndlr) {
    bean.on(elem, typStr(typ), hndlr);
    return obj;
  };

  obj.one = function(typ, hndlr) {
    bean.one(elem, typStr(typ), hndlr);
    return obj;
  };

  obj.off = obj.unbind = function() {
    var args = [elem].concat(Array.prototype.map.call(arguments, identity));
    args[1] = typStr(args[1]);
    bean.off.apply(undefined, args);
    return obj;
  };

  obj.trigger = function(typ, args, returnEvent) {
    var actualTyp = typStr(typ);
    if (typeof actualTyp !== 'string') return obj;
    var event = document.createEvent('Event');
    event.initEvent(typ, true, true);
    bean.fire(elem, actualTyp, [event].concat(args));
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
