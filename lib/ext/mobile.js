'use strict';
var flowplayer = require('../flowplayer'),
    isIeMobile = /IEMobile/.test(window.navigator.userAgent),
    common = require('../common'),
    bean = require('bean'),
    format = require('./ui').format,
    UA = window.navigator.userAgent;
if (flowplayer.support.touch || isIeMobile) {

   flowplayer(function(player, root) {
      var isAndroid = /Android/.test(UA) && !/Firefox/.test(UA) && !/Opera/.test(UA),
          isSilk = /Silk/.test(UA),
          androidVer = isAndroid ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0;

      // custom load for android
      if (isAndroid && !isIeMobile) {
         if (!/Chrome/.test(UA) && androidVer < 4) {
            var originalLoad = player.load;
            player.load = function() {
               var ret = originalLoad.apply(player, arguments);
               player.trigger('ready', [player, player.video]);
               return ret;
            };
         }
         var timer, currentTime = 0;
         var resumeTimer = function(api) {
           timer = setInterval(function() {
             api.video.time = ++currentTime;
             api.trigger('progress', [api, currentTime]);
           }, 1000);
         };
         player.bind('ready pause unload', function() {
           if (timer) {
             clearInterval(timer);
             timer = null;
           }
         });
         player.bind('ready', function() {
           currentTime = 0;
         });
         player.bind('resume', function(ev, api) {
           if (!api.live) return;
           if (currentTime) { return resumeTimer(api); }
           player.one('progress', function(ev, api, t) {
             if (t === 0) { // https://github.com/flowplayer/flowplayer/issues/727
               resumeTimer(api);
             }
           });
         });
      }

      // hide volume
      if (!flowplayer.support.volume) {
        common.addClass(root, 'no-volume');
      }
      common.addClass(root, 'is-touch');
      if (player.sliders && player.sliders.timeline) player.sliders.timeline.disableAnimation();

      // fake mouseover effect with click
      var hasMoved = false;
      bean.on(root, 'touchmove', function() {
        hasMoved = true;
      });
      bean.on(root, 'touchend click', function(e) {
        if (hasMoved) { //not intentional, most likely scrolling
          hasMoved = false;
          return;
        }

        if (player.playing && !common.hasClass(root, 'is-mouseover')) {
          common.addClass(root, 'is-mouseover');
          common.removeClass(root, 'is-mouseout');
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (!player.playing && !player.splash && common.hasClass(root, 'is-mouseout') && !common.hasClass(root, 'is-mouseover')) {
          setTimeout(function() {
            if (!player.disabled && !player.playing && !player.splash) {
              player.resume();
            }
          }, 400);
        }


      });

      // native fullscreen
      if (!flowplayer.support.fullscreen && player.conf.native_fullscreen && typeof document.createElement('video').webkitEnterFullScreen === 'function') {
         var oldFullscreen = player.fullscreen;
         player.fullscreen = function() {
            var video = common.find('video.fp-engine', root)[0];
            if (!video) return oldFullscreen.apply(player);
            player.trigger('fullscreen', [player]);
            bean.on(document, 'webkitfullscreenchange.nativefullscreen', function() {
              if (document.webkitFullscreenElement !== video) return;
              bean.off(document, '.nativefullscreen');
              bean.on(document, 'webkitfullscreenchange.nativefullscreen', function() {
                if (document.webkitFullscreenElement) return;
                bean.off(document, '.nativefullscreen');
                player.trigger('fullscreen-exit', [player]);
              });
            });
            video.webkitEnterFullScreen();
            bean.one(video, 'webkitendfullscreen', function() {
              bean.off(document, 'fullscreenchange.nativefullscreen');
              player.trigger('fullscreen-exit', [player]);
              common.prop(video, 'controls', true);
              common.prop(video, 'controls', false);
            });
         };
      }


      // Android browser gives video.duration == 1 until second 'timeupdate' event
      if (isAndroid || isSilk) player.bind("ready", function() {

         var video = common.find('video.fp-engine', root)[0];
         bean.one(video, 'canplay', function() {
            video.play();
         });
         video.play();

         player.bind("progress.dur", function() {
            if (player.live || player.conf.live) return;
            var duration = video.duration;

            if (duration !== 1) {
               player.video.duration = duration;
               common.find(".fp-duration", root)[0].innerHTML = format(duration);
               player.unbind("progress.dur");
            }
         });
      });


   });

}

