'use strict';
var flowplayer = require('../flowplayer')
  , common = flowplayer.common
  , html5factory = require('./html5-factory');



function canPlay(type) {
  if (typeof window.Hls === 'undefined') return false;
  return /mpegurl/.test(type) && window.Hls.isSupported();
}

var engine;

engine = function(player, root) {

  var hls, Hls = window.Hls;

  return html5factory('hlsjs-lite', player, root, canPlay, function(video, api) {
    hls = new Hls(flowplayer.extend({}, player.conf.hlsjs, video.hlsjs));
    hls.loadSource(video.src);
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

      if (Array.isArray(hlsQualities)) {
        confQualities = hlsQualities.map(function(q) {
          if (typeof q.level !== 'undefined') qualityLabels[q.level] = q.label;
          return typeof q.level !== 'undefined' ? q.level : q;
        });
      }

      video.qualities = [{
        value: -1,
        label: 'Auto'
      }].concat(levels.map(function(level, i) {
        if (confQualities && confQualities.indexOf(i) === -1) return false;
        var label = qualityLabels[i] || (Math.min(level.width, level.height) + 'p');
        if (!qualityLabels[i] && hlsQualities !== 'drive') label += ' (' + Math.round(level.bitrate / 1000) + 'k)';

        return {
          value: i,
          label: label
        };
      })).filter(common.identity);
      hls.attachMedia(api);
    });
  });
};


engine.canPlay = function(type) {
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'hlsjs-lite';

flowplayer.engines.push(engine);
