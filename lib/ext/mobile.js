'use strict';
var flowplayer = require('../flowplayer'),
    isIeMobile = /IEMobile/.test(window.navigator.userAgent),
    ClassList = require('class-list'),
    common = require('../common'),
    Sizzle = require('sizzle'),
    bean = require('bean'),
    format = require('./ui').format,
    UA = window.navigator.userAgent;
if (flowplayer.support.touch || isIeMobile) {

   flowplayer(function(player, root) {
      var isAndroid = /Android/.test(UA) && !/Firefox/.test(UA) && !/Opera/.test(UA),
          isSilk = /Silk/.test(UA),
          androidVer = isAndroid ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0,
          rootClasses = ClassList(root);

      // custom load for android
      if (isAndroid) {
         if (!/Chrome/.test(UA) && androidVer < 4) {
            var originalLoad = player.load;
            player.load = function(video, callback) {
               var ret = originalLoad.apply(player, arguments);
               player.trigger('ready', [player, player.video]);
               return ret;
            };
         }
         var timer, currentTime = 0;
         var resumeTimer = function(api) {
           timer = setInterval(function() {
             api.video.time = ++currentTime;
             api.trigger('progress', currentTime);
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
         rootClasses.add("no-volume");
         rootClasses.add("no-mute");
      }
      rootClasses.add("is-touch");
      if (player.sliders && player.sliders.timeline) player.sliders.timeline.disableAnimation();

      if (!flowplayer.support.inlineVideo || player.conf.native_fullscreen) player.conf.nativesubtitles = true;

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

        if (player.playing && !rootClasses.contains("is-mouseover")) {
          rootClasses.add("is-mouseover");
          rootClasses.remove("is-mouseout");
          return false;
        }

        if (player.paused && rootClasses.contains("is-mouseout") && !player.splash) {
          player.toggle();
        }

        if (player.paused && isIeMobile) { // IE on WP7 need an additional api.play() call
          Sizzle('video.fp-engine', root)[0].play();
        }

      });

      // native fullscreen
      if (player.conf.native_fullscreen && typeof document.createElement('video').webkitEnterFullScreen === 'function') {
         player.fullscreen = function() {
            var video = Sizzle('video.fp-engine', root)[0];
            video.webkitEnterFullScreen();
            bean.one(video, 'webkitendfullscreen', function() {
              common.prop(video, 'controls', true);
              common.prop(video, 'controls', false);
            });
         };
      }


      // Android browser gives video.duration == 1 until second 'timeupdate' event
      if (isAndroid || isSilk) player.bind("ready", function() {

         var video = Sizzle('video.fp-engine', root)[0];
         bean.one(video, 'canplay', function() {
            video.play();
         });
         video.play();

         player.bind("progress.dur", function() {

            var duration = video.duration;

            if (duration !== 1) {
               player.video.duration = duration;
               Sizzle(".fp-duration", root)[0].innerHTML = format(duration);
               player.unbind("progress.dur");
            }
         });
      });


   });

}

