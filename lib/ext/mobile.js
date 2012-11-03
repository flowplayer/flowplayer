
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

      if (player.conf.native_fullscreen) {
         player.fullscreen = function() {
           $('video', root)[0].webkitEnterFullScreen();
         }
      }

   });

}
