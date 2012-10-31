
if (flowplayer.support.touch) {

   flowplayer(function(player, root) {

      // mobile devices
      var touched;

      root.bind("touchstart", function(e) {

         // force playback start with a first click
         touched = touched || root.triggerHandler("click.player");

         // fake mouseover effect with click
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

      if (/Android/.test(navigator.userAgent)) {

         var handleVideoDurationOnTimeUpdate = function() { // Android browser gives video.duration == 1 until second 'timeupdate' event fired
           if (video.duration != 1) {
             player.video.duration = video.duration;
             $('.fp-duration', root).html(format(video.duration));
             video.removeEventListener('timeupdate', handleVideoDurationOnTimeUpdate);
           }
         };
         video.addEventListener('timeupdate', handleVideoDurationOnTimeUpdate);
      }

   });

}
