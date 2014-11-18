var flowplayer = require('../flowplayer'),
    ClassList = require('class-list');
flowplayer(function(player, root) {

   var CUE_RE = / ?cue\d+ ?/;

   var lastTime = 0;

   player.cuepoints = player.conf.cuepoints || [];

   function setClass(index) {
      root.className = root.className.replace(CUE_RE, " ");
      if (index >= 0) ClassList(root).add('cue' + index);
   }

   player.removeCuepoint = function(cue) {
     var idx = player.cuepoints.indexOf(cue);
     if (idx === -1) return;
     player.cuepoints = player.cuepoints.splice(idx, 1);
   };

   player.on("progress", function(e, api, time) {

      // avoid throwing multiple times
      if (lastTime && time - lastTime < 0.015) return lastTime = time;
      lastTime = time;

      var cues = player.cuepoints || [];

      for (var i = 0, cue; i < cues.length; i++) {

         cue = cues[i];
         if (!isNaN(cue)) cue = { time: cue };
         if (cue.time < 0) cue.time = player.video.duration + cue.time;
         cue.index = i;

         // progress_interval / 2 = 0.125
         if (Math.abs(cue.time - time) < 0.125 * player.currentSpeed) {
            setClass(i);
            player.trigger("cuepoint", [player, cue]);
         }

      }

   // no CSS class name
   }).on("unload seek", setClass);

   if (player.conf.generate_cuepoints) {

      player.bind("load", function() {

         // clean up cuepoint elements of previous playlist items
         $(".fp-cuepoint", root).remove();

      }).bind("ready", function() {

         var cues = player.cuepoints || [],
            duration = player.video.duration,
            timeline = $(".fp-timeline", root).css("overflow", "visible");

         $.each(cues, function(i, cue) {

            var time = cue.time || cue;
            if (time < 0) time = duration + cue;

            var el = $("<a/>").addClass("fp-cuepoint fp-cuepoint" + i)
               .css("left", (time / duration * 100) + "%");

            el.appendTo(timeline).mousedown(function() {
               player.seek(time);

               // preventDefault() doesn't work
               return false;
            });

         });

      });

   }

});
