'use strict';

var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api, root) {
  var c = api.conf;

  if (c.share === false || c.twitter === false) return;


  // https://dev.twitter.com/web/intents
  api.tweet = function() {
    var left
      , top
      , width = 550
      , height = 420
      , winHeight = screen.height
      , winWidth = screen.width
      , windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes'
      , shareUrl = typeof c.twitter === 'string' ? c.twitter : api.shareUrl();
    left = Math.round((winWidth / 2) - (width / 2));
    top = 0;
    if (winHeight > height) {
      top = Math.round((winHeight / 2) - (height / 2));
    }
    window.open(
      'https://twitter.com/intent/tweet?url=' + encodeURIComponent(shareUrl),
      'intent',
      windowOptions + ',width=' + width + ',height=' + height + ',left=' + left + ',top=' + top
    );
  };

  var btnContainer = common.find('.fp-share-menu', root)[0]
    , trigger = common.createElement('a', { "class": "fp-icon fp-twitter"}, 'Twitter');

  common.append(btnContainer, trigger);

  bean.on(root, 'click', '.fp-twitter', function() {
    api.tweet();
  });
});
