'use strict';
var flowplayer = require('../flowplayer')
  , common = flowplayer.common
  , html5factory = require('./html5-factory');

var VIDEO = document.createElement('video');

function getType(type) {
   return /mpegurl/i.test(type) ? "application/x-mpegurl" : type;
}

function canPlay(type) {
   if (!/^(video|application)/i.test(type))
      type = getType(type);
   return !!VIDEO.canPlayType(type).replace("no", '');
}

var engine;

engine = function(player, root) {

  return html5factory('html5', player, root, canPlay, function(video, api) {
    if (api.currentSrc !== video.src) {
      common.find('source', api).forEach(common.removeNode);
      api.src = video.src;
      api.type = video.type;
    } else if (video.autoplay) {
      api.load();
    }

  });
};


engine.canPlay = function(type) {
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'html5';

flowplayer.engines.push(engine);
