'use strict';

var flowplayer = require('../flowplayer');

flowplayer(function(api) {
  // https://dev.twitter.com/web/intents
  api.facebook = function() {
    var left
      , top
      , width = 550
      , height = 420
      , winHeight = screen.height
      , winWidth = screen.width
      , windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes'
      , shareUrl = api.shareUrl();
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
});
