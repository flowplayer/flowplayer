
/*
   jQuery.browser for 1.9+

   We all love feature detection but that's sometimes not enough.

   @author Tero Piirainen
*/
!function($) {

   if (!$.browser) {

      var b = $.browser = {},
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

   }

}(jQuery);