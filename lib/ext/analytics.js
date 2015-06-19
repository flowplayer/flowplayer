'use strict';
/* global _gat */
var flowplayer = require('../flowplayer'),
    TYPE_RE = require('./resolve').TYPE_RE,
    scriptjs = require('scriptjs'),
    bean = require('bean');
flowplayer(function(player, root) {

   var id = player.conf.analytics, time = 0, last = 0, timer;

   if (id) {

      // load Analytics script if needed
      if (typeof _gat == 'undefined') scriptjs("//google-analytics.com/ga.js");

      var getTracker = function() {
        var tracker = _gat._getTracker(id);
        tracker._setAllowLinker(true);
        return tracker;
      };

      var  track = function track(e, api, video) {

         video = video || player.video;

         if (time && typeof _gat != 'undefined') {
            var tracker = getTracker();


            // http://code.google.com/apis/analytics/docs/tracking/eventTrackerGuide.html
            tracker._trackEvent(
               "Video / Seconds played",
               player.engine.engineName + "/" + video.type,
               video.title || root.getAttribute("title") || video.src.split("/").slice(-1)[0].replace(TYPE_RE, ''),
               Math.round(time / 1000)
            );
            time = 0;
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
         }

      };

      player.bind("load unload", track).bind("progress", function() {

         if (!player.seeking) {
            time += last ? (+new Date() - last) : 0;
            last = +new Date();
         }

         if (!timer) {
           timer = setTimeout(function() {
             timer = null;
             var tracker = getTracker();
             tracker._trackEvent('Flowplayer heartbeat', 'Heartbeat', '', 0, true);
           }, 10*60*1000); // heartbeat every 10 minutes
         }

      }).bind("pause", function() {
         last = 0;
      });

      player.bind('shutdown', function() {
        bean.off(window, 'unload', track);
      });

      bean.on(window, 'unload', track);

   }

});
