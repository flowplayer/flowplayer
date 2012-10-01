
/* The most minimal Flash embedding */

try {

   var ie = $.browser.msie,
      ver = ie ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version') :
         navigator.plugins["Shockwave Flash"].description;

   ver = ver.split(/\D+/);
   if (!ie) ver = ver.slice(1);

   flowplayer.support.flashVideo = ver[0] > 9 || ver[0] == 9 && ver[2] >= 115;

} catch (err) {

}


// movie required in opts
function embed(swf, flashvars) {

   var id = "_" + Math.random(),
      tag = '<object class="fp-engine" id="' + id+ '" name="' + id + '" ';

   tag += $.browser.msie ? 'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' :
      ' data="' + swf + '" type="application/x-shockwave-flash">';

   var opts = {
      width: "100%",
      height: "100%",
      allowscriptaccess: "always",
      wmode: "opaque",
      quality: "high",
      flashvars: "",
      movie: swf,
      name: id
   };

   // flashvars
   $.each(flashvars, function(key, value) {
      opts.flashvars += key + "=" + value + "&";
   });

   // parameters
   $.each(opts, function(key, value) {
      tag += '<param name="' + key + '" value="'+ value +'"/>';
   });

   tag += "</object>";

   return $(tag);
}


// Flash is buggy allover
if (window.attachEvent) {
   window.attachEvent("onbeforeunload", function() {
      __flash_savedUnloadHandler = __flash_unloadHandler = function() {};
   });
}

