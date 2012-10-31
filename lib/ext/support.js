
!function() {

   var s = flowplayer.support,
      browser = $.browser,
      video = $("<video loop autoplay preload/>")[0],
      IS_IE = browser.msie,
      UA = navigator.userAgent,
      IS_IPAD = /iPad|MeeGo/.test(UA),
      IPAD_VER = IS_IPAD ? parseFloat(/Version\/(\d\.\d)/.exec(UA)[1], 10) : 0;



   $.extend(s, {
      video: !!video.canPlayType,
      subtitles: !!video.addTextTrack,
      fullscreen: typeof document.webkitCancelFullScreen == 'function' || document.mozFullScreenEnabled,
      loop: !!video.loop,
      autoplay: !!video.autoplay,
      preload: !!video.preload,
      inlineBlock: !(browser.msie && browser.version < 8),
      touch: typeof Touch == 'object',
      dataload: !IS_IPAD || IPAD_VER >= 6
   });


   // flashVideo
   try {
      var ver = IS_IE ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version') :
         navigator.plugins["Shockwave Flash"].description;

      ver = ver.split(/\D+/);
      if (!IS_IE) ver = ver.slice(1);

      s.flashVideo = ver[0] > 9 || ver[0] == 9 && ver[2] >= 115;

   } catch (ignored) {}

   // animation
   s.animation = (function() {
      var vendors = ['','Webkit','Moz','O','ms','Khtml'], el = $("<p/>")[0];

      for (var i = 0; i < vendors.length; i++) {
         if (el.style[vendors[i] + 'AnimationName'] !== 'undefined') return true;
      }
   })();



}();

