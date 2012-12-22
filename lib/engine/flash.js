
flowplayer.engine.flash = function(player, root) {

   var conf = player.conf,
      video = player.video,
      callbackId,
      objectTag,
      api;

   var engine = {

      pick: function(sources) {

         if (flowplayer.support.flashVideo) {

            // always pick video/flash first
            var flash = $.grep(sources, function(source) { return source.type == 'flash'; })[0];
            if (flash) return flash;

            for (var i = 0, source; i < sources.length; i++) {
               source = sources[i];
               if (/mp4|flv/.test(source.type)) return source;
            }
         }
      },

      load: function(video) {

         var html5Tag = $("video", root),
            url = video.src.replace(/&amp;/g, '%26').replace(/&/g, '%26').replace(/=/g, '%3D'),
            is_absolute = /^https?:/.test(url);

         // html5 tag not needed (pause needed for firefox)
         if (html5Tag.length > 0 && flowplayer.support.video) html5Tag[0].pause();
         html5Tag.remove();

         // convert to absolute
         if (!is_absolute && !conf.rtmp) url = $("<a/>").attr("href", url)[0].href;

         if (api) {
            api.__play(url);

         } else {

            callbackId = "fp" + ("" + Math.random()).slice(3, 15);

            var opts = {
               hostname: conf.embedded ? conf.hostname : top.location.hostname,
               url: url,
               callback: "jQuery."+ callbackId
            };

            if (is_absolute) delete conf.rtmp;

            // optional conf
            $.each(['key', 'autoplay', 'preload', 'rtmp', 'loop', 'debug'], function(i, key) {
               if (conf[key]) opts[key] = conf[key];
            });

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
         api && api.__unload && api.__unload();
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

   var win = $(window),
      origH = root.height(),
      origW = root.width();

   // handle Flash object aspect ratio
   player.bind("ready fullscreen fullscreen-exit", function() {

      var fs = player.isFullscreen,
         truefs = fs && FS_SUPPORT,
         screenW = fs ? (truefs ? screen.availWidth : win.width()) : origW,
         screenH = fs ? (truefs ? screen.availHeight : win.height()) : origH,
         hmargin = truefs ? screen.width - screen.availWidth : 0,
         vmargin = truefs ? screen.height - screen.availHeight : 0,
         aspectratio = player.video.width / player.video.height,
         dataratio = player.video.height / player.video.width,
         objheight = Math.max(dataratio * screenW),
         objwidth = Math.max(aspectratio * screenH);

      objheight = objheight > screenH ? objwidth * dataratio : objheight;
      objheight = Math.min(Math.round(objheight), screenH);
      objwidth = objwidth > screenW ? objheight * aspectratio : objwidth;
      objwidth = Math.min(Math.round(objwidth), screenW);

      $("object", root).css({
         width: objwidth,
         height: objheight,
         marginTop:  Math.max(Math.round((screenH + vmargin - objheight) / 2), 0),
         marginLeft: Math.max(Math.round((screenW + hmargin - objwidth) / 2), 0)
      });

   });

   return engine;

};

