
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

   var win = $(window),
      fs_seek = {pos: 0, play: false},
      scrollTop;

   player.isFullscreen = false;

   player.fullscreen = function(flag) {

      if (player.disabled) return;

      if (flag === undefined) flag = !player.isFullscreen;

      if (flag) scrollTop = win.scrollTop();

      if (FS_SUPPORT) {

         if (flag) {
            root[0][VENDOR + 'RequestFullScreen'](
               flowplayer.support.fullscreen_keyboard ? Element.ALLOW_KEYBOARD_INPUT : undefined
            );

         } else {
            document[VENDOR + 'CancelFullScreen']();
         }

      } else {
         if (player.engine === "flash" && player.conf.rtmp)
            fs_seek = {pos: player.video.time, play: player.playing};
         player.trigger(flag ? FS_ENTER : FS_EXIT, [player])
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
      if (fs_seek.pos) {
         setTimeout(function () {
            player.play(); // avoid hang in buffering state
            player.seek(fs_seek.pos);
            if (!fs_seek.play) {
               setTimeout(function () {
                  player.pause();
               }, 100);
            }
            fs_seek = {pos: 0, play: false};
         }, 250);
      }
   });

});

