
var focused;

flowplayer(function(api, root) {

   // no keyboard configured
   if (!api.conf.keyboard) return;

   // keyboard. single global listener
   $(document).bind("keydown.fp", function(e) {

      var el = focused,
         metaKeyPressed = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey,
         key = e.which;

      if (el && !metaKeyPressed && api.ready) {

         if (key < 58 && key > 47) return el.seekTo(key - 48);

         switch (key) {
            case 38: case 75: el.volume(el.volumeLevel + 0.15); break;        // volume up
            case 40: case 74: el.volume(el.volumeLevel - 0.15); break;        // volume down
            case 39: case 76: el.seeking = true; el.seek(true); break;        // forward
            case 37: case 72: el.seeking = true; el.seek(false); break;       // backward
            case 190: el.seekTo(); break;                                     // to last seek position
            case 32: el.toggle(); break;                                      // spacebar
            case 70: el.fullscreen(); break;                                  // toggle fullscreen
            case 77: el.mute(); break;                                        // mute
            case 27: el[el.isFullscreen ? 'fullscreen' : 'unload'](); break;  // esc
         }

         e.preventDefault();
      }

   });

   // hover
   root.bind("mouseenter mouseleave", function(e) {
      focused = !api.disabled && e.type == 'mouseenter' ? api : 0;
   });

});
