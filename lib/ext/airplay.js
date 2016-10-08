'use strict';
var flowplayer = require('../flowplayer')
  , common = require('../common');

flowplayer(function(api, root) {
  api.on('ready', function() {
    var el = common.find('video.fp-engine', root)[0];
    el.setAttribute('x-webkit-airplay', 'allow');

    if (!window.WebKitPlaybackTargetAvailabilityEvent) return;
    el.addEventListener('webkitplaybacktargetavailabilitychanged', function(ev) {
      if (ev.availability !== 'available') return;
      var btnContainer = common.find('.fp-header', root)[0];
      common.find('.fp-airplay', btnContainer).forEach(common.removeNode);
      var trigger = common.createElement('a', { 'class': 'fp-airplay fp-icon', title: 'Play on AirPlay device'})
      btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);

    });

  });


});
