var bean = require('bean')
  , common = require('../../common');

function slider(el, opts) {
  opts = opts || {};

  var activeClass = opts.activeClass || 'fp-color'
    , inactiveClass = opts.inactiveClass || 'fp-grey'
    , childSelector = opts.childSelector || 'em';

  var totalBars = common.find(childSelector, el).length;

  return {
    unload: function() {
      bean.off(el, '.barslider');
    },
    slide: function(to) {
      common.find(childSelector, el).forEach(function(bar, idx) {
        var active = to >= (idx+1)/totalBars;
        common.toggleClass(bar, activeClass, active);
        common.toggleClass(bar, inactiveClass, !active);
      });
    }
  };
}


module.exports = slider;
