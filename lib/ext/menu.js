var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api) {
  api.showMenu = function(menu) {
    common.toggleClass(menu, 'fp-active', true);
    setTimeout(function() {
      bean.one(document, 'click', function() {
        api.hideMenu(menu);
      });
    });
  };

  api.hideMenu = function(menu) {
    common.toggleClass(menu, 'fp-active', false);
  };
});
