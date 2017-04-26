var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api, root) {
  api.showMenu = function(menu, triggerElement) {
    var ui = common.find('.fp-ui', root)[0];
    common.toggleClass(menu, 'fp-active', true);
    setTimeout(function() {
      bean.one(document, 'click', function() {
        api.hideMenu(menu);
      });
    });
    var coordinates = triggerElement;
    if (triggerElement && triggerElement.tagName) {
      coordinates = {
        left: common.offset(triggerElement).left,
        rightFallbackOffset: common.width(triggerElement),
        top: common.offset(triggerElement).top + common.height(triggerElement)
      };
    }
    if (!coordinates) return common.css(menu, 'top', 'auto');
    coordinates.rightFallbackOffset = coordinates.rightFallbackOffset || 0;
    var top = coordinates.top - common.offset(ui).top
      , left = coordinates.left - common.offset(ui).left
    if (common.width(menu) + left > common.width(ui)) left = left - common.width(menu) + coordinates.rightFallbackOffset;
    if (common.height(menu) + top > common.height(ui)) top = top - common.height(menu);
    common.css(menu, {
      top: top + 'px',
      left: left + 'px'
    });
  };

  api.hideMenu = function(menu) {
    common.toggleClass(menu, 'fp-active', false);
    common.css(menu, {
      top: '-9999em'
    });
  };
});
