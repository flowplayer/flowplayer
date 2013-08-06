
var VIDEO = $('<video/>')[0];

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
   return /mpegurl/i.test(type) ? "application/x-mpegurl" : "video/" + type;
}

function canPlay(type) {
   if (!/^(video|application)/.test(type))
      type = getType(type);
   return !!VIDEO.canPlayType(type).replace("no", '');
}

function findFromSourcesByType(sources, type) {
   var arr = $.grep(sources, function(s) {
      return s.type === type;
   });
   return arr.length ? arr[0] : null;
}

var videoTagCache;
var createVideoTag = function(video) {
   if (videoTagCache) {
      return videoTagCache.attr({type: getType(video.type), src: video.src});
   }
   return (videoTagCache = $("<video/>", {
               src: video.src,
               type: getType(video.type),
               'class': 'fp-engine',
               'autoplay': 'autoplay',
               preload: 'none',
               'x-webkit-airplay': 'allow'
            }));
}

flowplayer.engine.html5 = function(player, root) {

   var videoTag = $("video", root),
      support = flowplayer.support,
      track = $("track", videoTag),
      conf = player.conf,
      self,
      timer,
      api;

   return self = {

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

            videoTag = createVideoTag(video).prependTo(root);

            if (!support.inlineVideo) {
               videoTag.css({
                  position: 'absolute',
                  top: '-9999em'
               });
            }

            if (track.length) videoTag.append(track.attr("default", ""));

            if (conf.loop) videoTag.attr("loop", "loop");

            api = videoTag[0];

         } else {

            api = videoTag[0];
            var sources = videoTag.find('source');
            if (!api.src && sources.length) {
               api.src = video.src;
               sources.remove();
            }

            // change of clip
            if (player.video.src && video.src != player.video.src) {
               videoTag.attr("autoplay", "autoplay");
               api.src = video.src;

            // preload=none or no initial "loadeddata" event
            } else if (conf.preload == 'none' || !support.dataload) {

               if (support.zeropreload) {
                  player.trigger("ready", video).trigger("pause").one("ready", function() {
                     root.trigger("resume");
                  });

               } else {
                  player.one("ready", function() {
                     root.trigger("pause");
                  });
               }
            }

         }

         listen(api, $("source", videoTag).add(videoTag), video);

         // iPad (+others?) demands load()
         if (conf.preload != 'none' || !support.zeropreload || !support.dataload) api.load();
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
         api.volume = level;
      },

      unload: function() {
         $("video.fp-engine", root).remove();
         if (!support.cachedVideoTag) videoTagCache = null;
         timer = clearInterval(timer);
         api = 0;
      }

   };

   function listen(api, sources, video) {
      // listen only once

      if (api.listeners && api.listeners.hasOwnProperty(root.data('fp-player_id'))) return;
      (api.listeners || (api.listeners = {}))[root.data('fp-player_id')] = true;

      sources.bind("error", function(e) {
         try {
            if (e.originalEvent && $(e.originalEvent.originalTarget).is('img')) return e.preventDefault();
            if (canPlay($(e.target).attr("type"))) {
               player.trigger("error", { code: 4 });
            }
         } catch (er) {
            // Most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
         }
      });

      $.each(EVENTS, function(type, flow) {

         api.addEventListener(type, function(e) {

            // safari hack for bad URL (10s before fails)
            if (flow == "progress" && e.srcElement && e.srcElement.readyState === 0) {
               setTimeout(function() {
                  if (!player.video.duration) {
                     flow = "error";
                     player.trigger(flow, { code: 4 });
                  }
               }, 10000);
            }

            if (conf.debug && !/progress/.test(flow)) console.log(type, "->", flow, e);

            // no events if player not ready
            if (!player.ready && !/ready|error/.test(flow) || !flow || !$("video", root).length) { return; }

            var event = $.Event(flow), arg;

            switch (flow) {

               case "ready":

                  arg = $.extend(video, {
                     duration: api.duration,
                     width: api.videoWidth,
                     height: api.videoHeight,
                     url: api.currentSrc,
                     src: api.currentSrc
                  });

                  try {
                     arg.seekable = api.seekable && api.seekable.end(null);

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
                        player.trigger(event, arg);
                        api.removeEventListener('durationchange', durationChanged);
                     };
                     api.addEventListener('durationchange', durationChanged);
                     return;
                  }

                  break;

               case "progress": case "seek":

                  var dur = player.video.duration

                  if (api.currentTime > 0) {
                     arg = Math.max(api.currentTime, 0);
                     break;

                  } else if (flow == 'progress') {
                     return;
                  }


               case "speed":
                  arg = round(api.playbackRate);
                  break;

               case "volume":
                  arg = round(api.volume);
                  break;

               case "error":
                  try {
                     arg = (e.srcElement || e.originalTarget).error;
                  } catch (er) {
                     // Most likely https://bugzilla.mozilla.org/show_bug.cgi?id=208427
                     return;
                  }
            }

            player.trigger(event, arg);

         }, false);

      });

   }

};
