'use strict';

var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api, root) {
  var c = api.conf;

  if (c.share === false || !c.facebook) return;

  api.facebook = function() {
    var left
      , top
      , width = 550
      , height = 420
      , winHeight = screen.height
      , winWidth = screen.width
      , windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes'
      , shareUrl = typeof c.facebook === 'string' ? c.facebook : window.location.toString();
    left = Math.round((winWidth / 2) - (width / 2));
    top = 0;
    if (winHeight > height) {
      top = Math.round((winHeight / 2) - (height / 2));
    }
    window.open(
      'https://www.facebook.com/sharer.php?s=100&p[url]=' + encodeURIComponent(shareUrl),
      'sharer',
      windowOptions + ',width=' + width + ',height=' + height + ',left=' + left + ',top=' + top
    );
  };

  var btnContainer = common.find('.fp-share-menu', root)[0]
    , trigger = common.createElement('a', { "class": "fp-icon fp-facebook"}, 'Facebook');

  common.append(btnContainer, trigger);

  bean.on(root, 'click', '.fp-facebook', function() {
    api.facebook();
  });
});
