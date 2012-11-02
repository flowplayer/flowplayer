
flowplayer.engine.flash = function(player, root) {

   var conf = player.conf,
      video = player.video,
      callbackId,
      objectTag,
      api;

   var engine = {

      pick: function(sources) {
         if (flowplayer.support.flashVideo) {
            for (var i = 0, source; i < sources.length; i++) {
               source = sources[i];
               if (/mp4|flv|flash/.test(source.type)) return source;
            }
         }
      },

      load: function(video) {

         // first run
         if (!player.video) $("video", root).remove();

         video.url = (conf.rtmp ? video.src : $("<a/>").attr("href", video.src)[0].href)
            .replace(/&amp;/g, '%26').replace(/&/g, '%26').replace(/=/g, '%3D');

         if (api) {
            api.__play(video.url);

         } else {

            callbackId = "fp" + ("" + Math.random()).slice(3, 15);

            var opts = {
               hostname: conf.embedded ? conf.hostname : top.location.hostname,
               url: video.url,
               callback: "jQuery."+ callbackId
            };

            // optional conf
            $.each(['key', 'autoplay', 'preload', 'rtmp', 'loop', 'debug'], function(i, key) {
               if (conf[key]) opts[key] = conf[key];
            });

            if (/^https?:/.test(video.url)) delete opts.rtmp;

            objectTag = embed(conf.swf, opts);

            objectTag.prependTo(root);

            api = objectTag[0];

            // throw error if no loading occurs
            setTimeout(function() {
               try {
                  if (!api.PercentLoaded()) {
                     return root.trigger("error", [player, { code: 7, url: conf.swf }]);
                  }
               } catch (e) {}
            }, 5000);

            // listen
            $[callbackId] = function(type, arg) {

               if (conf.debug && type != "status") console.log("--", type, arg);

               var event = $.Event(type);

               switch (type) {

                  // RTMP sends a lot of finish events in vain
                  // case "finish": if (conf.rtmp) return;
                  case "ready": arg = $.extend(video, arg); break;
                  case "click": event.flash = true; break;
                  case "keydown": event.which = arg; break;
                  case "seek": video.time = arg; break;
                  case "buffered": video.buffered = true; break;

                  case "status":
                     player.trigger("progress", arg.time);

                     if (arg.buffer <= video.bytes && !video.buffered) {
                        video.buffer = arg.buffer / video.bytes * video.duration;
                        player.trigger("buffer", video.buffer);

                     } else if (video.buffered) player.trigger("buffered");

                     break;

               }

               // add some delay to that player is truly ready after an event
               setTimeout(function() { player.trigger(event, arg); }, 1)

            };

         }

      },

      // not supported yet
      speed: $.noop,


      unload: function() {
         api && api.__unload();
         delete $[callbackId];
         $("object", root).remove();
         api = 0;
      }

   };

   $.each("pause,resume,seek,volume".split(","), function(i, name) {

      engine[name] = function(arg) {

         if (player.ready) {

            if (name == 'seek' && player.video.time && !player.paused) {
               player.trigger("beforeseek");
            }

            if (arg === undefined) {
               api["__" + name]();

            } else {
               api["__" + name](arg);
            }

         }
      };

   });

   return engine;

};

