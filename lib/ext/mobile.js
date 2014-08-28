var flowplayer = require('../flowplayer'),
    isIeMobile = /IEMobile/.test(window.navigator.userAgent);
if (flowplayer.support.touch || isIeMobile) {

   flowplayer(function(player, root) {
      var isAndroid = /Android/.test(UA) && !/Firefox/.test(UA) && !/Opera/.test(UA),
          isSilk = /Silk/.test(UA),
          androidVer = isAndroid ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0;

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
         root.addClass("no-volume no-mute");
      }
      root.addClass("is-touch");
      root.find('.fp-timeline').data('api').disableAnimation();

      if (!flowplayer.support.inlineVideo || player.conf.native_fullscreen) player.conf.nativesubtitles = true;

      // fake mouseover effect with click
      var hasMoved = false;
      root.bind('touchmove', function() {
         hasMoved = true;
      }).bind("touchend click", function(e) {
         if (hasMoved) { //not intentional, most likely scrolling
            hasMoved = false;
            return;
         }

         if (player.playing && !root.hasClass("is-mouseover")) {
            root.addClass("is-mouseover").removeClass("is-mouseout");
            return false;
         }

         if (player.paused && root.hasClass("is-mouseout") && !player.splash) {
            player.toggle();
         }

         if (player.paused && isIeMobile) { // IE on WP7 need an additional api.play() call
            $('video.fp-engine', root)[0].play();
         }

      });

      // native fullscreen
      if (player.conf.native_fullscreen && typeof $('<video />')[0].webkitEnterFullScreen === 'function') {
         player.fullscreen = function() {
            var video = $('video.fp-engine', root);
            video[0].webkitEnterFullScreen();
            video.one('webkitendfullscreen', function() {
               video.prop('controls', true).prop('controls', false);
            });
         };
      }


      // Android browser gives video.duration == 1 until second 'timeupdate' event
      (isAndroid || isSilk) && player.bind("ready", function() {

         var video = $('video.fp-engine', root);
         video.one('canplay', function() {
            video[0].play();
         });
         video[0].play();

         player.bind("progress.dur", function() {

            var duration = video[0].duration;

            if (duration !== 1) {
               player.video.duration = duration;
               $(".fp-duration", root).html(format(duration));
               player.unbind("progress.dur");
            }
         });
      });


   });

}

