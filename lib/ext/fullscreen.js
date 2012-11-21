
var VENDOR = $.browser.mozilla ? "moz": "webkit",
   FS_ENTER = "fullscreen",
   FS_EXIT = "fullscreen-exit",
   FULL_PLAYER,
   FS_SUPPORT = flowplayer.support.fullscreen;


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

   if (!player.conf.fullscreen) return;

   player.isFullscreen = false;

   player.fullscreen = function(flag) {

      if (flag === undefined) flag = !player.isFullscreen;

      if (FS_SUPPORT) {

         if (flag) {
            root[0][VENDOR + 'RequestFullScreen'](
               flowplayer.support.fullscreen_keyboard ? Element.ALLOW_KEYBOARD_INPUT : undefined
            );

         } else {
            document[VENDOR + 'CancelFullScreen']();
         }

      } else {
         player.trigger(flag ? FS_ENTER : FS_EXIT, [player])
      }

      return player;
   };

   //
   root.bind("dblclick.fs", function() {
      if (player.ready && !player.isFullscreen) player.fullscreen();
   });

   player.bind(FS_ENTER, function(e) {
      root.addClass("is-fullscreen");
      player.isFullscreen = true;

   }).bind(FS_EXIT, function(e) {
      root.removeClass("is-fullscreen");
      player.isFullscreen = false;
   });

   var origH = root.height(),
      origW = root.width();

   // handle Flash object aspect ratio on fullscreen
   player.bind("fullscreen", function() {

      var screenW = FS_SUPPORT ? screen.width : $(window).width(),
         screenH = FS_SUPPORT ? screen.height : $(window).height(),
         ratio = player.video.height / player.video.width,
         dim = ratio > 0.5 ? screenH * (1 / ratio) : screenW * ratio;

      $("object", root).css(ratio > 0.5 ?
         { width: dim, marginLeft: (screenW - dim) / 2, height: '100%' } :
         { height: dim, marginTop: (screenH - dim - 20) / 2, width: '100%' }
      );


   }).bind("fullscreen-exit", function() {
      var ie7 = $.browser.msie && $.browser.version < 8,
         ratio = player.video.height / player.video.width;

      $("object", root).css(ratio > 0.5 ?
         { width: ie7 ? origW : '', height: ie7 ? origH : '', marginLeft: '' } :
         { height: ie7 ? origH : '', width: ie7 ? origW : '', marginTop: '' }
      );

   });

});

