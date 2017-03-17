'use strict';
var flowplayer = require('../flowplayer'),
    bean = require('bean'),
    extend = require('extend-object'),
    common = require('../common');
var VIDEO = document.createElement('video');

// HTML5 --> Flowplayer event
var EVENTS = {

   // fired
   ended: 'finish',
   pause: 'pause',
   play: 'resume',
  //progress: 'buffer',
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
var createVideoTag = function(video, autoplay, preload, useCache, inline, subtitles) {
  if (typeof autoplay === 'undefined') autoplay = true;
  if (typeof preload === 'undefined') preload = 'none';
  if (typeof useCache === 'undefined') useCache = true;
  if (typeof inline === 'undefined') inline = true;
  if (useCache && videoTagCache) {
    videoTagCache.type = getType(video.type);
    videoTagCache.src = video.src;
    common.find('track', videoTagCache).forEach(common.removeNode);
    videoTagCache.removeAttribute('crossorigin');
    return videoTagCache;
  }
  var el  = document.createElement('video');
  el.src = video.src;
  el.type = getType(video.type);
  var className = 'fp-engine ';
  if (subtitles && subtitles.length) className += 'native-subtitles';
  el.className = className;
  if (flowplayer.support.autoplay) el.autoplay = autoplay ? 'autoplay' : false;
  if (flowplayer.support.dataload) el.preload = preload;
  if (inline) {
    el.setAttribute('webkit-playsinline', 'true');
    el.setAttribute('playsinline', 'true');
  }
  if (subtitles && subtitles.length) {
    var setMode = function(mode) {
      var tracks = el.textTracks;
      if (!tracks.length) return;
      tracks[0].mode = mode;
    };
    if (subtitles.some(function(st) { return !common.isSameDomain(st.src); })) common.attr(el, 'crossorigin', 'anonymous');
    if (typeof el.textTracks.addEventListener === 'function') el.textTracks.addEventListener('addtrack', function() {
      setMode('disabled');
      setMode('showing');
    });
    subtitles.forEach(function(st) {
      el.appendChild(common.createElement('track', {
        kind: 'subtitles',
        srclang: st.srclang || 'en',
        label: st.label || 'en',
        src: st.src,
        'default': st['default']
      }));
    });
  }
  if (useCache) videoTagCache = el;
  return el;
};

var engine;

engine = function(player, root) {

  var api = common.findDirect('video', root)[0] || common.find('.fp-player > video', root)[0],
      support = flowplayer.support,
      conf = player.conf,
      self,
      timer,
      lastBuffer,
      volumeLevel;
   /*jshint -W093 */
   return self = {
      engineName: engine.engineName,

      pick: function(sources) {
        var source = (function() {
          if (support.video) {
            if (conf.videoTypePreference) {
               var mp4source = findFromSourcesByType(sources, conf.videoTypePreference);
               if (mp4source) return mp4source;
            }

            for (var i = 0; i < sources.length; i++) {
               if (canPlay(sources[i].type)) return sources[i];
            }
          }
        })();
        if (!source) return;
        if (typeof source.src === 'string') source.src = common.createAbsoluteUrl(source.src);
        return source;
      },

      load: function(video) {
         var container = common.find('.fp-player', root)[0], reload = false, created = false;
         if (conf.splash && !api) {
           api = createVideoTag(
             video,
             undefined,
             undefined,
             undefined,
             !conf.disableInline,
             flowplayer.support.subtitles && conf.nativesubtitles && video.subtitles
           );
           common.prepend(container, api);
           created = true;
         } else if (!api) {
           api = createVideoTag(video, !!video.autoplay || !!conf.autoplay, conf.clip.preload || true, false);
           common.prepend(container, api);
           created = true;
         } else {
           common.addClass(api, 'fp-engine');
           common.find('source,track', api).forEach(common.removeNode);
           if (!player.conf.nativesubtitles) common.attr(api, 'crossorigin', false);
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

         common.prop(api, 'loop', false);
         player.off('.loophack');
         if (video.loop || conf.loop) {
           if (/mpegurl/i.test(video.type)) {
             player.on('finish.loophack', function() { player.resume(); });
           }
           else common.prop(api, 'loop', true);
         }

         if (typeof volumeLevel !== 'undefined') {
           api.volume = volumeLevel;
         }

         if (player.video.src && video.src != player.video.src || video.index) common.attr(api, 'autoplay', 'autoplay');
         api.src = video.src;
         api.type = video.type;

         self._listeners = listen(api, common.find("source", api).concat(api), video) || self._listeners;

         if (reload || (created && !conf.splash)) api.load();
         if (support.iOS.iPad && support.iOS.chrome) api.load();
         if (api.paused && (video.autoplay || conf.autoplay || conf.splash)) api.play();
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
         common.find('video.fp-engine', root).forEach(function (videoTag) {
           common.attr(videoTag, 'src', '');
           common.removeNode(videoTag);
         });
         if (!support.cachedVideoTag) videoTagCache = null;
         timer = clearInterval(timer);
         var instanceId = root.getAttribute('data-flowplayer-instance-id');
         delete api.listeners[instanceId];
         api = 0;
         if (self._listeners) Object.keys(self._listeners).forEach(function(typ) {
           self._listeners[typ].forEach(function(l) {
             root.removeEventListener(typ, l, true);
           });
         });
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
               player.trigger("error", [player, { code: 4, video: extend(video, {src: api.src, url: api.src}) }]);
            }
         } catch (er) {
            // Most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
         }
      });

      player.on('shutdown', function() {
        bean.off(sources);
        bean.off(api, '.dvrhack');
        player.off('.loophack');
      });

      var eventListeners = {};
      //Special event handling for HLS metadata events

      var listenMetadata = function(track) {
        if (track.kind !== 'metadata') return;
        track.mode = 'hidden';
        track.addEventListener('cuechange', function() {
          player.trigger('metadata', [player, track.activeCues[0].value]);
        }, false);
      };

      if (api && api.textTracks && api.textTracks.length) Array.prototype.forEach.call(api.textTracks, listenMetadata);
      if (api && api.textTracks && typeof api.textTracks.addEventListener === 'function') api.textTracks.addEventListener('addtrack', function(tev) {
        listenMetadata(tev.track);
      }, false);
      if (player.conf.dvr || player.dvr || video.dvr) {
        bean.on(api, 'progress.dvrhack', function() {
          if (!api.seekable.length) return;
          player.video.duration = api.seekable.end(null);
          player.video.seekOffset = api.seekable.start(null);
          player.trigger('dvrwindow', [player, {
            start: api.seekable.start(null),
            end: api.seekable.end(null)
          }]);
          if (api.currentTime >= api.seekable.start(null)) return;
          api.currentTime = api.seekable.start(null);
        });
      }

      Object.keys(EVENTS).forEach(function(type) {
        var flow = EVENTS[type];
        if (type === 'webkitendfullscreen' && player.conf.disableInline) flow = 'unload';
        if (!flow) return;
        var l = function(e) {
          video = api.listeners[instanceId];
          if (!e.target || !common.hasClass(e.target, 'fp-engine')) return;

            if (conf.debug && !/progress/.test(flow)) console.log(type, "->", flow, e);

            var triggerEvent = function() {
              player.trigger(flow, [player, arg]);
            };

            // no events if player not ready
            if (!player.ready && !/ready|error/.test(flow) || !flow || !common.find('video', root).length) {
              if (flow === 'resume') player.one('ready', function() { setTimeout(function() { triggerEvent(); }) });
              return;
            }
            var arg;

            if (flow === 'unload') { //Call player unload
              player.unload();
              return;
            }

            switch (flow) {

               case "ready":

                  arg = extend(video, {
                     duration: api.duration < Number.MAX_VALUE ? api.duration : 0,
                     width: api.videoWidth,
                     height: api.videoHeight,
                     url: api.currentSrc,
                     src: api.currentSrc
                  });

                  try {
                     arg.seekable = /mpegurl/i.test(video ? (video.type || '') : '') && api.duration || api.seekable && api.seekable.end(null) || player.live;

                  } catch (ignored) {}

                  // buffer
                  timer = timer || setInterval(function() {

                     try {
                        arg.buffer = api.buffered.end(null);

                     } catch (ignored) {}

                     if (arg.buffer) {
                        if (round(arg.buffer, 1000) < round(arg.duration, 1000) && !arg.buffered && arg.buffer !== lastBuffer) {
                           player.trigger("buffer", [player, arg.buffer]);
                           lastBuffer = arg.buffer;

                        } else if (!arg.buffered && arg.buffer !== lastBuffer) {
                           arg.buffered = true;
                           player.trigger("buffer", [player, arg.buffer]).trigger("buffered", e);
                           lastBuffer = arg.buffer;
                           clearInterval(timer);
                           timer = 0;
                        }
                     }

                  }, 250);

                  if (!player.live && !arg.duration && !support.hlsDuration && type === "loadeddata") {
                     var durationChanged = function() {
                        arg.duration = api.duration;
                        try {
                           arg.seekable = api.seekable && api.seekable.end(null);

                        } catch (ignored) {}
                        triggerEvent();
                        api.removeEventListener('durationchange', durationChanged);
                        common.toggleClass(root, 'is-live', false);
                     };
                     api.addEventListener('durationchange', durationChanged);

                     // Ugly hack to handle broken Android devices
                     var timeUpdated = function() {
                       if (!player.ready && !api.duration) { // No duration even though the video already plays
                         arg.duration = 0;
                         common.addClass(root, 'is-live'); // Make UI believe it's live
                         triggerEvent();
                       }
                       api.removeEventListener('timeupdate', timeUpdated);
                     };
                     api.addEventListener('timeupdate', timeUpdated);
                     return;
                  }

                  break;

               case "progress": case "seek":

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


        };
        root.addEventListener(type, l, true);
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(l);

      });
      return eventListeners;

   }

};


engine.canPlay = function(type) {
  return flowplayer.support.video && canPlay(type);
};

engine.engineName = 'html5';

flowplayer.engines.push(engine);
