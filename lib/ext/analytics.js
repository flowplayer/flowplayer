
flowplayer(function(player, root) {

   var id = player.conf.analytics, time = 0, last = 0;

   if (id) {

      // load Analytics script if needed
      if (typeof _gat == 'undefined') $.getScript("//google-analytics.com/ga.js");

      function track(e) {

         if (time && typeof _gat != 'undefined') {
            var tracker = _gat._getTracker(id),
               video = player.video;

            tracker._setAllowLinker(true);

            // http://code.google.com/apis/analytics/docs/tracking/eventTrackerGuide.html
            tracker._trackEvent(
               "Video / Seconds played",
               player.engine + "/" + video.type,
               root.attr("title") || video.src.split("/").slice(-1)[0].replace(TYPE_RE, ''),
               Math.round(time / 1000)
            );
            time = 0;
         }

      }

      player.bind("load unload", track).bind("progress", function() {

         if (!player.seeking) {
            time += last ? (+new Date - last) : 0;
            last = +new Date;
         }

      }).bind("pause", function() {
         last = 0;
      });

      $(window).unload(track);

   }

});