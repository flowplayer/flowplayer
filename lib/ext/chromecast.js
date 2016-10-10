/* global chrome */
/* eslint-disable no-console */

'use strict';
var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean')
  , scriptjs = require('scriptjs');



flowplayer(function(api, root) {
  scriptjs('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
  window['__onGCastApiAvailable'] = function(loaded) {
    if (!loaded) return;
    initialize();
  };

  var conf = api.conf.chromecast || {}
    , session
    , timer;

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
    var trigger = common.createElement('a', { 'class': 'fp-chromecast fp-icon', title: 'Play on Cast device'})
    btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);
    var chromeCastEngine = common.createElement('div', { 'class': 'fp-chromecast-engine' })
      , chromeCastStatus = common.createElement('p', { 'class': 'fp-chromecast-engine-status' })
      , chromeCastIcon = common.createElement('p', { 'class': 'fp-chromecast-engine-icon' });
    chromeCastEngine.appendChild(chromeCastIcon);
    chromeCastEngine.appendChild(chromeCastStatus);
    var engine = common.find('.fp-engine', root)[0];
    engine.parentNode.insertBefore(chromeCastEngine, engine);
  }

  bean.on(root, 'click', '.fp-chromecast', function(ev) {
    ev.preventDefault();
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
          timer = timer || setInterval(function() {
            api.trigger('progress', [api, media.getEstimatedTime()]);
          }, 500);
          if (!alive) {
            clearInterval(timer);
            timer = null;
            try { api.angine.resumeEngine(); } catch (e) { /* omit */ }
            api.trigger('finish', [api]);
          } else {
            try { api.engine.suspendEngine(); } catch (e) { /* omit */ }
          }
          common.toggleClass(root, 'is-chromecast', alive);
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
