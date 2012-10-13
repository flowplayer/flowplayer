
/*
   Bunch of hacks to gain mobile WebKit support. Main shortomings include:

   1. cannot insert video tag dynamically -> splash screen is tricky / hack
   2. autoplay not supported

   Both of these issues cannot be feature detected. More issues can be found here:

   http://blog.millermedeiros.com/2011/03/html5-video-issues-on-the-ipad-and-how-to-solve-them/
*/

if (/iPad|MeeGo/.test(navigator.userAgent)) {

   //Warning: This is a hack!. iPad is the new IE for developers.

   flowplayer(function(player, root) {

      // custom loaded event
      var loaded;

      player.splash = player.conf.splash = false;
      player.conf.autoplay = false;

      root.bind("load", function() {
         var video = $('video', root)[0];
         video.removeAttribute('controls');
         root.addClass("is-ipad is-paused").removeClass("is-loading");
         player.ready = player.paused = true;
         player.loading = false;
         player.resume();

         // fake ready event on start
         video.addEventListener("canplay", function(e) {
            root.trigger("ready").trigger("resume");
         }, false);

      });

      // force playback start with a first click
      root.bind("touchstart", function(e) {
         if (!loaded) {
            root.triggerHandler("click.player");
            loaded = true;
         }

         // fake mouseover effect with click
         if (player.playing && !root.hasClass("is-mouseover")) {
            root.addClass("is-mouseover");
            return false;
         }

      });


      player.unload = function() {
         player.pause();
         root.trigger("unload");
         loaded = false;
      };

   });

}
