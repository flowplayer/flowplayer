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
      obj.trigger('foo', [5 ,'asdf']);
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

  describe('.trigger', function() {
    it('should trigger events on the elem', function(cb) {
      elem.addEventListener('click', function() { cb(); });
      obj.trigger('click');
    });
    it('should pass args so that they are readable by on', function(cb) {
      obj.on('foo', function(ev, bar, baz) {
        assert(bar === 'bar');
        assert(baz === 'baz');
        cb();
      });
      obj.trigger('foo', ['bar', 'baz']);
    });
    it('should return the event', function() {
      var ev = obj.trigger('foo', null, true);
      assert(ev.type === 'foo');
    });
    it('should allow preventing default', function() {
      obj.on('foo', function(ev) { ev.preventDefault(); });
      var ev = obj.trigger('foo', null, true);
      assert(ev.defaultPrevented);
    });
  });

  describe('.off', function() {
    it('should stop listening to events', function() {
      var counter = 0;
      obj.on('foo', function(ev) { counter++; });
      obj.trigger('foo');
      obj.off('foo');
      obj.trigger('foo');
      assert(counter === 1);
    });
    it('namespaced should only stop namespaced listeners', function() {
      var fooCounter = 0,
          fooBarCounter = 0;
      obj.on('foo', function(ev) { fooCounter++; });
      obj.on('foo.bar', function(ev) { fooBarCounter++; });
      obj.trigger('foo');
      obj.off('foo.bar');
      obj.trigger('foo');
      assert(fooCounter === 2);
      assert(fooBarCounter === 1);
    });
    it('should remove also namespaced listeners', function() {
      var fooCounter = 0,
          fooBarCounter = 0,
          fooBazCounter = 0;
      obj.on('foo', function(ev) { fooCounter++; });
      obj.on('foo.bar', function(ev) { fooBarCounter++; });
      obj.on('foo.baz', function(ev) { fooBazCounter++; });
      obj.trigger('foo');
      obj.off('foo');
      obj.trigger('foo');
      assert(fooCounter === 1);
      assert(fooBarCounter === 1);
      assert(fooBazCounter === 1);
    });
    it('called without event type should remove all within namespace', function() {
      var fooCounter = 0,
          fooBCounter = 0;
          barCounter = 0;
      obj.on('foo.a', function() { fooCounter++; });
      obj.on('bar.a', function() { barCounter++; });
      obj.on('foo.b', function() { fooBCounter++; });
      obj.trigger('foo');
      obj.trigger('bar');
      obj.off('.a');
      obj.trigger('foo');
      obj.trigger('bar');
      assert(fooCounter === 1);
      assert(barCounter === 1);
      assert(fooBCounter === 2);
    });
  });
  describe('.one', function() {
    it('should cleanup the handler after running', function() {
      var fooCounter = 0,
          barCounter = 0;
      obj.one('foo', function() { fooCounter++; });
      obj.on('foo', function() { barCounter++; });
      obj.trigger('foo');
      obj.trigger('foo');
      assert(fooCounter === 1);
      assert(barCounter === 2);
    });
  });
});

