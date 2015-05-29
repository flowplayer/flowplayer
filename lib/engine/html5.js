'use strict';
var flowplayer = require('../flowplayer'),
    bean = require('bean'),
    ClassList = require('class-list'),
    extend = require('extend-object'),
    common = require('../common');
var VIDEO = document.createElement('video');

// HTML5 --> Flowplayer event
var EVENTS = {

   // fired
   ended: 'finish',
   pause: 'pause',
   play: 'resume',
   progress: 'buffer',
   timeupdate: 'progress',
   volumechange: 'volume',
   ratechange: 'speed',
   //seeking: 'beforeseek',
   seeked: 'seek',
   // abort: 'resume',

   // not fired
   loadeddata: 'ready',
   // loadedmetadata: 0,
   // canplay: 0,

   // error events
   // load: 0,
   // emptied: 0,
   // empty: 0,
   error: 'error',
   dataunavailable: 'error',
   webkitendfullscreen: !flowplayer.support.inlineVideo && 'unload'

};

function round(val, per) {
   per = per || 100;
   return Math.round(val * per) / per;
}

function getType(type) {
   return /mpegurl/i.test(type) ? "application/x-mpegurl" : type;
}

function canPlay(type) {
   if (!/^(video|application)/i.test(type))
      type = getType(type);
   return !!VIDEO.canPlayType(type).replace("no", '');
}

function findFromSourcesByType(sources, type) {
   var arr = sources.filter(function(s) {
      return s.type === type;
   });
   return arr.length ? arr[0] : null;
}

var videoTagCache;
var createVideoTag = function(video, autoplay, preload, useCache) {
  if (typeof autoplay === 'undefined') autoplay = true;
  if (typeof preload === 'undefined') preload = 'none';
  if (typeof useCache === 'undefined') useCache = true;
  if (useCache && videoTagCache) {
    videoTagCache.type = getType(video.type);
    videoTagCache.src = video.src;
    return videoTagCache;
  }
  var el  = document.createElement('video');
  el.src = video.src;
  el.type = getType(video.type);
  el.className = 'fp-engine';
  el.autoplay = autoplay ? 'autoplay' : false;
  el.preload = preload;
  el.setAttribute('x-webkit-airplay', 'allow');
  if (useCache) videoTagCache = el;
  return el;
};

var engine;

engine = function(player, root) {

   var api = common.find("video", root)[0],
      support = flowplayer.support,
      track = common.find("track", api)[0],
      conf = player.conf,
      self,
      timer,
      volumeLevel;
   /*jshint -W093 */
   return self = {
      engineName: engine.engineName,

      pick: function(sources) {
         if (support.video) {
            if (conf.videoTypePreference) {
               var mp4source = findFromSourcesByType(sources, conf.videoTypePreference);
               if (mp4source) return mp4source;
            }

            for (var i = 0, source; i < sources.length; i++) {
               if (canPlay(sources[i].type)) return sources[i];
            }
         }
      },

      load: function(video) {
         var created = false, container = common.find('.fp-player', root)[0], reload = false;
         if (conf.splash && !api) {
           api = createVideoTag(video);
           common.prepend(container, api);
           created = true;
         } else if (!api) {
           api = createVideoTag(video, !!video.autoplay || !!conf.autoplay, conf.clip.preload || 'metadata', false);
           common.prepend(container, api);
           created = true;
         } else {
           ClassList(api).add('fp-engine');
           common.find('source,track', api).forEach(common.removeNode);
           reload = api.src === video.src;
         }
         if (!support.inlineVideo) {
           common.css(api, {
             position: 'absolute',
             top: '-9999em'
           });
         }
         //TODO subtitles support

         // IE does not fire delegated timeupdate events
         bean.off(api, 'timeupdate', common.noop);
         bean.on(api, 'timeupdate', common.noop);

         common.prop(api, 'loop', !!(video.loop || conf.loop));

         if (typeof volumeLevel !== 'undefined') {
           api.volume = volumeLevel;
         }

         if (player.video.src && video.src != player.video.src || video.index) common.attr(api, 'autoplay', 'autoplay');
         api.src = video.src;
         api.type = video.type;

         listen(api, common.find("source", api).concat(api), video);

         // iPad (+others?) demands load()
         if (conf.clip.preload != 'none' && video.type != "mpegurl" || !support.zeropreload || !support.dataload) api.load();
         if (created || reload) api.load();
         if (api.paused && video.autoplay) api.play();
      },

      pause: function() {
         api.pause();
      },

      resume: function() {
         api.play();
      },

      speed: function(val) {
         api.playbackRate = val;
      },

      seek: function(time) {
         try {
            var pausedState = player.paused;
            api.currentTime = time;
            if (pausedState) api.pause();
         } catch (ignored) {}
      },

      volume: function(level) {
         volumeLevel = level;
         if (api) {
            api.volume = level;
         }
      },

      unload: function() {
         common.removeNode(common.find('video.fp-engine', root)[0]);
         if (!support.cachedVideoTag) videoTagCache = null;
         timer = clearInterval(timer);
         api = 0;
      }

   };

   function listen(api, sources, video) {
      // listen only once
      var instanceId = root.getAttribute('data-flowplayer-instance-id');

      if (api.listeners && api.listeners.hasOwnProperty(instanceId)) {
        api.listeners[instanceId] = video;
        return;
      }
      (api.listeners || (api.listeners = {}))[instanceId] = video;

      bean.on(sources, 'error', function(e) {
         try {
            if (canPlay(e.target.getAttribute('type'))) {
               player.trigger("error", { code: 4, video: extend(video, {src: api.src, url: api.src}) });
            }
         } catch (er) {
            // Most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
         }
      });

      player.on('shutdown', function() {
        bean.off(sources);
      });

      Object.keys(EVENTS).forEach(function(type) {
        var flow = EVENTS[type];
        if (!flow) return;
        root.addEventListener(type, function(e) {
          video = api.listeners[instanceId];
          if (!e.target || !ClassList(e.target).contains('fp-engine')) return;
            // safari hack for bad URL (10s before fails)
            if (flow == "progress" && e.srcElement && e.srcElement.readyState === 0) {
               setTimeout(function() {
                  if (!api.duration && (!player.conf.live || (player.video.type === 'mpegurl' && support.hlsDuration))) {
                     flow = "error";
                     player.trigger(flow, { code: 4 });
                  }
               }, 10000);
            }

            if (conf.debug && !/progress/.test(flow)) console.log(type, "->", flow, e);

            // no events if player not ready
            if (!player.ready && !/ready|error/.test(flow) || !flow || !common.find('video', root).length) { return; }

            var arg, vtype;

            var triggerEvent = function() {
              player.trigger(flow, [player, arg]);
            };

            switch (flow) {

               case "ready":

                  arg = extend(video, {
                     duration: api.duration,
                     width: api.videoWidth,
                     height: api.videoHeight,
                     url: api.currentSrc,
                     src: api.currentSrc
                  });

                  try {
                     arg.seekable = !conf.live && /mpegurl/i.test(video ? (video.type || '') : '') && api.duration || api.seekable && api.seekable.end(null);

                  } catch (ignored) {}

                  // buffer
                  timer = timer || setInterval(function() {

                     try {
                        arg.buffer = api.buffered.end(null);

                     } catch (ignored) {}

                     if (arg.buffer) {
                        if (round(arg.buffer, 1000) < round(arg.duration, 1000) && !arg.buffered) {
                           player.trigger("buffer", e);

                        } else if (!arg.buffered) {
                           arg.buffered = true;
                           player.trigger("buffer", e).trigger("buffered", e);
                           clearInterval(timer);
                           timer = 0;
                        }
                     }

                  }, 250);

                  if (!conf.live && !arg.duration && !support.hlsDuration && type === "loadeddata") {
                     var durationChanged = function() {
                        arg.duration = api.duration;
                        try {
                           arg.seekable = api.seekable && api.seekable.end(null);

                        } catch (ignored) {}
                        triggerEvent();
                        api.removeEventListener('durationchange', durationChanged);
                     };
                     api.addEventListener('durationchange', durationChanged);

                     // Ugly hack to handle broken Android devices
                     var timeUpdated = function() {
                       if (!player.ready && !api.duration) { // No duration even though the video already plays
                         arg.duration = 0;
                         ClassList(root).add('is-live'); // Make UI believe it's live
                         triggerEvent();
                       }
                       api.removeEventListener('timeupdate', timeUpdated);
                     };
                     api.addEventListener('timeupdate', timeUpdated);
                     return;
                  }

                  break;

               case "progress": case "seek":

                  var dur = player.video.duration;

                  if (api.currentTime > 0 || player.live) {
                     arg = Math.max(api.currentTime, 0);

                  } else if (flow == 'progress') {
                     return;
                  }
                  break;


               case "speed":
                  arg = round(api.playbackRate);
                  break;

               case "volume":
                  arg = round(api.volume);
                  break;

               case "error":
                  try {
                     arg = (e.srcElement || e.originalTarget).error;
                     arg.video = extend(video, {src: api.src, url: api.src});
                  } catch (er) {
                     // Most likely https://bugzilla.mozilla.org/show_bug.cgi?id=208427
                     return;
                  }
            }

            triggerEvent();


         }, true);

      });

   }

};


engine.canPlay = function(type) {
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'html5';

flowplayer.engines.push(engine);
