
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
   seeking: 'beforeseek',
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

function round(val) {
   return Math.round(val * 100) / 100;
}

function canPlay(type) {
   if (!/video/.test(type)) type = "video/" + type;
   return !!VIDEO.canPlayType(type).replace("no", '');
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
            for (var i = 0, source; i < sources.length; i++) {
               if (canPlay(sources[i].type)) return sources[i];
            }
         }
      },

      load: function(video) {

         if (conf.splash && !api) {

            videoTag = $("<video/>", {
               src: video.src,
               type: 'video/' + video.type,
               autoplay: 'autoplay',
               'class': 'fp-engine'

            }).prependTo(root);

            if (track.length) videoTag.append(track.attr("default", ""));

            if (conf.loop) videoTag.attr("loop", "loop");

            api = videoTag[0];

         } else {

            api = videoTag[0];

            // change of clip
            if (player.video.src) {
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

         listen(api, video, $("source", videoTag).add(videoTag));

         // iPad (+others?) demands load()
         if (conf.preload != 'none' || !support.zeropreload || !support.dataload) api.load();

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
            api.currentTime = time;
         } catch (ignored) {}
      },

      volume: function(level) {
         api.volume = level;
      },

      unload: function() {
         $("video", root).remove();
         timer = clearInterval(timer);
         api = 0;
      }

   };

   function listen(api, video, sources) {

      // listen only once
      if (api.listening) return; api.listening = true;

      sources.bind("error", function(e) {
         if (canPlay($(e.target).attr("type"))) {
            player.trigger("error", { code: 4 });
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
                     video.seekable = api.seekable && api.seekable.end(null);

                  } catch (ignored) {}

                  // buffer
                  timer = timer || setInterval(function() {

                     try {
                        video.buffer = api.buffered.end(null);

                     } catch (ignored) {}

                     if (video.buffer) {
                        if (video.buffer <= video.duration && !video.buffered) {
                           player.trigger("buffer", e);

                        } else if (!video.buffered) {
                           video.buffered = true;
                           player.trigger("buffer", e).trigger("buffered", e);
                           clearInterval(timer);
                           timer = 0;
                        }
                     }

                  }, 250);

                  break;

               case "progress": case "seek":

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
                  arg = (e.srcElement || e.originalTarget).error;
            }

            player.trigger(event, arg);

         }, false);

      });

   }

};