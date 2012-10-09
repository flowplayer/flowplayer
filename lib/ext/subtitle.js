
var TRACK_EL = $("<track/>")[0];

flowplayer.support.subtitles = !!TRACK_EL.track;

// TODO: remove in 6.0
$.extend($.support, flowplayer.support);


flowplayer(function(player, root, engine) {

   var track = $("track", root),
      conf = player.conf;

   if (flowplayer.support.subtitles) {

      player.subtitles = track.length && track[0].track;

      // use native when supported
      if (conf.nativesubtitles && conf.engine == 'html5') return;
   }


   // avoid duplicate loads
   track.remove();

   // Thanks: https://github.com/delphiki/Playr/blob/master/playr.js#L569
   var TITLE_RE = /^([a-zA-Z0-9_]+)$/,
      TIMECODE_RE = /^([0-9]{2}:[0-9]{2}:[0-9]{2}[,.]{1}[0-9]{3}) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}[,.]{1}[0-9]{3})(.*)$/;

   function seconds(timecode) {
      var tab = timecode.split(':');
      return tab[0]*60*60 + tab[1]*60 + parseFloat(tab[2].replace(',','.'));
   }

   player.subtitles = [];

   var url = track.attr("src");

   $.get(url, function(txt) {

      for (var i = 0, lines = txt.split(/\r?\n/), len = lines.length, entry = {}, title, timecode, text, cue; i < len; i++) {

         if (TITLE_RE.test(lines[i])) {

            // title
            title = lines[i];

            // timecode
            timecode = TIMECODE_RE.exec(lines[++i]);

            // text
            text = "<p>" + lines[++i] + "</p><br/>";
            while (lines[++i] && i < lines.length) text +=  "<p>" + lines[i] + "</p><br/>";

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
               player.trigger("cuepoint", [player, cue]);
            }
         }

      }

   }).fail(function() {
      root.trigger("error", [player, { code: 8, url: url }]);
      return false;
   });

   var wrap = $("<div class='fp-subtitle'/>", root).appendTo(root);

   player.bind("cuepoint", function(e, api, cuepoint) {

      if (cuepoint.subtitle) {
         wrap.html(cuepoint.subtitle.text).addClass("fp-active");

      } else if (cuepoint.subtitleEnd) {
         wrap.removeClass("fp-active");
      }

   }).bind("beforeseek", function() {
      wrap.removeClass("fp-active");

   });

});


