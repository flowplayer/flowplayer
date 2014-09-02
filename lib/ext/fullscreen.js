var flowplayer = require('../flowplayer'),
    bean = require('bean'),
   VENDOR = flowplayer.support.browser.mozilla ? "moz": "webkit",
   FS_ENTER = "fullscreen",
   FS_EXIT = "fullscreen-exit",
   FULL_PLAYER,
   FS_SUPPORT = flowplayer.support.fullscreen,
   FS_NATIVE_SUPPORT = typeof document.exitFullscreen == 'function',
   ua = navigator.userAgent.toLowerCase(),
   IS_SAFARI = /(safari)[ \/]([\w.]+)/.exec(ua) && !/(chrome)[ \/]([\w.]+)/.exec(ua);


// esc button
bean.on(document, "fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange", function(e) {
   var el = $(document.webkitCurrentFullScreenElement || document.mozFullScreenElement || document.fullscreenElement || document.msFullscreenElement || e.target);
   if (el.length && !FULL_PLAYER) {
      FULL_PLAYER = el.trigger(FS_ENTER, [el]);
   } else {
      FULL_PLAYER.trigger(FS_EXIT, [FULL_PLAYER]);
      FULL_PLAYER = null;
   }

});


flowplayer(function(player, root) {

   if (!player.conf.fullscreen) return;

   var win = window,
      fsResume = {apply: false, pos: 0, play: false},
      scrollTop;

   player.isFullscreen = false;

   player.fullscreen = function(flag) {

      if (player.disabled) return;

      if (flag === undefined) flag = !player.isFullscreen;

      if (flag) scrollTop = win.scrollTop();

      if ((VENDOR == "webkit" || IS_SAFARI) && player.engine == "flash")
         fsResume = {apply: true, pos: player.video.time, play: player.playing};

      if (FS_SUPPORT) {

         if (flag) {
            var r = root[0];
            $.each(['requestFullScreen', 'webkitRequestFullScreen', 'mozRequestFullScreen', 'msRequestFullscreen'], function(i, fName) {
               if (typeof r[fName] === 'function') {
                  r[fName](Element.ALLOW_KEYBOARD_INPUT);
                  if (IS_SAFARI && !document.webkitCurrentFullScreenElement && !document.mozFullScreenElement) { // Element.ALLOW_KEYBOARD_INPUT not allowed
                     r[fName]();
                  }
                  return false;
               }
            });

         } else {
            $.each(['exitFullscreen', 'webkitCancelFullScreen', 'mozCancelFullScreen', 'msExitFullscreen'], function(i, fName) {
              if (typeof document[fName] === 'function') {
                document[fName]();
                return false;
              }
            });
         }

      } else {
         player.trigger(flag ? FS_ENTER : FS_EXIT, [player]);
      }

      return player;
   };

   var lastClick;

   player.on("mousedown.fs", function() {
      if (+new Date - lastClick < 150 && player.ready) player.fullscreen();
      lastClick = +new Date;
   });

   player.on(FS_ENTER, function(e) {
      root.addClass("is-fullscreen");
      player.isFullscreen = true;

   }).on(FS_EXIT, function(e) {
      var oldOpacity;
      if (!FS_SUPPORT && player.engine === "html5") {
        oldOpacity = root.css('opacity') || '';
        root.css('opacity', 0);
      }
      root.removeClass("is-fullscreen");
      if (!FS_SUPPORT && player.engine === "html5") setTimeout(function() { root.css('opacity', oldOpacity); });
      player.isFullscreen = false;
      win.scrollTop(scrollTop);

   }).bind("ready", function (e, api, video) {
      if (fsResume.apply) {
         var fsreset = function () {
            if (!fsResume.play && !player.conf.live) {
               player.pause();
            } else {
               player.resume();
            }
            $.extend(fsResume, {pos: 0, play: false});
         };

         if (player.conf.live) {
            fsreset();
         } else if (/^rtmp[st]?:\/\//.test(video.url) && fsResume.pos && !isNaN(fsResume.pos)) {
            player.resume();
            player.seek(fsResume.pos, fsreset);
         } else {
            fsreset();
         }
      }
   });

});
