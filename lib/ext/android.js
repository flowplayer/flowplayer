if (/Android/.test(navigator.userAgent)) {
  flowplayer(function(player, root) {

    // custom loaded event
    var loaded;

    player.splash = player.conf.splash = false;
    player.conf.autoplay = false;
    
    //Setup fullscreen
    var video = $('video', root)[0];
    player.fullscreen = function() {
      video.webkitEnterFullScreen();
    }

    root.bind("load", function() {
      root.addClass("is-paused").removeClass("is-loading");
      player.ready = player.paused = true;
      player.loading = false;
      
      var handleVideoDurationOnTimeUpdate = function() { // Android browser gives video.duration == 1 until second 'timeupdate' event fired
        if (video.duration != 1) {
          player.video.duration = video.duration
          video.removeEventListener('timeupdate', handleVideoDurationOnTimeUpdate);
        }
      };
      video.addEventListener('timeupdate', handleVideoDurationOnTimeUpdate);
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
