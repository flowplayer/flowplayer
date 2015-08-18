'use strict';
var common = require('../common');

// movie required in opts
module.exports = function embed(swf, flashvars, wmode, bgColor) {
   wmode = wmode || "opaque";

   var id = "obj" + ("" + Math.random()).slice(2, 15),
       tag = '<object class="fp-engine" id="' + id+ '" name="' + id + '" ',
       msie = navigator.userAgent.indexOf('MSIE') > -1;

   tag += msie ? 'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' :
      ' data="' + swf  + '" type="application/x-shockwave-flash">';

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
      tag += '<param name="' + key + '" value="'+ opts[key] +'"/>';
   });

   tag += "</object>";
   var el = common.createElement('div', {}, tag);
   return common.find('object', el);

};


// Flash is buggy allover
if (window.attachEvent) {
   window.attachEvent("onbeforeunload", function() {
      window.__flash_savedUnloadHandler = window.__flash_unloadHandler = function() {};
   });
}

