
!function() {

   var parseIpadVersion = function(UA) {
      var e = /Version\/(\d\.\d)/.exec(UA);
      if (e && e.length > 1) {
         return parseFloat(e[1], 10);
      }
      return 0;
   };

   var s = flowplayer.support,
      browser = $.browser,
      video = $("<video loop autoplay preload/>")[0],
      IS_IE = browser.msie,
      UA = navigator.userAgent,
      IS_IPAD = /iPad|MeeGo/.test(UA) && !/CriOS/.test(UA),
      IS_IPAD_CHROME = /iPad/.test(UA) && /CriOS/.test(UA),
      IS_IPHONE = /iP(hone|od)/i.test(UA) && !/iPad/.test(UA),
      IS_ANDROID = /Android/.test(UA) && !/Firefox/.test(UA),
      IS_ANDROID_FIREFOX = /Android/.test(UA) && /Firefox/.test(UA),
      IS_SILK = /Silk/.test(UA),
      IS_WP = /IEMobile/.test(UA),
      IPAD_VER = IS_IPAD ? parseIpadVersion(UA) : 0,
      ANDROID_VER = IS_ANDROID ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0;
   $.extend(s, {
      subtitles: !!video.addTextTrack,
      fullscreen: !IS_ANDROID &&
         (typeof document.webkitCancelFullScreen == 'function' && !/Mac OS X 10_5.+Version\/5\.0\.\d Safari/.test(UA) ||
            document.mozFullScreenEnabled ||
            typeof document.exitFullscreen == 'function'),
      inlineBlock: !(IS_IE && browser.version < 8),
      touch: ('ontouchstart' in window),
      dataload: !IS_IPAD && !IS_IPHONE && !IS_WP,
      zeropreload: !IS_IE && !IS_ANDROID, // IE supports only preload=metadata
      volume: !IS_IPAD && !IS_ANDROID && !IS_IPHONE && !IS_SILK && !IS_IPAD_CHROME,
      cachedVideoTag: !IS_IPAD && !IS_IPHONE && !IS_IPAD_CHROME && !IS_WP,
      firstframe: !IS_IPHONE && !IS_IPAD && !IS_ANDROID && !IS_SILK && !IS_IPAD_CHROME && !IS_WP && !IS_ANDROID_FIREFOX,
      inlineVideo: !IS_IPHONE && !IS_SILK && !IS_WP && (!IS_ANDROID || ANDROID_VER >= 3),
      hlsDuration: !browser.safari || IS_IPAD || IS_IPHONE || IS_IPAD_CHROME,
      seekable: !IS_IPAD && !IS_IPAD_CHROME
   });

   // flashVideo
   try {
      var ver = IS_IE ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version') :
         navigator.plugins["Shockwave Flash"].description;

      ver = ver.split(/\D+/);
      if (ver.length && !ver[0]) ver = ver.slice(1);

      s.flashVideo = ver[0] > 9 || ver[0] == 9 && ver[3] >= 115;

   } catch (ignored) {}
   try {
      s.video = !!video.canPlayType;
      s.video && video.canPlayType('video/mp4');
   } catch (e) {
      s.video = false;
   }

   // animation
   s.animation = (function() {
      var vendors = ['','Webkit','Moz','O','ms','Khtml'], el = $("<p/>")[0];

      for (var i = 0; i < vendors.length; i++) {
         if (el.style[vendors[i] + 'AnimationName'] !== 'undefined') return true;
      }
   })();



}();

