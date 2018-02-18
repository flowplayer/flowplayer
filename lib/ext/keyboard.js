'use strict';
var flowplayer = require('../flowplayer'),
    bean = require('bean'),
    focused,
    focusedRoot,
    IS_HELP = "is-help",
    common = require('../common');

 // keyboard. single global listener
bean.on(document, "keydown.fp", function(e) {

   var el = focused,
      metaKeyPressed = e.ctrlKey || e.metaKey || e.altKey,
      key = e.which,
      conf = el && el.conf;

   if (!el || !conf.keyboard || el.disabled) return;

   if (!metaKeyPressed && el.ready) {

      // slow motion / fast forward
      if (e.shiftKey) {
         if (key == 39) el.speed(true);
         else if (key == 37) el.speed(false);
         return e.preventDefault();
      }

      // 1, 2, 3, 4 ..
      if (key < 58 && key > 47) {
         e.preventDefault();
         return el.seekTo(key - 48);
      }

      var handled = (function() {
         switch (key) {
            case 38: case 75: el.volume(el.volumeLevel + 0.15); return true;        // volume up
            case 40: case 74: el.volume(el.volumeLevel - 0.15); return true;        // volume down
            case 39: case 76: el.seeking = true; el.seek(true); return true;        // forward
            case 37: case 72: el.seeking = true; el.seek(false); return true;       // backward
            case 190: el.seekTo(); return true;                                     // to last seek position
            case 32: el.toggle(); return true;                                      // spacebar
            case 70: if(conf.fullscreen) el.fullscreen(); return true;              // toggle fullscreen
            case 77: el.mute(); return true;                                        // mute
            case 81: el.unload(); return true;                                      // unload/stop
         }
      })();
      if (handled) e.preventDefault();
   }

});

flowplayer(function(api, root) {

   // no keyboard configured
   if (!api.conf.keyboard) return;

   bean.on(document, 'click', function(ev) {
      if (common.hasParent(ev.target, root)) {
         focused = !api.disabled ? api : 0;
      } else {
         if (focused !== api) return;
         focused = 0;
      }
      if (focused) focusedRoot = root;
   });

   api.bind('shutdown', function() {
     if (focusedRoot == root) focusedRoot = null;
   });

});

