
!function() {

   var s = flowplayer.support,
      browser = $.browser,
      video = $("<video loop autoplay preload/>")[0],
      IS_IE = browser.msie,
      UA = navigator.userAgent,
      IS_IPAD = /iPad|MeeGo/.test(UA),
      IS_ANDROID = /Android/.test(UA),
      IPAD_VER = IS_IPAD ? parseFloat(/Version\/(\d\.\d)/.exec(UA)[1], 10) : 0;


   $.extend(s, {
      video: !!video.canPlayType,
      subtitles: !!video.addTextTrack,
      fullscreen: typeof document.webkitCancelFullScreen == 'function'
         && !/Mac OS X 10_5.+Version\/5\.0\.\d Safari/.test(UA) || document.mozFullScreenEnabled,
      fullscreen_keyboard: !$.browser.safari || $.browser.version > "536",
      inlineBlock: !(browser.msie && browser.version < 8),
      touch: ('ontouchstart' in window),
      dataload: !IS_IPAD || IPAD_VER >= 6,
      zeropreload: !IS_IE && !IS_ANDROID, // IE supports only preload=metadata
      volume: !IS_IPAD && !IS_ANDROID,
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

