'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    bean = require('bean');

flowplayer.defaults.subtitleParser = function(txt) {
  var TIMECODE_RE = /^(([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3}) --\> (([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{3})(.*)/;

  function seconds(timecode) {
     var els = timecode.split(':');
     if (els.length == 2) els.unshift(0);
     return els[0] * 60 * 60 + els[1] * 60 + parseFloat(els[2].replace(',','.'));
  }

  var entries = [];
  for (var i = 0, lines = txt.split("\n"), len = lines.length, entry = {}, title, timecode, text; i < len; i++) {
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
  var currentPoint, wrap,
      subtitleControl, subtitleMenu;

  var createSubtitleControl = function() {
    subtitleControl = common.createElement('strong', { className: 'fp-cc' }, 'CC');
    subtitleMenu = common.createElement('div', {className: 'fp-menu fp-subtitle-menu'}, '<strong>Closed Captions</strong>');
    subtitleMenu.appendChild(common.createElement('a', {'data-subtitle-index': -1}, 'No subtitles'));
    (p.video.subtitles || []).forEach(function(st, i) {
      var srcLang = st.srclang || 'en',
          label = st.label || 'Default (' + srcLang + ')';
      var item = common.createElement('a', {'data-subtitle-index': i}, label);
      subtitleMenu.appendChild(item);
    });
    common.find('.fp-ui', root)[0].appendChild(subtitleMenu);
    common.find('.fp-controls', root)[0].appendChild(subtitleControl);
    return subtitleControl;
  };

  bean.on(root, 'click', '.fp-cc', function() {
    //TODO fix
    common.toggleClass(subtitleMenu, 'fp-active');
  });

  bean.on(root, 'click', '.fp-subtitle-menu [data-subtitle-index]', function(ev) {
    ev.preventDefault();
    var idx = ev.target.getAttribute('data-subtitle-index');
    if (idx === '-1') return p.disableSubtitles();
    p.loadSubtitles(idx);
  });

  var createUIElements = function() {
    wrap = common.find('.fp-subtitle', root)[0];
    wrap = wrap || common.appendTo(common.createElement('div', {'class': 'fp-captions'}), common.find('.fp-player', root)[0]);
    Array.prototype.forEach.call(wrap.children, common.removeNode);
    common.find('.fp-subtitle-menu', root).forEach(common.removeNode);
    createSubtitleControl();
  };


  p.on('ready',  function(ev, player, video) {
    var conf = player.conf;
    if (flowplayer.support.subtitles && conf.nativesubtitles && player.engine.engineName == 'html5') {
      var setMode = function(mode) {
        var tracks = common.find('video', root)[0].textTracks;
        if (!tracks.length) return;
        tracks[0].mode = mode;
      };
      if (!video.subtitles || !video.subtitles.length) return;
      var videoTag = common.find('video.fp-engine', root)[0];
      if (video.subtitles.some(function(st) { return !common.isSameDomain(st.src); })) common.attr(videoTag, 'crossorigin', 'anonymous');
      if (typeof videoTag.textTracks.addEventListener === 'function') videoTag.textTracks.addEventListener('addtrack', function() {
        setMode('disabled');
        setMode('showing');
      });
      video.subtitles.forEach(function(st) {
        videoTag.appendChild(common.createElement('track', {
          kind: 'subtitles',
          srclang: st.srclang || 'en',
          label: st.label || 'en',
          src: st.src,
          'default': st['default']
        }));
      });
      return;
    }

    player.subtitles = [];

    createUIElements();

    common.removeClass(root, 'has-menu');

    p.disableSubtitles();

    common.toggleClass(subtitleControl, 'fp-hidden', !video.subtitles || !video.subtitles.length);
    if (!video.subtitles || !video.subtitles.length) return;

    var defaultSubtitle = video.subtitles.filter(function(one) {
      return one['default'];
    })[0];
    if (defaultSubtitle) player.loadSubtitles(video.subtitles.indexOf(defaultSubtitle));
  });

  p.bind("cuepoint", function(e, api, cue) {
    if (cue.subtitle) {
       currentPoint = cue.index;
       common.html(wrap, cue.subtitle.text);
       common.addClass(wrap, 'fp-shown');
    } else if (cue.subtitleEnd) {
       common.removeClass(wrap, 'fp-shown');
       currentPoint = cue.index;
    }
  });

  p.bind("seek", function(e, api, time) {
    // Clear future subtitles if seeking backwards
    if (currentPoint && p.cuepoints[currentPoint] && p.cuepoints[currentPoint].time > time) {
       common.removeClass(wrap, 'fp-shown');
       currentPoint = null;
    }
    (p.cuepoints || []).forEach(function(cue) {
      var entry = cue.subtitle;
      //Trigger cuepoint if start time before seek position and end time nonexistent or in the future
      if (entry && currentPoint != cue.index) {
        if (time >= cue.time && (!entry.endTime || time <= entry.endTime)) p.trigger("cuepoint", [p, cue]);
      } // Also handle cuepoints that act as the removal trigger
      else if (cue.subtitleEnd && time >= cue.time && cue.index == currentPoint + 1) p.trigger("cuepoint", [p, cue]);
    });

  });

  var setActiveSubtitleClass = function(idx) {
    common.toggleClass(common.find('a.fp-selected', subtitleMenu)[0], 'fp-selected');
    common.toggleClass(common.find('a[data-subtitle-index="' + idx + '"]', subtitleMenu)[0], 'fp-selected');
  };

  p.disableSubtitles = function() {
    p.subtitles = [];
    (p.cuepoints || []).forEach(function(c) {
      if (c.subtitle || c.subtitleEnd) p.removeCuepoint(c);
    });
    if (wrap) Array.prototype.forEach.call(wrap.children, common.removeNode);
    setActiveSubtitleClass(-1);
    return p;
  };

  p.loadSubtitles = function(i) {
    //First remove possible old subtitles
    p.disableSubtitles();

    var st = p.video.subtitles[i];

    var url = st.src;
    if (!url) return;
    setActiveSubtitleClass(i);
    common.xhrGet(url, function(txt) {
      var entries = p.conf.subtitleParser(txt);
      entries.forEach(function(entry) {
        var cue = { time: entry.startTime, subtitle: entry, visible: false };
        p.subtitles.push(entry);
        p.addCuepoint(cue);
        p.addCuepoint({ time: entry.endTime, subtitleEnd: entry.title, visible: false });

        // initial cuepoint
        if (entry.startTime === 0 && !p.video.time) {
          p.trigger("cuepoint", [p, cue]);
        }
      });
    }, function() {
      p.trigger("error", {code: 8, url: url });
      return false;
    });
    return p;
  };
});

