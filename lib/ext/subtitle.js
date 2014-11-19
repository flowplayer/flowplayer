var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    common = require('../common'),
    ClassList = require('class-list');

flowplayer.defaults.subtitleParser = function(txt) {
  var TIMECODE_RE = /^(([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3}) --\> (([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3})(.*)/;

  function seconds(timecode) {
     var els = timecode.split(':');
     if (els.length == 2) els.unshift(0);
     return els[0] * 60 * 60 + els[1] * 60 + parseFloat(els[2].replace(',','.'));
  }

  var entries = [];
  for (var i = 0, lines = txt.split("\n"), len = lines.length, entry = {}, title, timecode, text, cue; i < len; i++) {
    timecode = TIMECODE_RE.exec(lines[i]);

    if (timecode) {

      // title
      title = lines[i - 1];

      // text
      text = "<p>" + lines[++i] + "</p><br/>";
      while (typeof lines[++i] === 'string' && lines[i].trim() && i < lines.length) text +=  "<p>" + lines[i] + "</p><br/>";

      // entry
      entry = {
        title: title,
        startTime: seconds(timecode[1]),
        endTime: seconds(timecode[3]),
        text: text
      };
      entries.push(entry);
    }
  }
  return entries;
};

flowplayer(function(p, root) {
  var wrapClasses, currentPoint, wrap;

  var createUIElements = function() {
    wrap = Sizzle('.fp-subtitle', root)[0];
    wrap = wrap || common.appendTo(common.createElement('div', {'class': 'fp-subtitle'}), root);
    Array.prototype.forEach.call(wrap.children, common.removeNode);
    wrapClasses = ClassList(wrap);
  };


  p.on('ready',  function(ev, player, video) {
    var conf = player.conf;
    if (flowplayer.support.subtitles && conf.nativesubtitles && player.engine.engineName == 'html5') {
      var setMode = function(mode) {
        var tracks = Sizzle('video', root)[0].textTracks;
        if (!tracks.length) return;
        tracks[0].mode = mode;
      };
      if (!video.subtitles || !video.subtitles.length) return;
      var videoTag = Sizzle('video.fp-engine', root)[0];
      video.subtitles.forEach(function(st) {
        videoTag.appendChild(common.createElement('track', {
          kind: 'subtitles',
          srclang: st.srclang || 'en',
          label: st.label || 'en',
          src: st.src,
          'default': st.default
        }));
      });
      setMode('disabled');
      setMode('showing');
      return;
    }

    player.subtitles = [];

    createUIElements();

    if (!video.subtitles || !video.subtitles.length) return;

    player.loadSubtitles(0);
  });

  p.bind("cuepoint", function(e, api, cue) {
    if (cue.subtitle) {
       currentPoint = cue.index;
       common.html(wrap, cue.subtitle.text);
       wrapClasses.add('fp-active');
    } else if (cue.subtitleEnd) {
       wrapClasses.remove('fp-active');
       currentPoint = cue.index;
    }
  });

  p.bind("seek", function(e, api, time) {
    // Clear future subtitles if seeking backwards
    if (currentPoint && p.cuepoints[currentPoint] && p.cuepoints[currentPoint].time > time) {
       wrapClasses.remove('fp-active');
       currentPoint = null;
    }
    (p.cuepoints || []).forEach(function(cue) {
      var entry = cue.subtitle;
      //Trigger cuepoint if start time before seek position and end time nonexistent or in the future
      if (entry && currentPoint != cue.index) {
        if (time >= cue.time && (!entry.endTime || time <= entry.endTime)) player.trigger("cuepoint", cue);
      } // Also handle cuepoints that act as the removal trigger
      else if (cue.subtitleEnd && time >= cue.time && cue.index == currentPoint + 1) p.trigger("cuepoint", cue);
    });

  });

  p.disableSubtitles = function() {
    p.subtitles = [];
    (p.cuepoints || []).forEach(function(c) {
      if (c.subtitle || c.subtitleEnd) p.removeCuepoint(c);
    });
    if (wrap) Array.prototype.forEach.call(wrap.children, common.removeNode);
  };

  p.loadSubtitles = function(i) {
    //First remove possible old subtitles
    p.disableSubtitles();

    var st = p.video.subtitles[i];

    var url = st.src;
    if (!url) return;
    common.xhrGet(url, function(txt) {
      var entries = p.conf.subtitleParser(txt);
      entries.forEach(function(entry) {
        var cue = { time: entry.startTime, subtitle: entry };
        p.subtitles.push(entry);
        p.cuepoints.push(cue);
        p.cuepoints.push({ time: entry.endTime, subtitleEnd: entry.title });

        // initial cuepoint
        if (entry.startTime === 0 && !p.video.time) {
          p.trigger("cuepoint", [p, cue]);
        }
      });
    }, function() {
      p.trigger("error", {code: 8, url: url });
      return false;
    });

  };
});

