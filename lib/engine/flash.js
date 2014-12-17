'use strict';
var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    common = require('../common'),
    embed = require('./embed'),
    extend = require('extend-object'),
    bean = require('bean'),
    engineImpl;

engineImpl = function flashEngine(player, root) {

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
         var flashvars = Sizzle('object param[name="flashvars"]', root)[0],
            flashprops = (common.attr(flashvars, 'value') || '').split("&");

         flashprops.forEach(function(prop, i) {
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
            truefs = fs && flowplayer.support.fullscreen,
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
            width: objwidth ? objwidth + 'px' : '',
            height: objheight ? objheight + 'px' : '',
            'margin-top': vmargin ? vmargin + 'px' : '',
            'margin-left': hmargin ? hmargin + 'px' : ''
         });
      }
   };


   var engine = {
      engineName: engineImpl.engineName,

      pick: function(sources) {

         if (flowplayer.support.flashVideo) {

            for (var i = 0, source; i < sources.length; i++) {
               source = sources[i];
               if (/mp4|flv|flash|mpegurl/i.test(source.type)) return source;
            }
         }
      },

      load: function(video) {

         function escapeURL(url) {
            return url.replace(/&amp;/g, '%26').replace(/&/g, '%26').replace(/=/g, '%3D');
         }

         var html5Tag = Sizzle("video", root)[0],
            url = escapeURL(video.src),
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
         var rtmp = video.rtmp || conf.rtmp;
         if (!is_absolute && !rtmp) url = common.createAbsoluteUrl(url);

         if (api) {
            ['rtmp', 'live', 'preload'].forEach(function(prop) {
              if (!video.hasOwnProperty(prop)) return;
              api.__set(prop, video[prop]);
            });
            if (!is_absolute && rtmp) api.__set('rtmp', rtmp);
            else if (is_absolute) api.__set('rtmp', false);
            api.__play(url, video.rtmp !== conf.rtmp);

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

            // optional conf
            ['key', 'autoplay', 'preload', 'rtmp', 'subscribe', 'live', 'loop', 'debug', 'splash', 'poster', 'rtmpt'].forEach(function(key) {
              if (conf.hasOwnProperty(key)) opts[key] = conf[key];
              if (video.hasOwnProperty(key)) opts[key] = video[key];
            });
            // bufferTime might be 0
            if (conf.bufferTime !== undefined) opts.bufferTime = conf.bufferTime;

            if (is_absolute) delete opts.rtmp;

            // issues #376
            if (opts.rtmp) {
               opts.rtmp = escapeURL(opts.rtmp);
            }

            // issue #733
            var bgColor = common.css(root, 'background-color') ||'', bg;
            if (bgColor.indexOf('rgb') === 0) {
              bg = toHex(bgColor);
            } else if (bgColor.indexOf('#') === 0) {
              bg = toLongHex(bgColor);
            }

            // issues #387
            opts.initialVolume = player.volumeLevel;

            var swfUrl = isHLS(video) ? conf.swfHls : conf.swf;

            api = embed(swfUrl, opts, conf.wmode, bg);

            var container = Sizzle('.fp-player', root)[0];

            common.prepend(container, api);

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

               if (status.time && status.time !== player.video.time) player.trigger("progress", [player, status.time]);

               video.buffer = status.buffer / video.bytes * video.duration;
               player.trigger("buffer", [player, video.buffer]);
               if (!video.buffered && status.time > 0) {
                  video.buffered = true;
                  player.trigger("buffered", [player]);
               }

            }, 250);

            // listen
            flowplayer[callbackId] = function(type, arg) {

               if (conf.debug) console.log("--", type, arg);

               var event = {
                 type: type
               };

               switch (type) {

                  // RTMP sends a lot of finish events in vain
                  // case "finish": if (conf.rtmp) return;
                  case "ready": arg = extend(video, arg); break;
                  case "click": event.flash = true; break;
                  case "keydown": event.which = arg; break;
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

               if (type != 'buffered' && type !== 'unload') {
                  // add some delay so that player is truly ready after an event
                  setTimeout(function() { player.trigger(event, [player, arg]); }, 1);
               } else if (type === 'unload') {
                 player.trigger(event, [player, arg]);
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
     return '#' + a.map(function(i) {
       return i + i;
     }).join('');
   }

   function isHLS(video) {
     return /application\/x-mpegurl/i.test(video.type);
   }

   return engine;

};


engineImpl.engineName = 'flash';
engineImpl.canPlay = function(type) {
  return flowplayer.support.flashVideo && /(video|application)\/(mp4|flash|flv|x-mpegurl)/i.test(type);
};
flowplayer.engines.push(engineImpl);
