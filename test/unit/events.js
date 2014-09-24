var events = require('../../lib/ext/events'),
    assert = require('assert');


describe('lib/ext/events.js', function() {
  var obj, elem;
  beforeEach(function() {
    obj = {};
    elem = document.createElement('div');
    events(obj, elem);
  });

  var dispatchEvent = function(evType, typ, detail) {
    var ev = document.createEvent(evType);
    switch (evType) {
      case 'CustomEvent':
        ev.initCustomEvent(typ, false, false, detail);
        break;
      default:
        ev.initEvent(typ, true, false);
    }
    elem.dispatchEvent(ev);
  };

  var dispatchMouseEvent = function(typ) {
    dispatchEvent('MouseEvent', typ);
  };

  describe('.on', function() {
    it('should attach event handler on elem', function(cb) {
      obj.on('click', function() {
        cb();
      });
      dispatchMouseEvent('click');
    });
    it('should strip out the namespace', function(cb) {
      obj.on('click.foo', function() {
        cb();
      });
      dispatchMouseEvent('click');
    });
    it('should listen to custom events', function(cb) {
      obj.on('foo', function() {
        cb();
      });
      dispatchEvent('CustomEvent', 'foo');
    });
    it('should pass args to event handler', function(cb) {
      obj.on('foo', function(ev, ding, dong) {
        assert(ev.type === 'foo');
        assert(ding === 5);
        assert(dong === 'asdf');
        cb();
      });
      dispatchEvent('CustomEvent', 'foo', {args: [5, 'asdf']});
    });
    it('should attach multiple handlers', function(cb) {
      var counter = 0;
      obj.on('foo bar', function() {
        counter++;
        if (counter == 2) cb();
      });
      dispatchEvent('CustomEvent', 'foo');
      dispatchEvent('CustomEvent', 'bar');
    });
  });
});

