
if (flowplayer.support.touch) {

   flowplayer(function(player, root) {

      // fake mouseover effect with click
      root.one("touchstart", function() {
         player.toggle();

      }).bind("touchstart", function(e) {
         if (player.playing && !root.hasClass("is-mouseover")) {
            root.addClass("is-mouseover");
            return false;
         }
      });


      // no "loadeddata" event initially
      if (!flowplayer.support.dataload) {
         player.bind("load", function() {
            root.trigger("ready").trigger("pause").bind("ready", function() {
               root.trigger("resume");
            });
         });
      }

      if (player.conf.native_fullscreen) {
         player.fullscreen = function() {
           $('video', root)[0].webkitEnterFullScreen();
         }
      }

   });

}
