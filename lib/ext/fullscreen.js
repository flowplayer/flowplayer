
var VENDOR = $.browser.mozilla ? "moz": "webkit",
   FS_ENTER = "fullscreen",
   FS_EXIT = "fullscreen-exit",
   FULL_PLAYER,
   FS_SUPPORT = typeof document.webkitCancelFullScreen == 'function' || document.mozFullScreenEnabled;

// detect native fullscreen support

flowplayer.support.fullscreen = FS_SUPPORT;


// esc button
$(document).bind(VENDOR + "fullscreenchange", function(e) {
   var el = $(document.webkitCurrentFullScreenElement || document.mozFullScreenElement);

   if (el.length) {
      FULL_PLAYER = el.trigger(FS_ENTER, [el]);
   } else {
      FULL_PLAYER.trigger(FS_EXIT, [FULL_PLAYER]);
   }

});


flowplayer(function(player, root) {

   player.isFullscreen = false;

   player.fullscreen = function(flag) {

      if (flag === undefined) flag = !player.isFullscreen;

      if (FS_SUPPORT) {

         if (flag) {
            root[0][VENDOR + 'RequestFullScreen'](Element.ALLOW_KEYBOARD_INPUT);
         } else {
            document[VENDOR + 'CancelFullScreen']();
         }

      } else {
         player.trigger(flag ? FS_ENTER : FS_EXIT, [player])
      }

      return player;
   };

   player.bind(FS_ENTER, function(e) {
      root.addClass("is-fullscreen");
      player.isFullscreen = true;

   }).bind(FS_EXIT, function(e) {
      root.removeClass("is-fullscreen");
      player.isFullscreen = false;
   });

   var origH = root.height();

   // handle Flash object aspect ratio on fullscreen
   player.bind("fullscreen", function() {

      var screenW = FS_SUPPORT ? screen.width : $(window).width(),
         screenH = FS_SUPPORT ? screen.height : $(window).height(),
         h = player.video.height / player.video.width * screenW;

      $("object", root).css({ height: h, marginTop: (screenH - h - 20) / 2 });

   }).bind("fullscreen-exit", function() {
      var ie7 = $.browser.msie && $.browser.version < 8;
      $("object", root).css({ height: ie7 ? origH : '', marginTop: '' })
   });

});

