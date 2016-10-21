'use strict';

var flowplayer = require('../flowplayer')
  , common = require('../common');

flowplayer(function(api) {
  api.shareUrl = function() {
    var title = encodeURIComponent(api.video.title || (common.find('title')[0] || {}).innerHTML || 'Flowplayer video')
      , conf = encodeURIComponent(btoa(JSON.stringify(api.conf)))
      , redirect = encodeURIComponent(window.location.toString());
    return 'https://flowplayer.org/s/?t=' + title + '&c=' + conf + '&r=' + redirect;
  };
});
