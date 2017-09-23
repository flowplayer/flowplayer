'use strict';
var flowplayer = require('../flowplayer')
  , html5factory = require('./html5-factory');



function canPlay(type) {
  if (typeof window.Hls === 'undefined') return false;
  return /mpegurl/.test(type) && window.Hls.isSupported();
}

var engine, hls;

engine = function(player, root) {

  return html5factory('hlsjs-lite', player, root, canPlay, function(video, api) {
    hls = hls || new window.Hls(flowplayer.extend({}, player.conf.hlsjs, video.hlsjs));
    hls.loadSource(video.src);
    hls.attachMedia(api);
  });
};


engine.canPlay = function(type) {
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'hlsjs-lite';

flowplayer.engines.push(engine);
