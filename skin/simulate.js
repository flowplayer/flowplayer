
/* A simple simulation of flowplayer UI  */

$(function() {

   // mouseover
   $(".flowplayer").each(function() {

      var root = $(this).bind("mouseenter mouseleave", function(e) {
         if (root.is(".no-toggle")) {
            root.addClass("is-mouseover").removeClass("is-mouseout");
         } else {
            var over = e.type == "mouseenter";
            root.toggleClass("is-mouseover", over).toggleClass("is-mouseout", !over);
         }
      });

      // embed
      $(".fp-embed", root).click(function() {
         root.toggleClass("is-embedding");
          return false;
      });

      // click
      $(".fp-ui", root).click(function(e) {
         if ($(e.target).is(".fp-ui, .fp-play")) root.toggleClass("is-paused is-playing");
      });

      // fullscreen
      $(".fp-fullscreen", root).click(function() {
         root.toggleClass("is-fullscreen");
      });

      // inverted time
      $(".fp-time", root).click(function() {
         $(this).toggleClass("is-inverted");
      });

      // mute
      $(".fp-mute", root).click(function() {
         root.toggleClass("is-muted");
      });

      $(document).bind("keydown.fp", function(e) {
         if (e.shiftKey && e.which == 191) {
            root.toggleClass("is-help");
         }
      });

      $(".fp-close", root).click(function() {
         root.removeClass("is-help");
      });

   });

});


