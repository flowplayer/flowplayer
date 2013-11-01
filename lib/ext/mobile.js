var isIeMobile = /IEMobile/.test(UA);
if (flowplayer.support.touch || isIeMobile) {

   flowplayer(function(player, root) {
      var isAndroid = /Android/.test(UA) && !/Firefox/.test(UA) && !/Opera/.test(UA),
          isSilk = /Silk/.test(UA),
          androidVer = isAndroid ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0;

      // custom load for android
      if (isAndroid) {
         player.conf.videoTypePreference = "mp4"; // Android has problems with webm aspect ratio
         if (!/Chrome/.test(UA) && androidVer < 4) {
            var originalLoad = player.load;
            player.load = function(video, callback) {
               var ret = originalLoad.apply(player, arguments);
               player.trigger('ready', player, player.video);
               return ret;
            };
         }
      }

      // hide volume
      if (!flowplayer.support.volume) {
         root.addClass("no-volume no-mute");
      }
      root.addClass("is-touch");
      root.find('.fp-timeline').data('api').disableAnimation();

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
