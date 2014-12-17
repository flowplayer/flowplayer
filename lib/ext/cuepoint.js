'use strict';
var flowplayer = require('../flowplayer'),
    ClassList = require('class-list'),
    Sizzle = require('sizzle'),
    common = require('../common'),
    bean = require('bean');

flowplayer(function(player, root) {

   var CUE_RE = / ?cue\d+ ?/;

   var lastTime = 0;

   function setClass(index) {
      root.className = root.className.replace(CUE_RE, " ");
      if (index >= 0) ClassList(root).add('cue' + index);
   }

   var segments = {}, lastFiredSegment = -0.125;

   var fire = function(cue) {
     var idx = player.cuepoints.indexOf(cue);
     if (!isNaN(cue)) cue = { time: cue };
     cue.index = idx;
     setClass(idx);
     player.trigger('cuepoint', [player, cue]);
   };

   player.on("progress", function(e, api, time) {
      var segment = segmentForCue(time);
      while (lastFiredSegment < segment) {
        lastFiredSegment += 0.125;
        if (!segments[lastFiredSegment]) continue;
        segments[lastFiredSegment].forEach(fire);
      }

   }).on("unload", setClass).on("seek", function(ev, api, time) {
     setClass();
     lastFiredSegment = segmentForCue(time);
   });

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

   /**
    * API
    */
   player.setCuepoints = function(cues) {
     player.cuepoints = [];
     cues.forEach(player.addCuepoint);
   };
   // TODO handle negative times
   player.addCuepoint = function(cue) {
     var segment = segmentForCue(cue);
     if (!segments[segment]) segments[segment] = [];
     segments[segment].push(cue);
     player.cuepoints.push(cue);
   };

   player.removeCuepoint = function(cue) {
     var idx = player.cuepoints.indexOf(cue);
     if (idx === -1) return;
     player.cuepoints = player.cuepoints.splice(idx, 1);
   };


   player.setCuepoints(player.conf.cuepoints || []);

   function segmentForCue(cue) {
     var time = cue.time || cue;
     return Math.round(time/0.125)*0.125;
   }

});
