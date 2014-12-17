'use strict';
var flowplayer = require('../flowplayer'),
    ClassList = require('class-list'),
    Sizzle = require('sizzle'),
    common = require('../common'),
    bean = require('bean');

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
      /*jshint -W093 */
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
         Sizzle('.fp-cuepoint', root).forEach(common.removeNode);

      }).bind("ready", function(e, api, video) {

         var cues = player.cuepoints = video.cuepoints || player.conf.cuepoints || [],
            duration = player.video.duration,
            timeline = Sizzle('.fp-timeline', root)[0];
         common.css(timeline, "overflow", "visible");

         cues.forEach(function(cue, i) {

            var time = cue.time || cue;
            if (time < 0) time = duration + cue;

            var el = common.createElement('a', {className: 'fp-cuepoint fp-cuepoint' + i});
            common.css(el, "left", (time / duration * 100) + "%");

            timeline.appendChild(el);
            bean.on(el, 'mousedown', function(e) {
               e.preventDefault();
               player.seek(time);

               // preventDefault() doesn't work
               return false;
            });

         });

      });

   }

});
