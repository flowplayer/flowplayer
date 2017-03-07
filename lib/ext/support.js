'use strict';
/* global ActiveXObject */
var flowplayer = require('../flowplayer'),
    extend = require('extend-object');
(function() {

   var parseIOSVersion = function(UA) {
      var e = /iP(ad|hone)(; CPU)? OS (\d+_\d)/.exec(UA);
      if (e && e.length > 1) {
         return parseFloat(e[e.length - 1].replace('_', '.'), 10);
      }
      return 0;
   };

   var createVideoTag = function() {
     var videoTag = document.createElement('video');
     videoTag.loop = true;
     videoTag.autoplay = true;
     videoTag.preload = true;
     return videoTag;
   };

    var b = {},
      d = document.documentElement.style,
      ua = navigator.userAgent.toLowerCase(),
      match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
      /(safari)[ \/]([\w.]+)/.exec(ua) ||
      /(webkit)[ \/]([\w.]+)/.exec(ua) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
      /(msie) ([\w.]+)/.exec(ua) ||
      ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];

   if (match[1]) {
      b[match[1]] = true;
      b.version = match[2] || "0";
   }

   var video = createVideoTag(),
      UA = navigator.userAgent,
      IS_IE = b.msie || /Trident\/7/.test(UA),
      IS_IPAD = /iPad|MeeGo/.test(UA) && !/CriOS/.test(UA),
      IS_IPAD_CHROME = /iPad/.test(UA) && /CriOS/.test(UA),
      IS_IPHONE = /iP(hone|od)/i.test(UA) && !/iPad/.test(UA) && !/IEMobile/i.test(UA),
      IS_ANDROID = /Android/.test(UA) && !/Firefox/.test(UA),
      IS_ANDROID_FIREFOX = /Android/.test(UA) && /Firefox/.test(UA),
      IS_SILK = /Silk/.test(UA),
      IS_WP = /IEMobile/.test(UA),
      WP_VER = IS_WP ? parseFloat(/Windows\ Phone\ (\d+\.\d+)/.exec(UA)[1], 10) : 0,
      IE_MOBILE_VER = IS_WP ? parseFloat(/IEMobile\/(\d+\.\d+)/.exec(UA)[1], 10) : 0,
      IOS_VER = IS_IPAD || IS_IPHONE ? parseIOSVersion(UA) : 0,
      ANDROID_VER = IS_ANDROID ? parseFloat(/Android\ (\d\.\d)/.exec(UA)[1], 10) : 0,
      s = extend(flowplayer.support, {

        browser: b,
        iOS: {
          iPhone: IS_IPHONE,
          iPad: IS_IPAD || IS_IPAD_CHROME,
          version: IOS_VER,
          chrome: IS_IPAD_CHROME
        },
        android: IS_ANDROID ? {
          firefox: IS_ANDROID_FIREFOX,
          version: ANDROID_VER
        } : false,
        subtitles: !!video.addTextTrack,
        fullscreen: typeof document.webkitFullscreenEnabled === 'boolean' ? document.webkitFullscreenEnabled : (typeof document.webkitCancelFullScreen == 'function' && !/Mac OS X 10_5.+Version\/5\.0\.\d Safari/.test(UA)) ||
              document.mozFullScreenEnabled ||
              typeof document.exitFullscreen == 'function' ||
              typeof document.msExitFullscreen == 'function',
        inlineBlock: !(IS_IE && b.version < 8),
        touch: ('ontouchstart' in window),
        dataload: !IS_IPAD && !IS_IPHONE && !IS_WP,
        flex: ('flexWrap' in d) || ('WebkitFlexWrap' in d) || ('msFlexWrap' in d),
        svg: !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect,
        zeropreload: !IS_IE && !IS_ANDROID, // IE supports only preload=metadata
        volume: !IS_IPAD && !IS_IPHONE && !IS_SILK && !IS_IPAD_CHROME,
        cachedVideoTag: !IS_IPAD && !IS_IPHONE && !IS_IPAD_CHROME && !IS_WP,
        firstframe: !IS_IPHONE && !IS_IPAD && !IS_ANDROID && !IS_SILK && !IS_IPAD_CHROME && !IS_WP && !IS_ANDROID_FIREFOX,
        inlineVideo: (!IS_IPHONE || IOS_VER >= 10) && (!IS_WP || (WP_VER >= 8.1 && IE_MOBILE_VER >= 11)) && (!IS_ANDROID || ANDROID_VER >= 3),
        hlsDuration: !IS_ANDROID && (!b.safari || IS_IPAD || IS_IPHONE || IS_IPAD_CHROME),
        seekable: !IS_IPAD && !IS_IPAD_CHROME
   });
   s.autoplay = s.firstframe;
   // flashVideo
   try {
      var plugin = navigator.plugins["Shockwave Flash"],
          ver = IS_IE ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version') : plugin.description;
      if (!IS_IE && !plugin[0].enabledPlugin) s.flashVideo = false;
      else {

         ver = ver.split(/\D+/);
         if (ver.length && !ver[0]) ver = ver.slice(1);

         s.flashVideo = ver[0] > 9 || ver[0] == 9 && ver[3] >= 115;
      }

   } catch (ignored) {}
   try {
      s.video = !!video.canPlayType;
      if (s.video) video.canPlayType('video/mp4');
   } catch (e) {
      s.video = false;
   }

   // animation
   s.animation = (function() {
      var vendors = ['','Webkit','Moz','O','ms','Khtml'], el = document.createElement('p');

      for (var i = 0; i < vendors.length; i++) {
         if (typeof el.style[vendors[i] + 'AnimationName'] !== 'undefined') return true;
      }
   })();



})();

