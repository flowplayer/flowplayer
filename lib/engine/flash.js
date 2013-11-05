
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

         function escapeURL(url) {
            return url.replace(/&amp;/g, '%26').replace(/&/g, '%26').replace(/=/g, '%3D');
         }

         var html5Tag = $("video", root),
            url = escapeURL(video.src);
            is_absolute = /^https?:/.test(url);

         // html5 tag not needed (pause needed for firefox)
         try {
            if (html5Tag.length > 0 && flowplayer.support.video) html5Tag[0].pause();
         } catch (e) {
            // Omit errors on calling pause(), see https://github.com/flowplayer/flowplayer/issues/490
         }
         var removeTag = function() {
            html5Tag.remove();
         };
         var hasSupportedSource = function(sources) {
            return $.grep(sources, function(src) {
               return !!html5Tag[0].canPlayType('video/' + src.type);
            }).length > 0;
         };
         if (flowplayer.support.video &&
            html5Tag.prop('autoplay') &&
            hasSupportedSource(video.sources)) html5Tag.one('timeupdate', removeTag);
         else removeTag();

         // convert to absolute
         if (!is_absolute && !conf.rtmp) url = $("<img/>").attr("src", url)[0].src;

         if (api) {
            api.__play(url);

         } else {

            callbackId = "fp" + ("" + Math.random()).slice(3, 15);

            var opts = {
               hostname: conf.embedded ? conf.hostname : location.hostname,
               url: url,
               callback: "jQuery."+ callbackId
            };
            if (root.data("origin")) {
               opts.origin = root.data("origin");
            }

            if (is_absolute) delete conf.rtmp;

            // optional conf
            $.each(['key', 'autoplay', 'preload', 'rtmp', 'loop', 'debug', 'preload', 'splash', 'bufferTime'], function(i, key) {
               if (conf[key]) opts[key] = conf[key];
            });

            // issue #376
            if (opts.rtmp) {
               opts.rtmp = escapeURL(opts.rtmp);
            }

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

                  case "status":
                     player.trigger("progress", arg.time);

                     if (arg.buffer < video.bytes && !video.buffered) {
                        video.buffer = arg.buffer / video.bytes * video.duration;
                        player.trigger("buffer", video.buffer);
                     } else if (!video.buffered) {
                        video.buffered = true;
                        player.trigger("buffered");
                     }

                     break;

               }

               if (type != 'buffered') {
                  // add some delay so that player is truly ready after an event
                  setTimeout(function() { player.trigger(event, arg); }, 1)
               }

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

   var win = $(window);

   // handle Flash object aspect ratio
   player.bind("ready fullscreen fullscreen-exit", function(e) {
      var origH = root.height(),
         origW = root.width();
      if (player.conf.flashfit || /full/.test(e.type)) {

         var fs = player.isFullscreen,
            truefs = fs && FS_SUPPORT,
            ie7 = !flowplayer.support.inlineBlock,
            screenW = fs ? (truefs ? screen.width : win.width()) : origW,
            screenH = fs ? (truefs ? screen.height : win.height()) : origH,

            // default values for fullscreen-exit without flashfit
            hmargin = 0,
            vmargin = 0,
            objwidth = ie7 ? origW : '',
            objheight = ie7 ? origH : '',

            aspectratio, dataratio;

         if (player.conf.flashfit || e.type === "fullscreen") {
            aspectratio = player.video.width / player.video.height,
            dataratio = player.video.height / player.video.width,
            objheight = Math.max(dataratio * screenW),
            objwidth = Math.max(aspectratio * screenH);
            objheight = objheight > screenH ? objwidth * dataratio : objheight;
            objheight = Math.min(Math.round(objheight), screenH);
            objwidth = objwidth > screenW ? objheight * aspectratio : objwidth;
            objwidth = Math.min(Math.round(objwidth), screenW);
            vmargin = Math.max(Math.round((screenH + vmargin - objheight) / 2), 0);
            hmargin = Math.max(Math.round((screenW + hmargin - objwidth) / 2), 0);
         }

         $("object", root).css({
            width: objwidth,
            height: objheight,
            marginTop: vmargin,
            marginLeft: hmargin
         });
      }
   });

   return engine;

};

