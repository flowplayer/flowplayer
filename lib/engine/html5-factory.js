/*eslint indent: ["error", 2]*/
/*eslint quotes: ["error", "single"]*/

var flowplayer = require('../flowplayer')
  , common = flowplayer.common
  , support = flowplayer.support
  , bean = flowplayer.bean
  , extend = flowplayer.extend;

var desktopSafari = support.browser.safari && !support.iOS;
// HTML5 --> Flowplayer event
var EVENTS = {
  ended: 'finish',
  pause: 'pause',
  play: 'resume',
  timeupdate: 'progress',
  volumechange: 'volume',
  ratechange: 'speed',
  seeked: 'seek',
  loadedmetadata: !desktopSafari ? 'ready' : 0,
  canplaythrough: desktopSafari ? 'ready' : 0,
  durationchange: 'ready',
  error: 'error',
  dataunavailable: 'error',
  webkitendfullscreen: !flowplayer.support.inlineVideo && 'unload',
  progress: 'buffer'
};


function html5factory(engineName, player, root, canPlay, ext) {
  var api = common.findDirect('video', root)[0] || common.find('.fp-player > video', root)[0]
    , conf = player.conf
    , timer
    , volumeLevel
    , self;
  return self = {
    engineName: engineName,

    pick: function(sources) {
      var source = support.video && sources.filter(function(s) {
        return canPlay(s.type);
      })[0];

      if (!source) return;
      if (typeof source.src === 'string') source.src = common.createAbsoluteUrl(source.src);
      return source;
    },

    load: function(video) {
      var container = common.find('.fp-player', root)[0]
        , created = false;

      if (!api) {
        api = document.createElement('video');
        common.prepend(container, api);
        api.autoplay = !!conf.splash;
        created = true;
      }
      common.addClass(api, 'fp-engine');
      common.find('track', api).forEach(common.removeNode);
      api.preload = 'none';

      if (!conf.nativesubtitles) common.attr(api, 'crossorigin', false);

      if (!conf.disableInline) {
        api.setAttribute('webkit-playsinline', 'true');
        api.setAttribute('playsinline', 'true');
      }

      if (!support.inlineVideo) {
        common.css(api, {
          position: 'absolute',
          top: '-9999em'
        });
      }

      if (support.subtitles && conf.nativesubtitles && video.subtitles && video.subtitles.length) {
        common.addClass(api, 'native-subtitles');
        var subtitles = video.subtitles;
        var setMode = function(mode) {
          var tracks = api.textTracks;
          if (!tracks.length) return;
          tracks[0].mode = mode;
        };
        if (subtitles.some(function(st) { return !common.isSameDomain(st.src); })) common.attr(api, 'crossorigin', 'anonymous');
        if (typeof api.textTracks.addEventListener === 'function') api.textTracks.addEventListener('addtrack', function() {
          setMode('disabled');
          setMode('showing');
        });
        subtitles.forEach(function(st) {
          api.appendChild(common.createElement('track', {
            kind: 'subtitles',
            srclang: st.srclang || 'en',
            label: st.label || 'en',
            src: st.src,
            'default': st['default']
          }));
        });
      }

      // IE does not fire delegated timeupdate events
      bean.off(api, 'timeupdate', common.noop);
      bean.on(api, 'timeupdate', common.noop);

      common.prop(api, 'loop', false);
      player.off('.loophack');
      if (video.loop || conf.loop) {
        player.on('finish.loophack', function() { player.resume(); });
      }

      if (typeof volumeLevel !== 'undefined') {
        api.volume = volumeLevel;
      }

      var extra = ext(video, api, self);
      if (conf.autoplay || conf.splash || video.autoplay) {
        player.debug('Autoplay / Splash setup, try to start video');
        api.load();
        var play = function () {
          try {
            var p = api.play();
            if (p && p.catch) {
              var recoverAutoplay = function(err) {
                if (err.name === 'AbortError' && err.code === 20) {
                  if (!created) return api.play().catch(recoverAutoplay);
                  else return;
                }
                if (!conf.mutedAutoplay) throw new Error('Unable to autoplay');
                player.debug('Play errored, trying muted', err);
                player.mute(true, true);
                return api.play();
              }
              p.catch(recoverAutoplay).catch(function() {
                conf.autoplay = false;
                player.mute(false, true); // Restore volume as playback failed
                player.trigger('stop', [player]);
              });
            }
          } catch(e) {
            player.debug('play() error thrown', e);
          }
        };
        if (api.readyState > 0) play();
        else bean.one(api, 'canplay', play);
      }

      self._listeners = listen(api, common.find('source', api).concat(api), video, extra) || self._listeners;

      if (conf.autoplay || conf.splash || video.autoplay) return; // No preload check needed
      var preloadCheck = function() {
        if (!isInViewport(root)) return;
        player.debug('player is in viewport, preload');
        if (support.preloadMetadata) api.preload = 'metadata';
        else api.load();
        bean.off(document, 'scroll.preloadviewport');
      };
      bean.off(document, 'scroll.preloadviewport');
      bean.on(document, 'scroll.preloadviewport', function() {
        window.requestAnimationFrame(preloadCheck);
      });
      preloadCheck();
    },

    mute: function(flag) {
      api.muted = !!flag;
      player.trigger('mute', [player, flag]);
      player.trigger('volume', [player, flag ? 0 : api.volume]);
    },

    pause: function() {
      api.pause();
    },

    resume: function() {
      api.play();
    },

    speed: function(val) {
      api.playbackRate = val;
    },

    seek: function(time) {
      var pausedState = api.paused || player.finished;
      try {
        api.currentTime = time;
        if (pausedState) bean.one(api, 'seeked', function() { api.pause(); });
      } catch (ignored) {}
    },

    volume: function(level) {
      volumeLevel = level;
      if (api) {
        api.volume = level;
        if (level) self.mute(false);
      }
    },

    unload: function() {
      bean.off(document, 'scroll.preloadviewport');
      common.find('video.fp-engine', root).forEach(function (videoTag) {
        if ('MediaSource' in window) {
          videoTag.src = URL.createObjectURL(new MediaSource());
        } else {
          videoTag.src = '';
        }
        common.removeNode(videoTag);
      });
      timer = clearInterval(timer);
      var instanceId = root.getAttribute('data-flowplayer-instance-id');
      delete api.listeners[instanceId];
      api = 0;
      if (self._listeners) Object.keys(self._listeners).forEach(function(typ) {
        self._listeners[typ].forEach(function(l) {
          root.removeEventListener(typ, l, true);
        });
      });
    }
  };

  function listen(api, sources, video, extra) {
      // listen only once
    var instanceId = root.getAttribute('data-flowplayer-instance-id');

    if (api.listeners && api.listeners.hasOwnProperty(instanceId)) {
      api.listeners[instanceId] = video;
      return;
    }
    (api.listeners || (api.listeners = {}))[instanceId] = video;

    bean.on(sources, 'error', function(e) {
      try {
        if (canPlay(e.target.getAttribute('type'))) {
          player.trigger('error', [player, { code: 4, video: extend(video, {src: api.src, url: api.src}) }]);
        }
      } catch (er) {
         // Most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
      }
    });

    player.on('shutdown', function() {
      bean.off(sources);
      bean.off(api, '.dvrhack');
      player.off('.loophack');
    });

    var eventListeners = {};
    //Special event handling for HLS metadata events

    var listenMetadata = function(track) {
      if (track.kind !== 'metadata') return;
      track.mode = 'hidden';
      track.addEventListener('cuechange', function() {
        if (!track.activeCues.length) return;
        player.trigger('metadata', [player, track.activeCues[0].value]);
      }, false);
    };

    if (api && api.textTracks && api.textTracks.length) Array.prototype.forEach.call(api.textTracks, listenMetadata);
    if (api && api.textTracks && typeof api.textTracks.addEventListener === 'function') api.textTracks.addEventListener('addtrack', function(tev) {
      listenMetadata(tev.track);
    }, false);
    if (player.conf.dvr || player.dvr || video.dvr) {
      bean.on(api, 'progress.dvrhack', function() {
        if (!api.seekable.length) return;
        player.video.duration = api.seekable.end(null);
        player.video.seekOffset = api.seekable.start(null);
        player.trigger('dvrwindow', [player, {
          start: api.seekable.start(null),
          end: api.seekable.end(null)
        }]);
        if (api.currentTime >= api.seekable.start(null)) return;
        api.currentTime = api.seekable.start(null);
      });
    }

    Object.keys(EVENTS).forEach(function(type) {
      var flow = EVENTS[type];
      if (type === 'webkitendfullscreen' && player.conf.disableInline) flow = 'unload';
      if (!flow) return;
      var l = function(e) {
        video = api.listeners[instanceId];
        if (!e.target || !common.hasClass(e.target, 'fp-engine')) return;

        if (!/progress/.test(flow)) player.debug(type, '->', flow, e);

        var triggerEvent = function(f) {
          player.trigger(f || flow, [player, arg]);
        };

        // no events if player not ready
        if (!player.ready && !/ready|error/.test(flow) || !flow || !common.find('video', root).length) {
          if (flow === 'resume') player.one('ready', function() { setTimeout(function() { triggerEvent(); }) });
          return;
        }
        var arg;

        if (flow === 'unload') { //Call player unload
          player.unload();
          return;
        }

        switch (flow) {

        case 'ready':
          if (player.ready) return player.debug('Player already ready, not sending duplicate ready event');
          if ((!api.duration || api.duration === Infinity) && !player.live) return player.debug('No duration and VOD setup, not sending ready event');
          arg = extend(video, {
            duration: api.duration < Number.MAX_VALUE ? api.duration : 0,
            width: api.videoWidth,
            height: api.videoHeight,
            url: api.currentSrc
          });
          arg.seekable = arg.duration;
          player.debug('Ready: ', arg);

          if (!player.live && !arg.duration && !support.hlsDuration && type === 'loadeddata') {
            var durationChanged = function() {
              arg.duration = api.duration;
              try {
                arg.seekable = api.seekable && api.seekable.end(null);

              } catch (ignored) {}
              triggerEvent();
              api.removeEventListener('durationchange', durationChanged);
              common.toggleClass(root, 'is-live', false);
            };
            api.addEventListener('durationchange', durationChanged);

            // Ugly hack to handle broken Android devices
            var timeUpdated = function() {
              if (!player.ready && !api.duration) { // No duration even though the video already plays
                arg.duration = 0;
                common.addClass(root, 'is-live'); // Make UI believe it's live
                triggerEvent();
              }
              api.removeEventListener('timeupdate', timeUpdated);
            };
            api.addEventListener('timeupdate', timeUpdated);
            return;
          }

          break;

        case 'progress': case 'seek':

          if (api.currentTime > 0 || player.live) {
            arg = Math.max(api.currentTime, 0);

          } else if (flow === 'seek' && api.currentTime === 0) {
            arg = 0;
          } else if (flow == 'progress') {
            return;
          }
          break;

        case 'buffer':
          arg = [];
          for (var i=0; i < api.buffered.length; i++) {
            arg.push({
              start: api.buffered.start(i),
              end: api.buffered.end(i)
            });
          }
          if (api.buffered.length && api.buffered.end(null) === api.duration) triggerEvent('buffered');
          break;

        case 'speed':
          arg = round(api.playbackRate);
          break;

        case 'volume':
          arg = round(api.muted ? 0 : api.volume);
          break;

        case 'error':
          try {
            if (extra && extra.handlers && extra.handlers.error) {
              var handled = extra.handlers.error(e, api);
              if (handled) return;
            }
            arg = (e.srcElement || e.originalTarget).error;
            arg.video = extend(video, {src: api.src, url: api.src});
          } catch (er) {
            // Most likely https://bugzilla.mozilla.org/show_bug.cgi?id=208427
            return;
          }
        }

        triggerEvent();


      };
      root.addEventListener(type, l, true);
      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type].push(l);

    });
    return eventListeners;

  }

}

module.exports = html5factory;

function round(val, per) {
  per = per || 100;
  return Math.round(val * per) / per;
}

function isInViewport(elem) {
  var rect = elem.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + rect.width /*or $(window).width() */
  );
}
