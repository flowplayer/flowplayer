'use strict';
var extend = require('extend-object'),
    isFunction = require('is-function'),
    bean = require('bean'),
    slider = require('./ext/ui/slider'),
    barSlider = require('./ext/ui/bar-slider'),
    common = require('./common'),
    events = require('./ext/events');

var instances = [],
   extensions = [];


var oldHandler = window.onbeforeunload;
window.onbeforeunload = function(ev) {
  instances.forEach(function(api) {
    if (api.conf.splash) {
      api.unload();
    } else {
      api.bind("error", function () {
        common.find('.flowplayer.is-error .fp-message').forEach(common.removeNode);
      });
    }
  });
  if (oldHandler) return oldHandler(ev);
};

var supportLocalStorage = false;
try {
  if (typeof window.localStorage == "object") {
    window.localStorage.flowplayerTestStorage = "test";
    supportLocalStorage = true;
  }
} catch (ignored) {}

var isSafari = /Safari/.exec(navigator.userAgent) && !/Chrome/.exec(navigator.userAgent),
    m = /(\d+\.\d+) Safari/.exec(navigator.userAgent),
    safariVersion = m ? Number(m[1]) : 100;

/* flowplayer()  */
var flowplayer = module.exports = function(fn, opts, callback) {
  if (isFunction(fn)) return extensions.push(fn);
  if (typeof fn == 'number' || typeof fn === 'undefined') return instances[fn || 0];
  if (fn.nodeType) { // Is an element
    if (fn.getAttribute('data-flowplayer-instance-id') !== null) { // Already flowplayer instance
      return instances[fn.getAttribute('data-flowplayer-instance-id')];
    }
    if (!opts) return; // Can't initialize without data
    return initializePlayer(fn, opts, callback);
  }
  if (fn.jquery) return flowplayer(fn[0], opts, callback);
  if (typeof fn === 'string') {
    var el = common.find(fn)[0];
    return el && flowplayer(el, opts, callback);
  }
};

extend(flowplayer, {

   version: '@VERSION',

   engines: [],

   extensions: [],

   conf: {},

   set: function(key, value) {
      if (typeof key === 'string') flowplayer.conf[key] = value;
      else extend(flowplayer.conf, key);
   },

   registerExtension: function(js, css) {
     flowplayer.extensions.push([js, css]);
   },

   support: {},

   defaults: {

      debug: supportLocalStorage ? !!localStorage.flowplayerDebug : false,

      // true = forced playback
      disabled: false,

      fullscreen: window == window.top,

      // keyboard shortcuts
      keyboard: true,

      // default aspect ratio
      ratio: 9 / 16,

      adaptiveRatio: false,

      rtmp: 0,

      proxy: 'best',

      hlsQualities: true,

      splash: false,

      live: false,
      livePositionOffset: 120,

      swf: "//@CDN/@VERSION/@CDN_PATHflowplayer.swf",
      swfHls: "//@CDN/@VERSION/@CDN_PATHflowplayerhls.swf",

      speeds: [0.25, 0.5, 1, 1.5, 2],

      tooltip: true,

      mouseoutTimeout: 5000,

      // initial volume level
      volume: !supportLocalStorage ? 1 : localStorage.muted == "true" ? 0 : !isNaN(localStorage.volume) ? localStorage.volume || 1 : 1,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#error-codes
      errors: [

         // video exceptions
         '',
         'Video loading aborted',
         'Network error',
         'Video not properly encoded',
         'Video file not found',

         // player exceptions
         'Unsupported video',
         'Skin not found',
         'SWF file not found',
         'Subtitles not found',
         'Invalid RTMP URL',
         'Unsupported video format. Try installing Adobe Flash.'
      ],
      errorUrls: ['','','','','','','','','','',
         'http://get.adobe.com/flashplayer/'
      ],
      playlist: [],

      hlsFix: isSafari && safariVersion < 8,

      disableInline: false

   },
   // Expose utilities for plugins
   bean: bean,
   common: common,
   slider: slider,
   barSlider: barSlider,
   extend: extend



});

// keep track of players
var playerCount = 0;

var URLResolver = require('./ext/resolve');



if (typeof window.jQuery !== 'undefined') {
  var $ = window.jQuery;
  // auto-install (any video tag with parent .flowplayer)
  $(function() {
     if (typeof $.fn.flowplayer == 'function') {
        $('.flowplayer:has(video,script[type="application/json"])').flowplayer();
     }
  });

  // jQuery plugin
  var videoTagConfig = function(videoTag) {
    if (!videoTag.length) return {};
    var clip = videoTag.data() || {}, conf = {};
    $.each(['autoplay', 'loop', 'preload', 'poster'], function(i, key) {
      var val = videoTag.attr(key);
      if (val !== undefined && ['autoplay', 'poster'].indexOf(key) !== -1) conf[key] = val ? val : true;
      else if (val !== undefined) clip[key] = val ? val : true;
    });
    clip.subtitles = videoTag.find('track').map(function() {
      var tr = $(this);
      return {
        src: tr.attr('src'),
        kind: tr.attr('kind'),
        label: tr.attr('label'),
        srclang: tr.attr('srclang'),
        'default': tr.prop('default')
      };
    }).get();

    clip.sources = (new URLResolver()).sourcesFromVideoTag(videoTag, $);
    return extend(conf, {clip: clip});
  };
  $.fn.flowplayer = function(opts, callback) {
    return this.each(function() {
      if (typeof opts == 'string') opts = { swf: opts };
      if (isFunction(opts)) { callback = opts; opts = {}; }
      var root = $(this),
          scriptConf = root.find('script[type="application/json"]'),
          confObject = scriptConf.length ? JSON.parse(scriptConf.text()) : videoTagConfig(root.find('video')),
          conf = $.extend({}, opts || {}, confObject, root.data());
      var api = initializePlayer(this, conf, callback);
      events.EVENTS.forEach(function(evName) {
        api.on(evName + '.jquery', function(ev) {
          root.trigger.call(root, ev.type, ev.detail && ev.detail.args);
        });
      });
      root.data('flowplayer', api);
    });
  };
}

function initializePlayer(element, opts, callback) {
  if (opts && opts.embed) opts.embed = extend({}, flowplayer.defaults.embed, opts.embed);

  var root = element,
      conf = extend({}, flowplayer.defaults, flowplayer.conf, opts),
      storage = {},
      lastSeekPosition,
      engine,
      urlResolver = new URLResolver();

      common.addClass(root, 'is-loading');
      common.toggleClass(root, 'no-flex', !flowplayer.support.flex);
      common.toggleClass(root, 'no-svg', !flowplayer.support.svg);
      try {
         storage = supportLocalStorage ? window.localStorage : storage;
      } catch(e) {}

      if (conf.aspectRatio && typeof conf.aspectRatio === 'string') {
        var parts = conf.aspectRatio.split(/[:\/]/);
        conf.ratio = parts[1] / parts[0];
      }

      var isRTL = (root.currentStyle && root.currentStyle.direction === 'rtl') ||
        (window.getComputedStyle && window.getComputedStyle(root, null) !== null && window.getComputedStyle(root, null).getPropertyValue('direction') === 'rtl');

      if (isRTL) common.addClass(root, 'is-rtl');

      /*** API ***/
      var api = {

         // properties
         conf: conf,
         currentSpeed: 1,
         volumeLevel: conf.muted ? 0 : typeof conf.volume === "undefined" ? storage.volume * 1 : conf.volume,
         video: {},

         // states
         disabled: false,
         finished: false,
         loading: false,
         muted: storage.muted == "true" || conf.muted,
         paused: false,
         playing: false,
         ready: false,
         splash: false,
         rtl: isRTL,

         // methods
         //
         hijack: function(hijack) {
            try {
              api.engine.suspendEngine();
            } catch (e) { /* */ }
            api.hijacked = hijack;
         },
         release: function() {
            try {
              api.engine.resumeEngine();
            } catch (e) { /* */ }
            api.hijacked = false;
         },
         load: function(video, callback) {

            if (api.error || api.loading) return;
            api.video = {};

            api.finished = false;

            video = video || conf.clip;

            // resolve URL
            video = extend({}, urlResolver.resolve(video, conf.clip.sources));
            if (api.playing || api.engine) video.autoplay = true;
            var engineImpl = selectEngine(video);
            if (!engineImpl) return setTimeout(function() { api.trigger("error", [api, { code: flowplayer.support.flashVideo ? 5 : 10 }]); }) && api;
            if (!engineImpl.engineName) throw new Error('engineName property of factory should be exposed');
            if (!api.engine || engineImpl.engineName !== api.engine.engineName) {
              api.ready = false;
              if (api.engine) {
                api.engine.unload();
                api.conf.autoplay = true;
              }
              engine = api.engine = engineImpl(api, root);
              api.one('ready', function() {
                setTimeout(function() {
                  if (api.muted) api.mute(true, true);
                  else engine.volume(api.volumeLevel);
                });
              });
            }

            extend(video, engine.pick(video.sources.filter(function(source) { // Filter out sources explicitely configured for some other engine
              if (!source.engine) return true;
              return source.engine === engine.engineName;
            })));

            if (video.src) {
               var e = api.trigger('load', [api, video, engine], true);
               if (!e.defaultPrevented) {
                  engine.load(video);

                  // callback
                  if (isFunction(video)) callback = video;
                  if (callback) api.one("ready", callback);
               } else {
                  api.loading = false;
               }
            }

            return api;
         },

         pause: function(fn) {
            if (api.hijacked) return api.hijacked.pause(fn) | api;

            if (api.ready && !api.seeking && !api.loading) {
               engine.pause();
               api.one("pause", fn);
            }
            return api;
         },

         resume: function() {
            var ev = api.trigger('beforeresume', [api], true);
            if (ev.defaultPrevented) return;
            if (api.hijacked) return api.hijacked.resume() | api;

            if (api.ready && api.paused) {
               engine.resume();

               // Firefox (+others?) does not fire "resume" after finish
               if (api.finished) {
                  api.trigger("resume", [api]);
                  api.finished = false;
               }
            }

            return api;
         },

         toggle: function() {
            return api.ready ? api.paused ? api.resume() : api.pause() : api.load();
         },

         /*
            seek(1.4)   -> 1.4s time
            seek(true)  -> 10% forward
            seek(false) -> 10% backward
         */
         seek: function(time, callback) {
            if (typeof time == "boolean") {
               var delta = api.video.duration * 0.1;
               time = api.video.time + (time ? delta : -delta);
               time = Math.min(Math.max(time, 0), api.video.duration - 0.1);
            }
            if (api.hijacked) return api.hijacked.seek(time, callback) | api;
            if (api.ready) {
               lastSeekPosition = time;
               var ev = api.trigger('beforeseek', [api, time], true);
               if (!ev.defaultPrevented) {
                  engine.seek(time);
                  if (isFunction(callback)) api.one("seek", callback);
               } else {
                  api.seeking = false;
                  common.toggleClass(root, 'is-seeking', api.seeking); // remove loading indicator
               }
            }
            return api;
         },

         /*
            seekTo(1) -> 10%
            seekTo(2) -> 20%
            seekTo(3) -> 30%
            ...
            seekTo()  -> last position
         */
         seekTo: function(position, fn) {
            if (position === undefined) return api.seek(lastSeekPosition, fn);
            if (api.video.seekOffset !== undefined) { // Live stream
              return api.seek(api.video.seekOffset + (api.video.duration - api.video.seekOffset) * 0.1 * position, fn);
            }
            return api.seek(api.video.duration * 0.1 * position, fn);
         },

         mute: function(flag, skipStore) {
           if (flag === undefined) flag = !api.muted;
           if (!skipStore) {
             storage.muted = api.muted = flag;
             storage.volume = !isNaN(storage.volume) ? storage.volume : conf.volume; // make sure storage has volume
           }
           api.volume(flag ? 0 : storage.volume, true);
           api.trigger("mute", [api, flag]);
           return api;
         },

         volume: function(level, skipStore) {
            if (api.ready) {
              level = Math.min(Math.max(level, 0), 1);
              if (!skipStore) storage.volume = level;
              engine.volume(level);
            }

            return api;
         },

         speed: function(val, callback) {

            if (api.ready) {

               // increase / decrease
               if (typeof val == "boolean") {
                  val = conf.speeds[conf.speeds.indexOf(api.currentSpeed) + (val ? 1 : -1)] || api.currentSpeed;
               }

               engine.speed(val);
               if (callback) root.one("speed", callback);
            }

            return api;
         },


         stop: function() {
            if (api.ready) {
               api.pause();
               api.seek(0, function() {
                  api.trigger("stop", [api]);
               });
            }
            return api;
         },

         unload: function() {

            if (conf.splash) {
               api.trigger("unload", [api]);
               if (engine) {
                 engine.unload();
                 api.engine = engine = 0;
               }
            } else {
               api.stop();
            }
            return api;
         },

         shutdown: function() {
           api.unload();
           api.trigger('shutdown', [api]);
           bean.off(root);
           delete instances[root.getAttribute('data-flowplayer-instance-id')];
           root.removeAttribute('data-flowplayer-instance-id');
         },

         disable: function(flag) {
            if (flag === undefined) flag = !api.disabled;

            if (flag != api.disabled) {
               api.disabled = flag;
               api.trigger("disable", flag);
            }
            return api;
         },

         registerExtension: function(jsUrls, cssUrls) {
           jsUrls = jsUrls || [];
           cssUrls = cssUrls || [];
           if (typeof jsUrls === 'string') jsUrls = [jsUrls];
           if (typeof cssUrls === 'string') cssUrls = [cssUrls];
           jsUrls.forEach(function(url) { api.extensions.js.push(url); });
           cssUrls.forEach(function(url) { api.extensions.css.push(url); });
         }

      };

      api.conf = extend(api.conf, conf);
      api.extensions = { js: [], css: [] };
      flowplayer.extensions.forEach(function(i) {
        api.registerExtension(i[0], i[1]);
      });
      /* event binding / unbinding */
      events(api);

      var selectEngine = function(clip) {
        var engine;
        var engines = flowplayer.engines;
        if (conf.engine) {
          var eng = engines.filter(function(e) { return e.engineName === conf.engine; })[0];
          if (eng && clip.sources.some(function(source) {
            if (source.engine && source.engine !== eng.engineName) return false;
            return eng.canPlay(source.type, api.conf);
          })) return eng;
        }
        if (conf.enginePreference) engines = flowplayer.engines.filter(function(one) { return conf.enginePreference.indexOf(one.engineName) > -1; }).sort(function(a, b) {
          return conf.enginePreference.indexOf(a.engineName) - conf.enginePreference.indexOf(b.engineName);
        });
        clip.sources.some(function(source) {
          var eng = engines.filter(function(engine) {
            if (source.engine && source.engine !== engine.engineName) return false;
            return engine.canPlay(source.type, api.conf);
          }).shift();
          if (eng) engine = eng;
          return !!eng;
        });
        return engine;
      };

      /*** Behaviour ***/
      if (!root.getAttribute('data-flowplayer-instance-id')) { // Only bind once
         root.setAttribute('data-flowplayer-instance-id', playerCount++);


         api.on('boot', function() {

            // splash
            if (conf.splash || common.hasClass(root, "is-splash") || !flowplayer.support.firstframe) {
               api.forcedSplash = !conf.splash && !common.hasClass(root, "is-splash");
               api.splash = conf.autoplay = true;
               if (!conf.splash) conf.splash = true;
               common.addClass(root, "is-splash");
            }

            if (conf.splash) common.find('video', root).forEach(common.removeNode);

            if (conf.dvr || conf.live || common.hasClass(root, 'is-live')) {
               api.live = conf.live = true;
               api.dvr = conf.dvr = !!conf.dvr || common.hasClass(root, 'is-dvr');
               common.addClass(root, 'is-live');
               common.toggleClass(root, 'is-dvr', api.dvr);
            }

            // extensions
            extensions.forEach(function(e) {
               e(api, root);
            });

            // instances
            instances.push(api);

            // start
            if (conf.splash) api.unload(); else api.load();

            // disabled
            if (conf.disabled) api.disable();

            // initial callback
            api.one("ready", callback);


         }).on("load", function(e, api, video) {

            // unload others
            if (conf.splash) {
              common.find('.flowplayer.is-ready,.flowplayer.is-loading').forEach(function(el) {
                var playerId = el.getAttribute('data-flowplayer-instance-id');
                if (playerId === root.getAttribute('data-flowplayer-instance-id')) return;
                var a = instances[Number(playerId)];
                if (a && a.conf.splash) a.unload();
              });

            }

            // loading
            common.addClass(root, "is-loading");
            api.loading = true;

            if (typeof video.live !== 'undefined' || typeof video.dvr !== 'undefined') {
              common.toggleClass(root, 'is-live', video.dvr || video.live);
              common.toggleClass(root, 'is-dvr', !!video.dvr);
              api.live = video.dvr || video.live;
              api.dvr = !!video.dvr;
            }


         }).on("ready", function(e, api, video) {
            video.time = 0;
            api.video = video;

            common.removeClass(root, "is-loading");
            api.loading = false;

            // saved state
            if (api.muted) api.mute(true, true);
            else api.volume(api.volumeLevel);

            // see https://github.com/flowplayer/flowplayer/issues/479

            var hlsFix = api.conf.hlsFix && /mpegurl/i.exec(video.type);
            common.toggleClass(root, 'hls-fix', !!hlsFix);

         }).on("unload", function() {
            common.removeClass(root, "is-loading");
            api.loading = false;


         }).on("ready unload", function(e) {
           var is_ready = e.type == "ready";
           common.toggleClass(root, 'is-splash', !is_ready);
           common.toggleClass(root, 'is-ready', is_ready);
           api.ready = is_ready;
           api.splash = !is_ready;


         }).on("progress", function(e, api, time) {
            api.video.time = time;
         }).on('buffer', function(e, api, buffer) {
            api.video.buffer = buffer;
         }).on("speed", function(e, api, val) {
            api.currentSpeed = val;

         }).on("volume", function(e, api, level) {
            api.volumeLevel = Math.round(level * 100) / 100;
            if (!api.muted) storage.volume = level;
            else if (level) api.mute(false);


         }).on("beforeseek seek", function(e) {
            api.seeking = e.type == "beforeseek";
            common.toggleClass(root, 'is-seeking', api.seeking);

         }).on("ready pause resume unload finish stop", function(e) {

            // PAUSED: pause / finish
            api.paused = /pause|finish|unload|stop/.test(e.type);
            api.paused = api.paused || e.type === 'ready' && !conf.autoplay && !api.playing;

            // the opposite
            api.playing = !api.paused;

            // CSS classes
            common.toggleClass(root, 'is-paused', api.paused);
            common.toggleClass(root, 'is-playing', api.playing);

            // sanity check
            if (!api.load.ed) api.pause();

         }).on("finish", function() {
            api.finished = true;

         }).on("error", function() {
         });
      }

      // boot
      api.trigger('boot', [api, root]);
  return api;
}
