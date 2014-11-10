var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    common = require('../common'),
    embed = require('./embed'),
    extend = require('extend-object');
var engine = function flashEngine(player, root) {

   var conf = player.conf,
      video = player.video,
      callbackId,
      objectTag,
      api;

   var win = window;

   var readyCallback = function () {
      // write out video url to handle fullscreen toggle and api load
      // in WebKit and Safari - see also fsResume
      if (common.webkit) {
         var flashvars = Sizzle('object param[name="flashvars"]', root)[0];
            flashprops = (common.attr(flashvars, 'value') || '').split("&");

         flashprops.forEach(function(prop) {
			      prop = prop.split("=");
            if (prop[0] == "url" && prop[1] != player.video.url) {
			         flashprops[i] = "url=" + player.video.url;
			         common.attr(flashvars, 'value', flashprops.join("&"));
            }
         });
      }

   };
   var fullscreenCallback = function(e) {
      // handle Flash object aspect ratio
      var origH = common.height(root),
         origW = common.width(root);

      if (player.conf.flashfit || /full/.test(e.type)) {

         var fs = player.isFullscreen,
            truefs = fs && FS_SUPPORT,
            ie7 = !flowplayer.support.inlineBlock,
            screenW = fs ? (truefs ? screen.width : common.width(win)) : origW,
            screenH = fs ? (truefs ? screen.height : common.height(win)) : origH,

            // default values for fullscreen-exit without flashfit
            hmargin = 0,
            vmargin = 0,
            objwidth = ie7 ? origW : '',
            objheight = ie7 ? origH : '',

            aspectratio, dataratio;

         if (player.conf.flashfit || e.type === "fullscreen") {
            aspectratio = player.video.width / player.video.height;
            dataratio = player.video.height / player.video.width;
            objheight = Math.max(dataratio * screenW);
            objwidth = Math.max(aspectratio * screenH);
            objheight = objheight > screenH ? objwidth * dataratio : objheight;
            objheight = Math.min(Math.round(objheight), screenH);
            objwidth = objwidth > screenW ? objheight * aspectratio : objwidth;
            objwidth = Math.min(Math.round(objwidth), screenW);
            vmargin = Math.max(Math.round((screenH + vmargin - objheight) / 2), 0);
            hmargin = Math.max(Math.round((screenW + hmargin - objwidth) / 2), 0);
         }

         common.css(Sizzle("object", root)[0], {
            width: objwidth,
            height: objheight,
            marginTop: vmargin,
            marginLeft: hmargin
         });
      }
   };


   var engine = {
      name: 'flash',

      pick: function(sources) {

         if (flowplayer.support.flashVideo) {

            // always pick video/flash first
            var flash = sources.filter(function(source) { return source.type == 'video/flash'; })[0];
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

         var html5Tag = Sizzle("video", root)[0],
            url = escapeURL(video.src);
            is_absolute = /^https?:/.test(url);

         var removeTag = function() {
            common.removeNode(html5Tag);
         };
         var hasSupportedSource = function(sources) {
            return sources.some(function(src) {
               return !!html5Tag.canPlayType(src.type);
            });
         };
         if (flowplayer.support.video &&
            common.prop(html5Tag, 'autoplay') &&
            hasSupportedSource(video.sources)) bean.one(html5Tag, 'timeupdate', removeTag);
         else removeTag();

         // convert to absolute
         if (!is_absolute && !conf.rtmp) url = common.createAbsoluteUrl(url);

         if (api) {
            api.__play(url);

         } else {

            player.on('ready.flashengine', readyCallback)
                  .on("ready.flashengine fullscreen.flashengine fullscreen-exit.flashengine", fullscreenCallback);

            callbackId = "fp" + ("" + Math.random()).slice(3, 15);

            var opts = {
               hostname: conf.embedded ? conf.hostname : location.hostname,
               url: url,
               callback: "flowplayer."+ callbackId
            };
            if (root.getAttribute('data-origin')) {
               opts.origin = root.getAttribute('data-origin');
            }

            if (is_absolute) delete conf.rtmp;

            // optional conf
            ['key', 'autoplay', 'preload', 'rtmp', 'subscribe', 'live', 'loop', 'debug', 'splash', 'poster', 'rtmpt'].forEach(function(key) {
               if (conf.hasOwnProperty(key)) opts[key] = conf[key];
            });
            // bufferTime might be 0
            if (conf.bufferTime !== undefined) opts.bufferTime = conf.bufferTime;

            // issues #376
            if (opts.rtmp) {
               opts.rtmp = escapeURL(opts.rtmp);
            }

            // issue #733
            var bgColor = root.css('backgroundColor'), bg;
            if (bgColor.indexOf('rgb') === 0) {
              bg = toHex(bgColor);
            } else if (bgColor.indexOf('#') === 0) {
              bg = toLongHex(bgColor);
            }

            // issues #387
            opts.initialVolume = player.volumeLevel;
            api = embed(conf.swf, opts, conf.wmode, bg);

            common.prepend(root, api);

            // throw error if no loading occurs
            setTimeout(function() {
               try {
                  if (!api.PercentLoaded()) {
                     return player.trigger("error", [player, { code: 7, url: conf.swf }]);
                  }
               } catch (e) {}
            }, 5000);

            // detect disabled flash
            setTimeout(function() {
              if (typeof api.PercentLoaded === 'undefined') {
                player.trigger('flashdisabled', [player]);
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
            flowplayer[callbackId] = function(type, arg) {

               if (conf.debug) console.log("--", type, arg);

               var detail = {api: player};

               switch (type) {

                  // RTMP sends a lot of finish events in vain
                  // case "finish": if (conf.rtmp) return;
                  case "ready": arg = extend(video, arg); break;
                  case "click": detail.flash = true; break;
                  case "keydown": detail.which = arg; break;
                  case "seek": video.time = arg; break;
                  case "status":
                     player.trigger("progress", [player, arg.time]);

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
                  setTimeout(function() { player.trigger(event, arg); }, 1);
               }

            };

         }

      },

      // not supported yet
      speed: function(){},


      unload: function() {
         if (api && api.__unload) api.__unload();
         delete flowplayer[callbackId];
         Sizzle("object", root).forEach(common.removeNode);
         api = 0;
         player.off('.flashengine');
         clearInterval(api.pollInterval);
      }

   };

   ['pause','resume','seek','volume'].forEach(function(name) {

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
             return player.trigger('flashdisabled', [player]);
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


engine.name = 'flash';
engine.canPlay = function(type) {
  return flowplayer.support.flashVideo && /video\/(mp4|flash|flv)/i.test(type);
};
flowplayer.engines.push(engine);
