
var VENDOR = $.browser.mozilla ? "moz": "webkit",
   FS_ENTER = "fullscreen",
   FS_EXIT = "fullscreen-exit",
   FULL_PLAYER,
   FS_SUPPORT = flowplayer.support.fullscreen,
   FS_NATIVE_SUPPORT = typeof document.exitFullscreen == 'function',
   ua = navigator.userAgent.toLowerCase(),
   IS_SAFARI = /(safari)[ \/]([\w.]+)/.exec(ua) && !/(chrome)[ \/]([\w.]+)/.exec(ua);


// esc button
$(document).bind(FS_NATIVE_SUPPORT ? "fullscreenchange" : VENDOR + "fullscreenchange", function(e) {
   var el = $(document.webkitCurrentFullScreenElement || document.mozFullScreenElement || document.fullscreenElement || e.target);
   if (el.length && !FULL_PLAYER) {
      FULL_PLAYER = el.trigger(FS_ENTER, [el]);
   } else {
      FULL_PLAYER.trigger(FS_EXIT, [FULL_PLAYER]);
      FULL_PLAYER = null;
   }

});


flowplayer(function(player, root) {

   if (!player.conf.fullscreen) return;

   var win = $(window),
      fsResume = {index: 0, pos: 0, play: false},
      scrollTop;

   player.isFullscreen = false;

   player.fullscreen = function(flag) {

      if (player.disabled) return;

      if (flag === undefined) flag = !player.isFullscreen;

      if (flag) scrollTop = win.scrollTop();

      if ((VENDOR == "webkit" || IS_SAFARI) && player.engine == "flash") {
         // play current index on fullscreen toggle
         fsResume.index = player.video.index;
         if (player.conf.rtmp)
            // avoid restart
            $.extend(fsResume, {pos: player.video.time, play: player.playing});
      }

      if (FS_SUPPORT) {

         if (flag) {
            if (FS_NATIVE_SUPPORT) {
               root[0].requestFullscreen();
            } else {
               root[0][VENDOR + 'RequestFullScreen'](Element.ALLOW_KEYBOARD_INPUT);
               if (IS_SAFARI && !document.webkitCurrentFullScreenElement && !document.mozFullScreenElement) { // Element.ALLOW_KEYBOARD_INPUT not allowed
                  root[0][VENDOR + 'RequestFullScreen']();
               }
            }

         } else {
            if (FS_NATIVE_SUPPORT) {
              document.exitFullscreen();
            } else {
              document[VENDOR + 'CancelFullScreen']();
            }
         }

      } else {
         player.trigger(flag ? FS_ENTER : FS_EXIT, [player]);
      }

      return player;
   };

   var lastClick;

   root.bind("mousedown.fs", function() {
      if (+new Date - lastClick < 150 && player.ready) player.fullscreen();
      lastClick = +new Date;
   });

   player.bind(FS_ENTER, function(e) {
      root.addClass("is-fullscreen");
      player.isFullscreen = true;

   }).bind(FS_EXIT, function(e) {
      root.removeClass("is-fullscreen");
      player.isFullscreen = false;
      win.scrollTop(scrollTop);

   }).bind("ready", function () {
      if (fsResume.index > 0) {
          player.play(fsResume.index);
          // above loads "different" clip, resume position below
          fsResume.index = 0;
      } else if (fsResume.pos && !isNaN(fsResume.pos)) {
         player.resume().seek(fsResume.pos, function () {
            if (!fsResume.play)
               player.pause();
            $.extend(fsResume, {pos: 0, play: false});
         });
      }
   });

});

