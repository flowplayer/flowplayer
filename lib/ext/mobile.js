
if (flowplayer.support.touch) {

   flowplayer(function(player, root) {

      // hide volume
      if (!flowplayer.support.volume) {
         root.addClass("no-volume no-mute");
      }


      // native fullscreen
      if (player.conf.native_fullscreen && $.browser.webkit) {
         player.fullscreen = function() {
           $('video', root)[0].webkitEnterFullScreen();
         }
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

   });

}
