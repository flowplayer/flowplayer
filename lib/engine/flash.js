'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    embed = require('./embed'),
    extend = require('extend-object'),
    bean = require('bean'),
    engineImpl;

engineImpl = function flashEngine(player, root) {

   var conf = player.conf,
      loadVideo,
      callbackId,
      api;

   var suspended, timeouts = [];

   var engine = {
      engineName: engineImpl.engineName,

      pick: function(sources) {

        var source = extend({}, (function() {
          if (flowplayer.support.flashVideo) {
            var selectedSource;
            for (var i = 0, source; i < sources.length; i++) {
               source = sources[i];
               if (/mp4|flv|flash/i.test(source.type)) selectedSource = source;
               if (player.conf.swfHls && /mpegurl/i.test(source.type)) selectedSource = source;
               if (selectedSource && !/mp4/i.test(selectedSource.type)) return selectedSource;
               // Did not find any source or source was video/mp4, let's try find more
            }
            return selectedSource; // Accept the fact we don't have anything or just an MP4
          }
        })());
        if (!source) return;
        if (source.src && !isAbsolute(source.src) && !player.conf.rtmp && !source.rtmp) source.src = common.createAbsoluteUrl(source.src);
        return source;
      },

      suspendEngine: function() {
        suspended = true;
      },
      resumeEngine: function() {
        suspended = false;
      },

      load: function(video) {
         loadVideo = video;
         timeouts.forEach(function(t) { clearTimeout(t); });

         function escapeURL(url) {
            return url.replace(/&amp;/g, '%26').replace(/&/g, '%26').replace(/=/g, '%3D');
         }

         var html5Tag = common.findDirect('video', root)[0] || common.find('.fp-player > video', root)[0],
            url = video.src,
            is_absolute = isAbsolute(url);

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

         if (api && isHLS(video) && api.data !== common.createAbsoluteUrl(conf.swfHls)) engine.unload();

         if (api) {
            ['live', 'preload', 'loop'].forEach(function(prop) {
              if (!video.hasOwnProperty(prop)) return;
              api.__set(prop, video[prop]);
            });
            Object.keys(video.flashls || {}).forEach(function(key) {
              api.__set('hls_' + key, video.flashls[key]);
            });
            var providerChangeNeeded = false;
            if (!is_absolute && rtmp) api.__set('rtmp', rtmp.url || rtmp);
            else {
              var oldRtmp = api.__get('rtmp');
              providerChangeNeeded = !!oldRtmp;
              api.__set('rtmp', null);
            }
            api.__play(url, providerChangeNeeded || video.rtmp && video.rtmp !== conf.rtmp);

         } else {

            callbackId = "fpCallback" + ("" + Math.random()).slice(3, 15);
            url = escapeURL(url);

            var opts = {
               hostname: conf.embedded ? common.hostname(conf.hostname) : common.hostname(location.hostname),
               url: url,
               callback: callbackId
            };
            if (root.getAttribute('data-origin')) {
               opts.origin = root.getAttribute('data-origin');
            }

            // optional conf
            ['proxy', 'key', 'autoplay', 'preload', 'subscribe', 'live', 'loop', 'debug', 'splash', 'poster', 'rtmpt'].forEach(function(key) {
              if (conf.hasOwnProperty(key)) opts[key] = conf[key];
              if (video.hasOwnProperty(key)) opts[key] = video[key];
              if ((conf.rtmp || {}).hasOwnProperty(key)) opts[key] = (conf.rtmp || {})[key];
              if ((video.rtmp || {}).hasOwnProperty(key)) opts[key] = (video.rtmp || {})[key];
            });
            if (conf.rtmp) opts.rtmp = conf.rtmp.url || conf.rtmp;
            if (video.rtmp) opts.rtmp = video.rtmp.url || video.rtmp;
            Object.keys(video.flashls || {}).forEach(function(key) {
              var val = video.flashls[key];
              opts['hls_' + key] = val;
            });

            var hlsQualities = typeof video.hlsQualities !== 'undefined' ? video.hlsQualities : conf.hlsQualities;
            if (typeof hlsQualities !== 'undefined') opts.hlsQualities = hlsQualities ? encodeURIComponent(JSON.stringify(hlsQualities)) : hlsQualities;
            // bufferTime might be 0
            if (conf.bufferTime !== undefined) opts.bufferTime = conf.bufferTime;

            if (is_absolute) delete opts.rtmp;

            // issues #376
            if (opts.rtmp) {
               opts.rtmp = escapeURL(opts.rtmp);
            }

            // issues #733, 906
            var bgColor = conf.bgcolor || common.css(root, 'background-color') ||'', bg;
            if (bgColor.indexOf('rgb') === 0) {
              bg = toHex(bgColor);
            } else if (bgColor.indexOf('#') === 0) {
              bg = toLongHex(bgColor);
            }

            // issues #387
            opts.initialVolume = player.volumeLevel;

            var swfUrl = isHLS(video) ? conf.swfHls : conf.swf;

            api = embed(swfUrl, opts, conf.wmode, bg)[0];

            var container = common.find('.fp-player', root)[0];

            common.prepend(container, api);

            player.off('quality.flashengine').on('quality.flashengine', function(ev, _api, quality) {
              var hlsQualities =
                typeof player.video.hlsQualities !== 'undefined' ?
                  player.video.hlsQualities :
                    player.conf.hlsQualities;
              if (!hlsQualities) return;
              api.__quality(quality);
            });

            // throw error if no loading occurs
            setTimeout(function() {
               try {
                  if (!api.PercentLoaded()) {
                     return player.trigger("error", [player, { code: 7, url: conf.swf }]);
                  }
               } catch (e) {}
            }, 5000);

            // detect disabled flash
            //
            timeouts.push(setTimeout(function() {
              if (typeof api.PercentLoaded === 'undefined') {
                player.trigger('flashdisabled', [player]);
              }
            }, 15000));
            timeouts.push(setTimeout(function() {
              if (typeof api.PercentLoaded === 'undefined') {
                player.trigger('flashdisabled', [player, false]);
              }
            }, 500));

            player.off('resume.flashhack').on('resume.flashhack', function() {
              var timer = setTimeout(function() {
                var currentTime = api.__status().time;
                var timer2 = setTimeout(function() {
                  if (player.playing && !player.loading && api.__status().time === currentTime) {
                    player.trigger('flashdisabled', [player]);
                  }
                }, 400);
                timeouts.push(timer2);
                player.one('seek.flashhack pause.flashhack load.flashack', function() { clearTimeout(timer2); });
              }, 800);
              timeouts.push(timer);
              player.one('progress', function() {
                clearTimeout(timer);
              });
            });


            api.pollInterval = setInterval(function () {
               if (!api || suspended) return;
               var status = api.__status ? api.__status() : null;

               if (!status) return;

               if (player.conf.live || player.live || video.live) {
                 video.seekOffset = status.seekOffset;
                 video.duration = status.duration + status.seekOffset;
               }

               if (player.playing && status.time && status.time !== player.video.time) player.trigger("progress", [player, status.time]);

               video.buffer = status.buffer / video.bytes * video.duration;
               player.trigger("buffer", [player, video.buffer]);

               if (!video.buffered && status.time > 0) {
                  video.buffered = true;
                  player.trigger("buffered", [player]);
               }

            }, 250);

            // listen
            window[callbackId] = function(type, arg) {
               var video = loadVideo;

               if (conf.debug) {
                 if (type.indexOf('debug') === 0 && arg && arg.length) {
                   console.log.apply(console, ['-- ' + type].concat(arg));
                 }
                 else console.log("--", type, arg);
               }

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
                 case "metadata":
                   var str = atob(arg);
                   arg = {
                     key: str.substr(10, 4),
                     data: str.substr(21)
                   }
                   break;
               }
               if (type === 'click' || type === 'keydown') {
                 event.target = root;
                 bean.fire(root, type, [event]);
               }
               else if (type != 'buffered' && type !== 'unload') {
                  // add some delay so that player is truly ready after an event
                  setTimeout(function() { player.trigger(event, [player, arg]); }, 1);
               } else if (type === 'unload') {
                 player.trigger(event, [player, arg]);
               }

            };

         }

      },

      // not supported yet
      speed: common.noop,


      unload: function() {
         if (api && api.__unload) api.__unload();
         try {
           if (callbackId && window[callbackId])delete window[callbackId];
         } catch (e) {}
         common.find("object", root).forEach(common.removeNode);
         api = 0;
         player.off('.flashengine');
         player.off('.flashhack');
         clearInterval(api.pollInterval);
         timeouts.forEach(function(t) { clearTimeout(t); });
      }

   };

   ['pause','resume','seek','volume'].forEach(function(name) {

      engine[name] = function(arg) {
         try {
           if (player.ready) {

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
engineImpl.canPlay = function(type, conf) {
  return flowplayer.support.flashVideo && /video\/(mp4|flash|flv)/i.test(type) || flowplayer.support.flashVideo && conf.swfHls && /mpegurl/i.test(type);
};
flowplayer.engines.push(engineImpl);



function isAbsolute(url) {
  return /^https?:/.test(url);
}
