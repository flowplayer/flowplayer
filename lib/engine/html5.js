
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

flowplayer.engine.html5 = function(player, root) {

   var VIDEO = $('<video/>')[0],
      videoTag = $("video", root),
      track = $("track", videoTag),
      conf = player.conf,
      timer,
      api;

   function canPlay(type) {
      if (!/video/.test(type)) type = "video/" + type;
      return !!VIDEO.canPlayType(type).replace("no", '');
   }

   function pick(video) {
      for (var i = 0, source; i < video.sources.length; i++) {
         source = video.sources[i];
         if (canPlay(source.type)) return source;
      };
   }

   // not supported
   if (!flowplayer.support.video || !pick(player.video)) return;

   // ok
   videoTag.addClass("fp-engine").removeAttr("controls");

   return {

      load: function(video) {

         var source = pick(video);

         if (conf.splash && !api) {
            videoTag = $("<video/>", {
               src: source.src,
               type: 'video/' + source.type,
               autoplay: 'autoplay',
               'class': 'fp-engine'
            }).prependTo(root);

            if (track.length) videoTag.append(track.attr("default", ""));

            if (conf.loop) videoTag.attr("loop", "loop");

            api = videoTag[0];

         } else {
            api = videoTag[0];

            // change of clip
            if (video.src && api.src != video.src) {
               videoTag.attr("autoplay", "autoplay");
               api.src = source.src;
               api.load();
            }
         }

         // no events fired when preload=none
         if (conf.preload == 'none') root.trigger("ready", [player, {}]);

         listen(api, $("source", videoTag));

         return source;
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

      // seek(0) && pause() && display poster
      stop: function() {
         api.currentTime = 0;
         setTimeout(function() { api.load(); }, 100);
      },

      volume: function(level) {
         api.volume = level;
      },

      unload: function() {
         $("video", root).remove();
         api = 0;
         clearInterval(timer);
      }

   };

   function listen(api, sources) {

      // listen only once
      if (api.listening) return; api.listening = true;

      sources.bind("error", function(e) {
         if (canPlay($(e.target).attr("type"))) {
            player.trigger("error", { code: 4 });
         }
      });

      $.each(EVENTS, function(type, flow) {

        api.addEventListener(type, function(e) {

            // safari hack for bad URL
            if (flow == "progress" && e.srcElement && e.srcElement.readyState === 0) {
               setTimeout(function() {
                  if (!player.video.duration) {
                     flow = "error";
                     player.trigger(flow, { code: 4 });
                  }
               }, 500);
            }

            if (conf.debug && !/progress/.test(flow)) console.log(type, "->", flow, e);

            // no events if player not ready
            if (!player.ready && !/ready|error/.test(flow) || !flow) { return; }

            var event = $.Event(flow), video = player.video, arg;

            switch (flow) {

               case "ready":

                  arg = $.extend(video, {
                     duration: api.duration,
                     width: api.videoWidth,
                     height: api.videoHeight,
                     url: api.currentSrc
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
                        if (video.buffer < video.duration) {
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
                  // Safari can give negative times. add rounding
                  arg = video.time = Math.max(api.currentTime, 0);
                  break;

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