
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

$.support.video = !!VIDEO.canPlayType;

function round(val) {
   return Math.round(val * 100) / 100;
}

flowplayer.engine.html5 = function(player, root) {

   var videoTag = $("video", root),
      conf = player.conf,
      timer,
      api;


   function pick(video) {
      for (var i = 0, source; i < video.sources.length; i++) {
         source = video.sources[i];
         if (VIDEO.canPlayType("video/" + source.type).replace("no", '')) return source;
      };
   }

   // not supported
   if (!$.support.video || !pick(player.video)) return;

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

            if (conf.loop) videoTag.attr("loop", "loop");

            api = videoTag[0];

         } else {
            api = videoTag[0];

            // change of clip
            if (video.src && api.src != video.src) api.src = source.src;
            api.load();
         }

         listen(api);

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
      }

   };

   function listen(api) {

      // listen only once
      if (api.listening) return; api.listening = true;

      $.each(EVENTS, function(type, flow) {

        api.addEventListener(type, function(e) {

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
                  arg = video.time = round(Math.max(api.currentTime, 0));
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