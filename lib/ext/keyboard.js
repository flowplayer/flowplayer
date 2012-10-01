
var focused;

flowplayer(function(api, root) {

   // no keyboard configured
   if (!api.conf.keyboard) return;

   // keyboard. single global listener
   $(document).bind("keydown.fp", function(e) {

      var el = focused,
         metaKeyPressed = e.ctrlKey || e.metaKey,
         key = e.which;

      // help dialog
      if (el && e.shiftKey) {
         if (key == 191) root.tc("fp-show-help");
         return;
      }

      // close help
      if (key == 27 && root.hasClass("fp-show-help")) {
         return root.tc("fp-show-help");
      }

      if (el && !metaKeyPressed && api.ready) {

         e.preventDefault();

         // slow motion / fast forward
         if (e.altKey) {
            if (key == 39) el.speed(true);
            else if (key == 37) el.speed(false);
            return;
         }

         // 1, 2, 3, 4 ..
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

      }

   });

   // hover
   root.bind("mouseenter mouseleave", function(e) {
      focused = !api.disabled && e.type == 'mouseenter' ? api : 0;
   });

   root.append('\
      <div class="fp-help">\
         <a class="fp-close"/>\
         <p><em>space</em>Play / Pause</p>\
         <p><em>&#8593;</em><em>&#8595;</em>Volume</p>\
         <p><em>ALT</em> + <em>&#8592;</em><em>&#8594;</em>Slower / Faster</p>\
         <p><em>f</em>Fullscreen</p>\
         <p><em>m</em>Mute</p>\
         <p><em>esc</em>Stop</p>\
         <p><em>&#8592;</em><em>&#8594;</em>Seek</p>\
         <p><em>1</em><em>2</em><em>3</em> Seek to 10%, 20%, 30% &hellip;</p>\
         <p><em>.</em>Seek to last position</em>\
      </div>');

   $(".fp-close", root).click(function() {
      root.tc("fp-show-help");
   });

});
