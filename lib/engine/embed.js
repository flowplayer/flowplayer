/* global __flash_unloadHandler:true,__flash_savedUnloadHandler:true */
'use strict';

/* The most minimal Flash embedding */

var common = require('../common');

// movie required in opts
module.exports = function embed(swf, flashvars, wmode, bgColor) {
   wmode = wmode || "transparent";
   var id = "obj" + ("" + Math.random()).slice(2, 15),
       innerHtml = '',
       ua = window.navigator.userAgent,
       msie = ua.indexOf('MSIE ') > 0 || ua.match(/Trident.*rv\:11\./);

   var opts = {
      width: "100%",
      height: "100%",
      allowscriptaccess: "always",
      wmode: wmode,
      quality: "high",
      flashvars: "",

      // https://github.com/flowplayer/flowplayer/issues/13#issuecomment-9369919
      movie: swf + (msie ? "?" + id : ""),
      name: id
   };

   if (wmode !== 'transparent') opts.bgcolor = bgColor || '#333333';

   // flashvars
   Object.keys(flashvars).forEach(function(key) {
      opts.flashvars += key + "=" + flashvars[key] + "&";
   });

   // parameters
   Object.keys(opts).forEach(function(key) {
      innerHtml += '<param name="' + key + '" value="'+ opts[key] +'"/>';
   });

   var elemParams = {'class': 'fp-engine', id: id, name: id};
   if (msie) elemParams.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
   else {
     elemParams.data = swf;
     elemParams.type = 'application/x-shockwave-flash';
   }


   return common.createElement('object', elemParams, innerHtml);
};


// Flash is buggy allover
if (window.attachEvent) {
   window.attachEvent("onbeforeunload", function() {
      __flash_savedUnloadHandler = __flash_unloadHandler = function() {};
   });
}

