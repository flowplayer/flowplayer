
if (flowplayer.support.touch) {

   flowplayer(function(player, root) {

      // hide volume
      if (!flowplayer.support.volume) {
         root.addClass("no-volume no-mute");
      }

      // fake mouseover effect with click
      root.one("touchstart", function() {
         player.toggle();

      }).bind("touchstart", function(e) {
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
      /Android/.test(UA) && player.bind("ready", function() {

         var videoTag = $('video', root)[0];

         player.bind("progress.dur", function() {

            var duration = videoTag.duration;

            if (duration !== 1) {
               player.video.duration = duration;
               $(".fp-duration", root).html(format(duration));
               player.unbind("progress.dur");
            }
         });
      });


   });

}
