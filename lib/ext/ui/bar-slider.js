var bean = require('bean')
  , common = require('../../common');

function slider(root, opts) {
  opts = opts || {};

  var activeClass = opts.activeClass || 'fp-color'
    , inactiveClass = opts.inactiveClass || 'fp-grey'
    , childSelector = opts.childSelector || 'em'
    , rtl = !!opts.rtl
    , disabled = false;

  var totalBars = common.find(childSelector, root).length;

  var api = {
    unload: function() {
      bean.off(root, '.barslider');
    },
    slide: function(to, trigger) {
      common.find(childSelector, root).forEach(function(bar, idx) {
        var active = to > idx/totalBars;
        common.toggleClass(bar, activeClass, active);
        common.toggleClass(bar, inactiveClass, !active);
      });
      if (trigger) bean.fire(root, 'slide', [ to ]);
    },
    disable: function(flag) {
      disabled = flag;
    }
  };

  bean.on(root, 'mousedown.sld touchstart.sld', function(ev) {
    ev.preventDefault();
    if (disabled) return;
    api.slide(getMouseValue(ev), true);

    bean.on(root, 'mousemove.sld touchmove.sld', function(ev) {
      ev.preventDefault();
      api.slide(getMouseValue(ev), true);
    });

    bean.one(document, 'mouseup.sld touchup.sld', function() {
      bean.off(root, 'mousemove.sld touchmove.sld');
    });
  });

  return api;

  function getMouseValue(ev) {
    var pageX = ev.pageX || ev.clientX
      , offset = common.offset(root)
      , size = common.width(root);


    if (!pageX && ev.originalEvent && ev.originalEvent.touches && ev.originalEvent.touches.length) {
      pageX = ev.originalEvent.touches[0].pageX;
    }
    var delta = pageX - offset.left;
    delta = Math.max(0, Math.min(size, delta));

    var value = delta / size;
    if (rtl) value = 1 - value;
    return value;
  }
}


module.exports = slider;
