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
    , currentMedia;

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
    var btnContainer = common.find('.fp-buttons', root)[0];
    common.find('.fp-chromecast', btnContainer).forEach(common.removeNode);
    var trigger = common.createElement('a', { 'class': 'fp-chromecast', title: 'Play on Cast device'})
      , btn = common.createElement('span', { 'class': 'fp-chromecast-button' });
    trigger.appendChild(btn);
    btnContainer.insertBefore(trigger, common.find('.fp-fullscreen', btnContainer)[0]);
  }

  bean.on(root, 'click', '.fp-chromecast', function(ev) {
    ev.preventDefault();
    chrome.cast.requestSession(function(s) {
      session = s;
      var mediaInfo = new chrome.cast.media.MediaInfo(api.video.src);
      var request = new chrome.cast.media.LoadRequest(mediaInfo);
      session.loadMedia(request, onMediaDiscovered, function onMediaError() { });

      function onMediaDiscovered(media) {
        currentMedia = media;
      }
    }, function(err) {
      console.error('requestSession error', err);
    });
  });

});
