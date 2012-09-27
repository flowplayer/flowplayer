
/* A simple simulation of flowplayer UI  */

$(function() {

   // mouseover
   $(".flowplayer").each(function() {

      var root = $(this).addClass("is-mouseout").bind("mouseenter mouseleave", function(e) {
         if (!root.is(".no-hover")) {
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
         if ($(e.target).is(".fp-ui")) root.toggleClass("is-paused is-playing");
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

   });


});
