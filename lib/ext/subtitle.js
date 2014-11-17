
flowplayer(function(player, root, engine) {

   var track = $("track", root),
      conf = player.conf;

   if (flowplayer.support.subtitles) {

      player.subtitles = track.length && track[0].track;

      if (conf.nativesubtitles && conf.engine == 'html5') {
        if (!player.subtitles) return;
        var setMode = function(mode) {
          var tracks = $('video', root)[0].textTracks;
          if (!tracks.length) return;
          tracks[0].mode = mode;
        };
        setMode('disabled');
        player.one('ready', function() {
          if (player.conf.splash) { // see https://github.com/flowplayer/flowplayer/issues/717
            $('video.fp-engine', root).append($('<track />').attr({
              kind: 'subtitles',
              srclang: player.subtitles.language || 'en',
              label: player.subtitles.language || 'en',
              src: track.attr('src'),
              default: 'default'
            }));
          }
          setMode('disabled');
          setMode('showing');
        });
        return;
      }
   }

   // avoid duplicate loads
   track.remove();

   var TIMECODE_RE = /^(([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3}) --\> (([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3})(.*)/;

   function seconds(timecode) {
      var els = timecode.split(':');
      if (els.length == 2) els.unshift(0);
      return els[0] * 60 * 60 + els[1] * 60 + parseFloat(els[2].replace(',','.'));
   }

   player.subtitles = [];

   var url = track.attr("src");

   if (!url) return;
   setTimeout(function() {
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
                  endTime: seconds(timecode[3]),
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
   });
   var wrap = $("<div class='fp-subtitle'/>").appendTo(root),
      currentPoint;

   player.bind("cuepoint", function(e, api, cue) {

      if (cue.subtitle) {
         currentPoint = cue.index;
         wrap.html(cue.subtitle.text).addClass("fp-active");

      } else if (cue.subtitleEnd) {
         wrap.removeClass("fp-active");
         currentPoint = cue.index;
      }

   }).bind("seek", function(e, api, time) {
      // Clear future subtitles if seeking backwards
      if (currentPoint && player.cuepoints[currentPoint] && player.cuepoints[currentPoint].time > time) {
         wrap.removeClass('fp-active');
         currentPoint = null;
      }
      $.each(player.cuepoints || [], function(i, cue) {
         var entry = cue.subtitle;
         //Trigger cuepoint if start time before seek position and end time nonexistent or in the future
         if (entry && currentPoint != cue.index) {
            if (time >= cue.time && (!entry.endTime || time <= entry.endTime)) player.trigger("cuepoint", cue);
         } // Also handle cuepoints that act as the removal trigger
         else if (cue.subtitleEnd && time >= cue.time && cue.index == currentPoint + 1) player.trigger("cuepoint", cue);
      });

   });

});


