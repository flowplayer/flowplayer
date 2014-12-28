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
   }).on('ready', function(e, api, video) {
     var cues = video.cuepoints || player.conf.cuepoints || [];
     player.setCuepoints(cues);
     lastFiredSegment = -0.125;
     if (player.conf.generate_cuepoints) {
       var duration = player.video.duration,
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
     }
   });
   if (player.conf.generate_cuepoints) {

      player.bind("load", function() {

         // clean up cuepoint elements of previous playlist items
         Sizzle('.fp-cuepoint', root).forEach(common.removeNode);

      });
   }

   /**
    * API
    */
   player.setCuepoints = function(cues) {
     player.cuepoints = [];
     segments = {};
     cues.forEach(player.addCuepoint);
   };
   player.addCuepoint = function(cue) {
     var segment = segmentForCue(cue);
     if (!segments[segment]) segments[segment] = [];
     segments[segment].push(cue);
     player.cuepoints.push(cue);
   };

   player.removeCuepoint = function(cue) {
     var idx = player.cuepoints.indexOf(cue),
         segment = segmentForCue(cue);
     if (idx === -1) return;
     player.cuepoints = player.cuepoints.slice(0, idx).concat(player.cuepoints.slice(idx+1));

     var sIdx = segments[segment].indexOf(cue);
     if (sIdx === -1) return;
     segments[segment] = segments[segment].slice(0, sIdx).concat(segments[segment].slice(sIdx+1));
   };

   function segmentForCue(cue) {
     var time = cue && cue.time || cue;
     if (time < 0) time = player.video.duration + time;
     return Math.round(time/0.125)*0.125;
   }

});
