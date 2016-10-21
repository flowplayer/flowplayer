'use strict';

var flowplayer = require('../flowplayer')
  , common = require('../common')
  , extend = require('extend-object');

flowplayer(function(api) {
  api.shareUrl = function(directEmbed) {
    var title = encodeURIComponent(api.video.title || (common.find('title')[0] || {}).innerHTML || 'Flowplayer video')
      , conf = encodeURIComponent(btoa(JSON.stringify(extend({}, api.conf, api.extensions))))
      , redirect = encodeURIComponent(window.location.toString())
      , baseUrl = directEmbed ? 'https://flowplayer.org/e/' : 'https://flowplayer.org/s/';
    return baseUrl + '?t=' + title + '&c=' + conf + '&r=' + redirect;
  };
});
