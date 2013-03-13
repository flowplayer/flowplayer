
!function() {

   var s = flowplayer.support,
      browser = $.browser,
      video = $("<video loop autoplay preload/>")[0],
      IS_IE = browser.msie,
      UA = navigator.userAgent,
      IS_IPAD = /iPad|MeeGo/.test(UA) && !/CriOS/.test(UA),
      IS_IPAD_CHROME = /iPad/.test(UA) && /CriOS/.test(UA),
      IS_IPHONE = /iP(hone|od)/i.test(UA),
      IS_ANDROID = /Android/.test(UA),
      IS_SILK = /Silk/.test(UA),
      IS_WP = /IEMobile/.test(UA),
      IPAD_VER = IS_IPAD ? parseFloat(/Version\/(\d\.\d)/.exec(UA)[1], 10) : 0;


   $.extend(s, {
      video: !!video.canPlayType,
      subtitles: !!video.addTextTrack,
      fullscreen: typeof document.webkitCancelFullScreen == 'function'
         && !/Mac OS X 10_5.+Version\/5\.0\.\d Safari/.test(UA) || document.mozFullScreenEnabled,
      fullscreen_keyboard: !browser.safari || browser.version > "536",
      inlineBlock: !(IS_IE && browser.version < 8),
      touch: ('ontouchstart' in window),
      dataload: !IS_IPAD && !IS_IPHONE && !IS_WP,
      zeropreload: !IS_IE && !IS_ANDROID, // IE supports only preload=metadata
      volume: !IS_IPAD && !IS_ANDROID && !IS_IPHONE && !IS_SILK && !IS_IPAD_CHROME,
      cachedVideoTag: !IS_IPAD && !IS_IPHONE && !IS_IPAD_CHROME && !IS_WP,
      firstframe: !IS_IPHONE && !IS_IPAD && !IS_ANDROID && !IS_SILK && !IS_IPAD_CHROME && !IS_WP
   });

   // flashVideo
   try {
      var ver = IS_IE ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version') :
         navigator.plugins["Shockwave Flash"].description;

      ver = ver.split(/\D+/);
      if (ver.length && !ver[0]) ver = ver.slice(1);

      s.flashVideo = ver[0] > 9 || ver[0] == 9 && ver[3] >= 115;

   } catch (ignored) {}

   // animation
   s.animation = (function() {
      var vendors = ['','Webkit','Moz','O','ms','Khtml'], el = $("<p/>")[0];

      for (var i = 0; i < vendors.length; i++) {
         if (el.style[vendors[i] + 'AnimationName'] !== 'undefined') return true;
      }
   })();



}();

