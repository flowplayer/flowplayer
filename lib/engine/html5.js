var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
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
   dataunavailable: 'error'

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
var createVideoTag = function(video, autoplay, preload) {
  if (typeof autoplay === 'undefined') autoplay = true;
  if (typeof preload === 'undefined') preload = 'none';
  if (videoTagCache) {
    videoTagCache.type = getType(video.type);
    videoTagCache.src = video.src;
    return videoTagCache;
  }
  videoTagCache = document.createElement('video');
  videoTagCache.src = video.src;
  videoTagCache.type = getType(video.type);
  videoTagCache.className = 'fp-engine';
  videoTagCache.autoplay = autoplay ? 'autoplay' : false;
  videoTagCache.preload = preload;
  videoTagCache.setAttribute('x-webkit-airplay', 'allow');
  return videoTagCache;
};

var engine;

engine = function(player, root) {

   var api = Sizzle("video", root)[0],
      support = flowplayer.support,
      track = Sizzle("track", api)[0],
      conf = player.conf,
      self,
      timer,
      api,
      volumeLevel;

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

         if (conf.splash && !api) {
           api = createVideoTag(video);
           common.prepend(root, api);
         } else if (!api) {
           api = createVideoTag(video, false, conf.clip.preload || 'metadata');
           common.prepend(root, api);
         } else {
           ClassList(api).add('fp-engine');
           Sizzle('source,track', api).forEach(common.removeNode);
         }
         if (!support.inlineVideo) {
           common.css(api, {
             position: 'absolute',
             top: '-9999em'
           });
         }
         //TODO subtitles support

         if (conf.loop) common.prop(api, 'loop', true);

         if (typeof volumeLevel !== 'undefined') {
           api.volume = volumeLevel;
         }
         if (!api.src) {
           api.src = video.src;
           api.type = video.type;
         }

         if (player.video.src && video.src != player.video.src) {
           common.attr(api, 'autoplay', 'autoplay');
           api.src = video.src;
         }

         listen(api, Sizzle("source", api).concat(api), video);

         // iPad (+others?) demands load()
         if (conf.clip.preload != 'none' && video.type != "mpegurl" || !support.zeropreload || !support.dataload) api.load();
         if (conf.splash) api.load();
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
         common.removeNode(Sizzle('video.fp-engine', root)[0]);
         if (!support.cachedVideoTag) videoTagCache = null;
         timer = clearInterval(timer);
         api = 0;
      }

   };

   function listen(api, sources, video) {
      // listen only once

      if (api.listeners && api.listeners.hasOwnProperty(root.getAttribute('data-flowplayer-instance-id'))) return;
      (api.listeners || (api.listeners = {}))[root.getAttribute('data-flowplayer-instance-id')] = true;

      bean.on(sources, 'error', function(e) {
         try {
            if (canPlay(e.target.getAttribute('type'))) {
               player.trigger("error", { code: 4, video: extend(video, {src: api.src, url: api.src}) });
            }
         } catch (er) {
            // Most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
         }
      });

      Object.keys(EVENTS).forEach(function(type) {
        var flow = EVENTS[type];
        root.addEventListener(type, function(e) {
          if (!e.target || !ClassList(e.target).contains('fp-engine')) return;
            // safari hack for bad URL (10s before fails)
            if (flow == "progress" && e.srcElement && e.srcElement.readyState === 0) {
               setTimeout(function() {
                  if (!player.video.duration && (!player.conf.live || (player.video.type === 'mpegurl' && support.hlsDuration))) {
                     flow = "error";
                     player.trigger(flow, { code: 4 });
                  }
               }, 10000);
            }

            if (conf.debug && !/progress/.test(flow)) console.log(type, "->", flow, e);

            // no events if player not ready
            if (!player.ready && !/ready|error/.test(flow) || !flow || !Sizzle('video', root).length) { return; }

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
