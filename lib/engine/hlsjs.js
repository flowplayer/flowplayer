'use strict';
var flowplayer = require('../flowplayer')
  , support = flowplayer.support
  , common = flowplayer.common
  , bean = flowplayer.bean
  , html5factory = require('./html5-factory');



function canPlay(type) {
  if (typeof window.Hls === 'undefined') return false;
  return /mpegurl/.test(type) && window.Hls.isSupported();
}

var engine;

engine = function(player, root) {

  var Hls = window.Hls
    , lastSelectedLevel
    , lastSource;

  function hlsjsExt(video, api, engineApi) {
    var conf = flowplayer.extend({
      recoverMediaError: true
    }, player.conf.hlsjs, video.hlsjs);
    if (player.engine.hls) player.engine.hls.destroy();
    var hls = player.engine.hls = new Hls(conf);
    engine.extensions.forEach(function(ext) {
      ext({
        hls: hls,
        player: player,
        root: root,
        videoTag: api
      });
    });
    hls.loadSource(video.src);

    // API overriders
    engineApi.resume = function() {
      if (player.live && !player.dvr) api.currentTime = hls.liveSyncPosition || 0;
      api.play();
    };

    engineApi.seek = function(seekTo) {
      try {
        if (player.live || player.dvr) {
          api.currentTime = Math.min(
            seekTo,
            (hls.liveSyncPosition || api.duration - conf.livePositionOffset)
          );
        }
        else api.currentTime = seekTo;
      } catch (e) {
        player.debug('Failed to seek to ', seekTo, e);
      }
    };

    if (conf.bufferWhilePaused === false) {
      player.on('pause', function() {
        hls.stopLoad();
        player.one('resume', function() {
          hls.startLoad();
        });
      });
    }

    // Quality selection
    player.on('quality', function(_ev, _api, q) {
      hls.nextLevel = lastSelectedLevel = q;
    });

    // HLS.js error handling
    var recoverMediaErrorDate
      , swapAudioCodecDate;
    var recover = function(isNetworkError) {
      player.debug('hlsjs - recovery');

      common.removeClass(root, 'is-paused');
      common.addClass(root, 'is-seeking');

      bean.one(api, 'seeked', function() {
        if (api.paused) {
          common.removeClass(root, 'is-poster');
          player.poster = false;
          api.play();
        }
        common.removeClass(root, 'is-seeking');
      });


      if (isNetworkError) return hls.startLoad();
      var now = performance.now();
      if (!recoverMediaErrorDate || now - recoverMediaErrorDate > 3000) {
        recoverMediaErrorDate = performance.now();
        hls.recoverMediaError();
      } else if (!swapAudioCodecDate || (now - swapAudioCodecDate) > 3000) {
        swapAudioCodecDate = performance.now();
        hls.swapAudioCodec();
        hls.recoverMediaError();
      }
    };


    hls.on(Hls.Events.MANIFEST_PARSED, function(_, data) {
      var hlsQualities = video.hlsQualities || player.conf.hlsQualities
        , confQualities
        , qualityLabels = {}
        , levels = data.levels;

      if (hlsQualities === false) return hls.attachMedia(api);
      if (hlsQualities === 'drive') switch (levels.length) {
        case 4:
          confQualities = [1, 2, 3];
          break;
        case 5:
          confQualities = [1, 2, 3, 4];
          break;
        case 6:
          confQualities = [1, 3, 4, 5];
          break;
        case 7:
          confQualities = [1, 3, 5, 6];
          break;
        case 8:
          confQualities = [1, 3, 6, 7];
          break;
        default:
          if (levels.length < 3 || (levels[0].height && levels[2].height && levels[0].height === levels[2].height)) {
            confQualities = [];
          } else {
            confQualities = [1, 2];
          }
          break;
      }

      video.qualities = [{
        value: -1,
        label: 'Auto'
      }]

      if (Array.isArray(hlsQualities)) {
        var confAutoQuality = hlsQualities.find(function(q) { return q === -1 || q.level && q.level === -1; });
        if (!confAutoQuality) video.qualities = [];
        else video.qualities[0].label = typeof confAutoQuality !== 'number' ? confAutoQuality.label : video.qualities[0].label;
        confQualities = hlsQualities.map(function(q) {
          if (typeof q.level !== 'undefined') qualityLabels[q.level] = q.label;
          return typeof q.level !== 'undefined' ? q.level : q;
        });
      }

      var initialLevel = -2;

      video.qualities = video.qualities.concat(levels.map(function(level, i) {
        if (confQualities && confQualities.indexOf(i) === -1) return false;
        var label = qualityLabels[i] || (Math.min(level.width, level.height) + 'p');
        if (!qualityLabels[i] && hlsQualities !== 'drive') label += ' (' + Math.round(level.bitrate / 1000) + 'k)';
        if (i === lastSelectedLevel) initialLevel = i;

        return {
          value: i,
          label: label
        };
      })).filter(common.identity);


      var currentLevel = video.quality = initialLevel === -2 ?  video.qualities[0].value || -1 : initialLevel;

      if (currentLevel !== hls.currentLevel) hls.currentLevel = currentLevel;

      // End quality selection

      hls.attachMedia(api);

      if (lastSource && video.src !== lastSource) api.play();
      lastSource = video.src;
    });
    
    hls.on(Hls.Events.ERROR, function(ev, data) {
      if (!data.fatal) return;
      if (conf.recoverNetworkError && data.type === Hls.ErrorTypes.NETWORK_ERROR) recover(true);
      else if (conf.recoverMediaError && data.type === Hls.ErrorTypes.MEDIA_ERROR) recover(false);
      else {
        var code = 5;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) code = 2;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) code = 3;
        hls.destroy();
        player.trigger('error', [player, { code: code }]);
      }
    });

    player.one('unload', function() {
      hls.destroy();
    });

    return {
      handlers: {
        error: function(e, videoTag) {
          var errorCode = videoTag.error && videoTag.error.code;
          if (conf.recoverMediaError && errorCode === 3 || !errorCode) {
            e.preventDefault();
            recover(false);
            return true;
          }
          if (conf.recoverNetworkError && errorCode === 2) {
            e.preventDefault();
            recover(true);
            return true;
          }
        }
      }
    };
  }
  return html5factory('hlsjs-lite', player, root, canPlay, hlsjsExt);
};


engine.canPlay = function(type, conf) {
  if (conf.hlsjs === false || (conf.clip && conf.clip.hlsjs === false)) return false;
  if (support.browser.safari && !(conf.clip && conf.clip.hlsjs || conf.hlsjs || {}).safari) return false;
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'hlsjs-lite';

engine.plugin = function(extension) {
  engine.extensions.push(extension);
}

engine.extensions = [];

flowplayer.engines.push(engine);
