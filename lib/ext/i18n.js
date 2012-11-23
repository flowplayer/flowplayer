/* I18N support for flowplayer */

flowplayer(function(api, root) {

   api._ = function(str) {
      
      var messages = flowplayer.messages,
          lang = api.conf.lang,
          lang_fallback = api.conf.lang_fallback;

      if (typeof messages[lang] == "undefined"
       || typeof messages[lang][str] == "undefined") {
            
         if (typeof messages[lang_fallback][str] == "undefined") {
            // neither in messages nor in fallback
            return str;
         }

         // fallback message
         return messages[lang_fallback][str];
      }

      // translated message
      return messages[lang][str];
   };

});

