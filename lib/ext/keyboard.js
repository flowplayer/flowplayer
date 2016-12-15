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

   // help dialog (shift key not truly required)
   if ([63, 187, 191].indexOf(key) != -1) {
      common.toggleClass(focusedRoot, IS_HELP);
      return false;
   }

   // close help / unload
   if (key == 27 && common.hasClass(focusedRoot, IS_HELP)) {
      common.toggleClass(focusedRoot, IS_HELP);
      return false;
   }

   if (!metaKeyPressed && el.ready) {

      e.preventDefault();

      // slow motion / fast forward
      if (e.shiftKey) {
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
         case 70: if(conf.fullscreen) el.fullscreen(); break;               // toggle fullscreen
         case 77: el.mute(); break;                                        // mute
         case 81: el.unload(); break;                                      // unload/stop
      }

   }

});

flowplayer(function(api, root) {

   // no keyboard configured
   if (!api.conf.keyboard) return;

   // hover
   bean.on(root, "mouseenter mouseleave", function(e) {
      focused = !api.disabled && e.type == 'mouseover' ? api : 0;
      if (focused) focusedRoot = root;
   });

   var speedhelp = flowplayer.support.video && api.conf.engine !== "flash" &&
      !!document.createElement('video').playbackRate ?
      '<p><em>shift</em> + <em>&#8592;</em><em>&#8594;</em>slower / faster</p>' : '';

   // TODO: add to player-layout.html
   root.appendChild(common.createElement('div', { className: 'fp-help' }, '\
         <a class="fp-close"></a>\
         <div class="fp-help-section fp-help-basics">\
            <p><em>space</em>play / pause</p>\
            <p><em>q</em>unload | stop</p>\
            <p><em>f</em>fullscreen</p>' + speedhelp + '\
         </div>\
         <div class="fp-help-section">\
            <p><em>&#8593;</em><em>&#8595;</em>volume</p>\
            <p><em>m</em>mute</p>\
         </div>\
         <div class="fp-help-section">\
            <p><em>&#8592;</em><em>&#8594;</em>seek</p>\
            <p><em>&nbsp;. </em>seek to previous\
            </p><p><em>1</em><em>2</em>&hellip; <em>6</em> seek to 10%, 20% &hellip; 60% </p>\
         </div>\
   '));

   bean.on(root, 'click', '.fp-close', function() {
     common.toggleClass(root, IS_HELP);
   });

   api.bind('shutdown', function() {
     if (focusedRoot == root) focusedRoot = null;
   });

});

