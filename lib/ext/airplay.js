'use strict';
var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api, root) {
  api.on('ready', function() {
    var el = common.find('video.fp-engine', root)[0];
    if (!el) return;
    el.setAttribute('x-webkit-airplay', 'allow');

    if (!window.WebKitPlaybackTargetAvailabilityEvent) return;
    el.addEventListener('webkitplaybacktargetavailabilitychanged', function(ev) {
      if (ev.availability !== 'available') return;
      var btnContainer = common.find('.fp-header', root)[0];
      common.find('.fp-airplay', btnContainer).forEach(common.removeNode);
      var trigger = common.createElement('a', { 'class': 'fp-airplay fp-icon', title: 'Play on AirPlay device'})
      btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);

    });

    el.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', function() {
      var trigger = common.find('.fp-airplay', root)[0];
      if (!trigger) return;
      common.toggleClass(trigger, 'fp-active', el.webkitCurrentPlaybackTargetIsWireless);
    });

  });

  bean.on(root, 'click', '.fp-airplay', function(ev) {
    ev.preventDefault();
    var video = common.find('video.fp-engine', root)[0];
    video.webkitShowPlaybackTargetPicker();
  });


});
