var flowplayer = require('../flowplayer');
flowplayer.engine.flash = function(player, root) {

   var conf = player.conf,
      video = player.video,
      callbackId,
      objectTag,
      api;

   var win = $(window);

   var readyCallback = function () {
      // write out video url to handle fullscreen toggle and api load
      // in WebKit and Safari - see also fsResume
      if (VENDOR == "webkit" || IS_SAFARI) {
         var flashvars = $("object param[name='flashvars']", root),
            flashprops = (flashvars.attr("value") || '').split("&");

         $.each(flashprops, function (i, prop) {
			prop = prop.split("=");
            if (prop[0] == "url" && prop[1] != player.video.url) {
			   flashprops[i] = "url=" + player.video.url;
			   flashvars.attr({value: flashprops.join("&")});
               return false;
            }
         });
      }

   };
   var fullscreenCallback = function(e) {
      // handle Flash object aspect ratio
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
   };


   var engine = {

      pick: function(sources) {

         if (flowplayer.support.flashVideo) {

            // always pick video/flash first
            var flash = $.grep(sources, function(source) { return source.type == 'flash'; })[0];
            if (flash) return flash;

            for (var i = 0, source; i < sources.length; i++) {
               source = sources[i];
               if (/mp4|flv/i.test(source.type)) return source;
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

            player.bind('ready', readyCallback)
                  .bind("ready fullscreen fullscreen-exit", fullscreenCallback);

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
            $.each(['key', 'autoplay', 'preload', 'rtmp', 'subscribe', 'live', 'loop', 'debug', 'splash', 'poster', 'rtmpt'], function(i, key) {
               if (conf.hasOwnProperty(key)) opts[key] = conf[key];
            });
            // bufferTime might be 0
            if (conf.bufferTime !== undefined) opts.bufferTime = conf.bufferTime;

            // issues #376
            if (opts.rtmp) {
               opts.rtmp = escapeURL(opts.rtmp);
            }

            // issues #387
            opts.initialVolume = player.volumeLevel;

            // issue #733
            var bgColor = root.css('backgroundColor'), bg;
            if (bgColor.indexOf('rgb') === 0) {
              bg = toHex(bgColor);
            } else if (bgColor.indexOf('#') === 0) {
              bg = toLongHex(bgColor);
            }

            objectTag = embed(conf.swf, opts, conf.wmode, bg);

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

            // detect disabled flash
            setTimeout(function() {
              if (typeof api.PercentLoaded === 'undefined') {
                root.trigger('flashdisabled', [player]);
              }
            }, 1000);

            api.pollInterval = setInterval(function () {
               if (!api) return;
               var status = api.__status ? api.__status() : null;

               if (!status) return;

               if (status.time && status.time !== player.video.time) player.trigger("progress", status.time);

               video.buffer = status.buffer / video.bytes * video.duration;
               player.trigger("buffer", video.buffer);

               if (!video.buffered && status.time > 0) {
                  video.buffered = true;
                  player.trigger("buffered");
               }

            }, 250);

            // listen
            $[callbackId] = function(type, arg) {

               if (conf.debug) console.log("--", type, arg);

               var event = $.Event(type);

               switch (type) {

                  // RTMP sends a lot of finish events in vain
                  // case "finish": if (conf.rtmp) return;
                  case "ready": arg = $.extend(video, arg); break;
                  case "click": event.flash = true; break;
                  case "keydown": event.which = arg; break;
                  case "seek": video.time = arg; break;
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
         player.unbind('ready', readyCallback).unbind('ready fullscreen fullscreen-exit', fullscreenCallback);
         clearInterval(api.pollInterval);
      }

   };

   $.each("pause,resume,seek,volume".split(","), function(i, name) {

      engine[name] = function(arg) {
         try {
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
         } catch (e) {
           if (typeof api["__" + name] === 'undefined') { //flash lost it's methods
             return root.trigger('flashdisabled', [player]);
           }
           throw e;
         }
      };

   });

   function toHex(bg) {
     function hex(x) {
       return ("0" + parseInt(x).toString(16)).slice(-2);
     }

     bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
     if (!bg) return;

     return '#' + hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
   }

   function toLongHex(bg) {
     if (bg.length === 7) return bg;
     var a = bg.split('').slice(1);
     return '#' + $.map(a, function(i) {
       return i + i;
     }).join('');
   }

   return engine;

};

