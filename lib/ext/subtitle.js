'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    bean = require('bean')
  , parser = require('./subtitles/parser');

flowplayer.defaults.subtitleParser = parser;

flowplayer(function(p, root) {
  var currentPoint, wrap,
      subtitleControl, subtitleMenu, changeHandler;

  if (
    !flowplayer.support.inlineVideo ||
      (!flowplayer.support.fullscreen  && p.conf.native_fullscreen)) p.conf.nativesubtitles = true;

  if (!p.ui) p.ui = {};
  p.ui.createSubtitleControl = function(subtitles, onChange) {
    changeHandler = onChange;
    subtitleControl = subtitleControl || common.createElement('strong', { className: 'fp-cc' }, 'CC');
    subtitleMenu = subtitleMenu || common.createElement('div', {className: 'fp-menu fp-subtitle-menu'}, '<strong>Closed Captions</strong>');
    common.find('a', subtitleMenu).forEach(common.removeNode);
    subtitleMenu.appendChild(common.createElement('a', {'data-subtitle-index': -1}, 'No subtitles'));
    (subtitles || []).forEach(function(st, i) {
      var srcLang = st.srclang || 'en',
          label = st.label || 'Default (' + srcLang + ')';
      var item = common.createElement('a', {'data-subtitle-index': i}, label);
      subtitleMenu.appendChild(item);
    });
    common.find('.fp-ui', root)[0].appendChild(subtitleMenu);
    common.find('.fp-controls', root)[0].appendChild(subtitleControl);
    common.toggleClass(subtitleControl, 'fp-hidden', !subtitles || !subtitles.length);
    return subtitleControl;
  };

  p.ui.setActiveSubtitleItem = function(idx) {
    setActiveSubtitleClass(idx);
  };

  bean.on(root, 'click', '.fp-cc', function() {
    if (common.hasClass(subtitleMenu, 'fp-active')) p.hideMenu();
    else p.showMenu(subtitleMenu);
  });

  bean.on(root, 'click', '.fp-subtitle-menu [data-subtitle-index]', function(ev) {
    ev.preventDefault();
    var idx = ev.target.getAttribute('data-subtitle-index');
    if (changeHandler) return changeHandler(idx);
    if (idx === '-1') return p.disableSubtitles();
    p.loadSubtitles(idx);
  });

  var createUIElements = function() {
    wrap = common.find('.fp-captions', root)[0];
    wrap = wrap || common.appendTo(common.createElement('div', {'class': 'fp-captions'}), common.find('.fp-player', root)[0]);
    Array.prototype.forEach.call(wrap.children, common.removeNode);
    p.ui.createSubtitleControl(p.video.subtitles);
  };


  p.on('ready',  function(ev, player, video) {
    player.subtitles = [];

    createUIElements();

    common.removeClass(root, 'has-menu');

    p.disableSubtitles();

    if (!video.subtitles || !video.subtitles.length) return;

    var defaultSubtitle = video.subtitles.filter(function(one) {
      return one['default'];
    })[0];
    if (defaultSubtitle) player.loadSubtitles(video.subtitles.indexOf(defaultSubtitle));
  });

  p.showSubtitle = function(text) {
    common.html(wrap, text);
    common.addClass(wrap, 'fp-shown');
  };

  p.hideSubtitle = function() {
    common.removeClass(wrap, 'fp-shown');
  };

  p.bind("cuepoint", function(e, api, cue) {
    if (cue.subtitle) {
       currentPoint = cue.index;
       p.showSubtitle(cue.subtitle.text);
    } else if (cue.subtitleEnd) {
       p.hideSubtitle();
       currentPoint = cue.index;
    }
  });

  p.bind("seek", function(e, api, time) {
    // Clear future subtitles if seeking backwards
    if (currentPoint && p.cuepoints[currentPoint] && p.cuepoints[currentPoint].time > time) {
       common.removeClass(wrap, 'fp-shown');
       currentPoint = null;
    }
    (p.cuepoints || []).forEach(function(cue, index) {
      var entry = cue.subtitle;
      //Trigger cuepoint if start time before seek position and end time nonexistent or in the future
      if (entry && currentPoint != index) {
        if (time >= cue.time && (!entry.endTime || time <= entry.endTime)) p.trigger("cuepoint", [p, cue]);
      } // Also handle cuepoints that act as the removal trigger
      else if (cue.subtitleEnd && time >= cue.time && index == currentPoint + 1) {
        p.trigger("cuepoint", [p, cue]);
      }
    });

  });

  p.on('unload', function () {
    common.find('.fp-captions', root).forEach(common.removeNode);
  });

  var setActiveSubtitleClass = function(idx) {
    common.toggleClass(common.find('a.fp-selected', subtitleMenu)[0], 'fp-selected');
    common.toggleClass(common.find('a[data-subtitle-index="' + idx + '"]', subtitleMenu)[0], 'fp-selected');
  };

  var setNativeMode = function(i, mode) {
    var tracks = common.find('video.fp-engine', root)[0].textTracks;
    if (!tracks.length) return;
    if (i === null) {
      [].forEach.call(tracks, function(track) { track.mode = mode; });
    }
    else tracks[i].mode = mode;
  };

  p.disableSubtitles = function() {
    p.subtitles = [];
    (p.cuepoints || []).forEach(function(c) {
      if (c.subtitle || c.subtitleEnd) p.removeCuepoint(c);
    });
    if (wrap) Array.prototype.forEach.call(wrap.children, common.removeNode);
    setActiveSubtitleClass(-1);
    if (flowplayer.support.subtitles && p.conf.nativesubtitles && p.engine.engineName == 'html5') {
      setNativeMode(null, 'disabled');
    }
    return p;
  };

  p.loadSubtitles = function(i) {
    //First remove possible old subtitles
    p.disableSubtitles();

    var st = p.video.subtitles[i];

    var url = st.src;
    if (!url) return;
    setActiveSubtitleClass(i);

    if (flowplayer.support.subtitles && p.conf.nativesubtitles && p.engine.engineName == 'html5') {
      setNativeMode(i, 'showing');
      return;
    }
    common.xhrGet(url, function(txt) {
      var entries = p.conf.subtitleParser(txt);
      entries.forEach(function(entry, idx) {
        if (!entry.title) entry.title = 'subtitle' + idx;
        var cue = { time: entry.startTime, subtitle: entry, visible: false };
        p.subtitles.push(entry);
        p.addCuepoint(cue);
        p.addCuepoint({ time: entry.endTime, subtitleEnd: entry.title, visible: false });

        // initial cuepoint
        if (entry.startTime === 0 && !p.video.time && !p.splash) {
          p.trigger("cuepoint", [p, flowplayer.extend({}, cue, { index: 0 })]);
        }
        if (p.splash) p.one('ready', function() { p.trigger('cuepoint', [p, cue]); });
      });
    }, function() {
      p.trigger("error", {code: 8, url: url });
      return false;
    });
    return p;
  };
});

