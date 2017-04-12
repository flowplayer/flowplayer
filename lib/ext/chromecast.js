/* global chrome */
/* eslint-disable no-console */

'use strict';
var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean')
  , scriptjs = require('scriptjs');



flowplayer(function(api, root) {
  if (api.conf.chromecast === false) return;
  scriptjs('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
  window['__onGCastApiAvailable'] = function(loaded) {
    if (!loaded) return;
    initialize();
  };

  var conf = api.conf.chromecast || {}
    , session
    , timer
    , trigger;

  function initialize() {
    var applicationId, sessionRequest, apiConfig;
    applicationId = conf.applicationId || chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    sessionRequest = new chrome.cast.SessionRequest(applicationId);
    apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,
      sessionListener,
      receiverListener
    );
    chrome.cast.initialize(apiConfig, onInitSuccess, onError);
  }

  function sessionListener() {
    console.log('sessionListener');
  }

  function receiverListener(ev) {
    if (ev !== chrome.cast.ReceiverAvailability.AVAILABLE) return;
    createUIElements();
  }

  function onInitSuccess() {
    /* noop */
  }

  function onError() {
    console.log('onError');
  }

  function createUIElements() {
    var btnContainer = common.find('.fp-header', root)[0];
    common.find('.fp-chromecast', btnContainer).forEach(common.removeNode);
    common.find('.fp-chromecast-engine', root).forEach(common.removeNode);
    trigger = common.createElement('a', { 'class': 'fp-chromecast fp-icon', title: 'Play on Cast device'})
    btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);
    var chromeCastEngine = common.createElement('div', { 'class': 'fp-chromecast-engine' })
      , chromeCastStatus = common.createElement('p', { 'class': 'fp-chromecast-engine-status' })
      , chromeCastIcon = common.createElement('p', { 'class': 'fp-chromecast-engine-icon' });
    chromeCastEngine.appendChild(chromeCastIcon);
    chromeCastEngine.appendChild(chromeCastStatus);
    var engine = common.find('.fp-engine', root)[0];
    if (!engine) common.prepend(common.find('.fp-player', root)[0] || root, chromeCastEngine);
    else engine.parentNode.insertBefore(chromeCastEngine, engine);
  }

  function destroy() {
    clearInterval(timer);
    timer = null;
    api.release();
    common.toggleClass(root, 'is-chromecast', false);
    common.toggleClass(trigger, 'fp-active', false);
  }

  bean.on(root, 'click', '.fp-chromecast', function(ev) {
    ev.preventDefault();
    if (session) {
      api.trigger('pause', [api]);
      session.stop();
      session = null;
      destroy();
      return;
    }
    if (api.playing) api.pause();
    chrome.cast.requestSession(function(s) {
      session = s;
      var receiverName = session.receiver.friendlyName;
      common.html(common.find('.fp-chromecast-engine-status')[0], 'Playing on device ' + receiverName);
      var mediaInfo = new chrome.cast.media.MediaInfo(api.video.src);
      var request = new chrome.cast.media.LoadRequest(mediaInfo);
      session.loadMedia(request, onMediaDiscovered, function onMediaError() { });

      function onMediaDiscovered(media) {
        media.addUpdateListener(function(alive) {
          if (!session) return; // Already destoryed
          timer = timer || setInterval(function() {
            api.trigger('progress', [api, media.getEstimatedTime()]);
          }, 500);
          if (!alive) {
            destroy();
            api.trigger('finish', [api]);
          } else {
            common.toggleClass(root, 'is-chromecast', true);
            common.toggleClass(trigger, 'fp-active', true);
            api.hijack({
              pause: function() {
                media.pause();
              },
              resume: function() {
                media.play();
              },
              seek: function(time) {
                var req = new chrome.cast.media.SeekRequest();
                req.currentTime = time;
                media.seek(req);
              }
            });
          }
          var playerState = media.playerState;
          if (api.paused && playerState === chrome.cast.media.PlayerState.PLAYING) api.trigger('resume', [api]);
          if (api.playing && playerState === chrome.cast.media.PlayerState.PAUSED) api.trigger('pause', [api]);
          common.toggleClass(root, 'is-loading', playerState === chrome.cast.media.PlayerState.BUFFERING);
        });
      }
    }, function(err) {
      console.error('requestSession error', err);
    });
  });

});
