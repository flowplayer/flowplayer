
if (flowplayer.support.touch) {

   flowplayer(function(player, root) {
      var isAndroid = /Android/.test(UA);

      // hide volume
      if (!flowplayer.support.volume) {
         root.addClass("no-volume no-mute");
      }

      // fake mouseover effect with click
      !isAndroid && root.one("touchstart", function() {
         player.toggle();

      });
      root.bind("touchstart", function(e) {
         if (player.playing && !root.hasClass("is-mouseover")) {
            root.addClass("is-mouseover");
            return false;
         }

      });

      // native fullscreen
      if (player.conf.native_fullscreen && $.browser.webkit) {
         player.fullscreen = function() {
            $('video', root)[0].webkitEnterFullScreen();
         }
      }


      // Android browser gives video.duration == 1 until second 'timeupdate' event
      isAndroid && player.bind("ready", function() {

         var video = $('video', root);
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
