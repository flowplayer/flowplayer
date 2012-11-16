
var TRACK_EL = $("<track/>")[0];

// Thanks: https://github.com/delphiki/Playr/blob/master/playr.js#L569
var TIMECODE_RE = /^((?:[0-9]{2}:)?(?:[0-9]{2}:)?[0-9]{2}[,.]{1}[0-9]{3}) --\> ((?:[0-9]{2}:)?(?:[0-9]{2}:)?[0-9]{2}[,.]{1}[0-9]{3})(.*)/;

flowplayer.support.subtitles = !!TRACK_EL.track;

// TODO: remove in 6.0
$.extend($.support, flowplayer.support);


flowplayer(function(player, root, engine) {

   /*** Api ***/
   
   player.subtitles = [];
   player.captions = false;
   
   // Get wrapper
   var wrap = $("fp-subtitle", root);
   if (wrap.length == 0) {
      wrap = $("<div class='fp-subtitle'/>", root).appendTo(root);
   }
   var currentPoint = wrap;

   player.loadSubtitles = function(url) {
      player.subtitles = [];
	  
      // Preserve non-subtitle cuepoints
      var cuepoints = player.cuepoints;
      player.cuepoints = [];
      $.each(cuepoints, function(index) {
         if (cuepoints[index].subtitle === undefined && cuepoints[index].subtitleEnd === undefined)
            player.cuepoints.push(cuepoints[index]);
      });
      
      function seconds(timecode) {
         var els = timecode.split(':');
         while (els.length < 3) {
            els.unshift(0);
         }
         return els[0] * 60 * 60 + els[1] * 60 + parseFloat(els[2].replace(',','.'));
      }

      // Hide any currently visible cues
      wrap.removeClass("fp-active");

      if (url)
         $.get(url, function(txt) {
         
            for (var i = 0, lines = txt.split("\n"), len = lines.length, entry = {}, title, timecode, text, cue; i < len; i++) {
      
               timecode = TIMECODE_RE.exec(lines[i]);
      
               if (timecode) {
      
                  // title
                  title = lines[i - 1];
      
                  // text
                  text = "<p>" + lines[++i] + "</p><br/>";
                  while ($.trim(lines[++i]) && i < lines.length) text +=  "<p>" + lines[i] + "</p><br/>";
      
                  // entry
                  entry = {
                     title: title,
                     startTime: seconds(timecode[1]),
                     endTime: seconds(timecode[2]),
                     text: text
                  };
      
                  cue = { time: entry.startTime, subtitle: entry };
      
                  player.subtitles.push(entry);
                  player.cuepoints.push(cue);
                  player.cuepoints.push({ time: entry.endTime, subtitleEnd: title });
      
                  // initial cuepoint
                  if (entry.startTime === 0) {
                     player.trigger("cuepoint", cue);
                  }
      
               }
      
            }
      
         }).fail(function() {
            player.trigger("error", {code: 8, url: url });
            return false;
         });
	  
	  return player;
	  
   };

   /*** Behaviour ***/
 
   player.bind("cuepoint", function(e, api, cue) {

      if (cue.subtitle) {
         currentPoint = cue.index;
         wrap.html(cue.subtitle.text).addClass("fp-active");

      } else if (cue.subtitleEnd) {
         wrap.removeClass("fp-active");
      }

   }).bind("seek", function() {

      var time = player.video.time;

      $.each(player.cuepoints || [], function(i, cue) {
         var entry = cue.subtitle;

         if (entry && currentPoint != cue.index) {
            if (time >= cue.time && time <= entry.endTime) player.trigger("cuepoint", cue);
            else wrap.removeClass("fp-active");
         }

      });

   });

   root.bind("load", function() {
      if (player.conf.captioned) {
         api.captioned = player.conf.captioned;
         root.addClass("is-captioned");
      }
   }).bind("caption", function() {
      player.captioned = !player.captioned;
	  root.toggleClass("is-captioned", player.captioned);
   });
   
   /* togglers */
   player['captions'] = function() {
      return player.trigger('caption');
   };
   
   // use native when supported
   if (flowplayer.support.subtitles) {
      if (player.conf.nativesubtitles && player.conf.engine == 'html5') return;
   }
   
   var tracks = $("track", root);
   
   if (tracks.length == 0) return;
   
   var defaultTrack = $("track[default]", root);
   if (defaultTrack.length == 0) {
      defaultTrack = tracks[0];
   }
   
   // avoid duplicate loads
   // TODO: Test to ensure this is not necessary
   // tracks.remove();
   
   player.loadSubtitles($(defaultTrack).attr("src"));

});


