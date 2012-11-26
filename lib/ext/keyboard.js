
var focused,
   focusedRoot,
   IS_HELP = "is-help";

 // keyboard. single global listener
$(document).bind("keydown.fp", function(e) {

   var el = focused,
      metaKeyPressed = e.ctrlKey || e.metaKey || e.altKey,
      key = e.which,
      conf = el && el.conf;

   if (!el || !conf.keyboard || el.disabled) return;

   // help dialog (shift key not truly required)
   if ($.inArray(key, [63, 187, 191, 219]) != -1) {
      focusedRoot.toggleClass(IS_HELP);
      return false;
   }

   // close help / unload
   if (key == 27) {
      if (focusedRoot.hasClass(IS_HELP)) { focusedRoot.toggleClass(IS_HELP); return false; }
      if (conf.splash) { el.unload(); return false; }
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
         case 70: conf.fullscreen && el.fullscreen(); break;               // toggle fullscreen
         case 77: el.mute(); break;                                        // mute
         case 27: el[el.isFullscreen ? "fullscreen" : "unload"](); break;  // esc
      }

   }

});

flowplayer(function(api, root) {

   // no keyboard configured
   if (!api.conf.keyboard) return;

   // hover
   root.bind("mouseenter mouseleave", function(e) {
      focused = !api.disabled && e.type == 'mouseenter' ? api : 0;
      if (focused) focusedRoot = root;
   });

   // TODO: add to player-layout.html
   root.append('\
      <div class="fp-help">\
         <a class="fp-close"></a>\
         <div class="fp-help-section fp-help-basics">\
            <p><em>' + api._('space') + '</em>' + api._('play_pause') + '</p>\
            <p><em>' + api._('esc') + '</em>' + api._('stop') + '</p>\
            <p><em>f</em>' + api._('fullscreen') + '</p>\
            <p><em>' + api._('shift') + '</em> + <em>&#8592;</em><em>&#8594;</em>' + api._('slower_faster') + ' <small>(' + api._('support_speed_browsers') + ')</small></p>\
         </div>\
         <div class="fp-help-section">\
            <p><em>&#8593;</em><em>&#8595;</em>' + api._('volume') + '</p>\
            <p><em>m</em>' + api._('mute') + '</p>\
         </div>\
         <div class="fp-help-section">\
            <p><em>&#8592;</em><em>&#8594;</em>' + api._('seek') + '</p>\
            <p><em>&nbsp;. </em>' + api._('seek_previous') + '\
            </p><p><em>1</em><em>2</em>&hellip;<em>6</em> ' + api._('seek_percent') + ' </p>\
         </div>\
      </div>\
   ');

   api.bind("ready unload", function(e) {
      $(".fp-ui", root).attr("title", e.type == "ready" ? api._("hit_?_for_help") : "");
   });

   $(".fp-close", root).click(function() {
      root.toggleClass(IS_HELP);
   });

});
