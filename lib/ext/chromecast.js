'use strict';
var flowplayer = require('../flowplayer')
  , common = require('../common')
  , scriptjs = require('scriptjs');



flowplayer(function(api, root) {
  scriptjs('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
  window['__onGCastApiAvailable'] = function(loaded) {
    if (!loaded) return;
    initialize();
  };

  function initialize() {
    var btnContainer = common.find('.fp-buttons', root)[0];
    common.find('.fp-chromecast', btnContainer).forEach(common.removeNode);
    var trigger = common.createElement('a', { 'class': 'fp-chromecast', title: 'Play on Cast device'})
      , btn = common.createElement('span', { 'class': 'fp-chromecast-button' });
    trigger.appendChild(btn);
    btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);

  }

});
