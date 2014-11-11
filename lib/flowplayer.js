var extend = require('extend-object'),
    isFunction = require('is-function'),
    ClassList = require('class-list'),
    bean = require('bean'),
    Sizzle = require('sizzle'),
    common = require('./common'),
    events = require('./ext/events');

bean.setSelectorEngine(Sizzle);

var instances = [],
   extensions = [],
   UA = window.navigator.userAgent;



//TODO fix this
//$(window).on('beforeunload', function() {
//   $.each(instances, function(i, api) {
//      if (api.conf.splash) {
//         api.unload();
//      } else {
//         api.bind("error", function () {
//            $(".flowplayer.is-error .fp-message").remove();
//         });
//      }
//   });
//});

var supportLocalStorage = false;
try {
  if (typeof window.localStorage == "object") {
    window.localStorage.flowplayerTestStorage = "test";
    supportLocalStorage = true;
  }
} catch (ignored) {}

var isSafari = /Safari/.exec(navigator.userAgent) && !/Chrome/.exec(navigator.userAgent);
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
    return initializePlayer(el, opts, callback);
  }
};

extend(flowplayer, {

   version: '@VERSION',

   engines: [],

   conf: {},

   support: {},

   defaults: {

      debug: false,

      // true = forced playback
      disabled: false,

      fullscreen: window == window.top,

      // keyboard shortcuts
      keyboard: true,

      // default aspect ratio
      ratio: 9 / 16,

      adaptiveRatio: false,

      // scale flash object to video's aspect ratio in normal mode?
      flashfit: false,

      rtmp: 0,

      splash: false,

      live: false,

      swf: "//@CDN/@VERSION/@CDN_PATHflowplayer.swf",

      speeds: [0.25, 0.5, 1, 1.5, 2],

      tooltip: true,

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

      hlsFix: isSafari && safariVersion < 8

   },
   // Expose utilities for plugins
   bean: bean,
   Sizzle: Sizzle,
   common: common



});

// keep track of players
var playerCount = 1;

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
    var clip = {};
    $.each(['autoplay', 'loop', 'preload', 'poster'], function(i, key) {
      var val = videoTag.attr(key);
      if (val !== undefined) clip[key] = val ? val : true;
    });

    clip.sources = (new URLResolver()).sourcesFromVideoTag(videoTag);
    return {clip: clip};
  };
  $.fn.flowplayer = function(opts, callback) {
    return this.each(function() {
      if (typeof opts == 'string') opts = { swf: opts }
      if (isFunction(opts)) { callback = opts; opts = {} }
      var root = $(this),
          scriptConf = root.find('script[type="application/json"]'),
          confObject = opts || (scriptConf.length ? JSON.parse(scriptConf.text()) : videoTagConfig(root.find('video'))),
          conf = $.extend({}, confObject, root.data());

      initializePlayer(this, conf, callback);
    });
  };
}

function initializePlayer(element, opts, callback) {
  

  var root = element,
      rootClasses = ClassList(root),
      conf = extend({}, flowplayer.defaults, flowplayer.conf, opts),
      storage = {},
      lastSeekPosition,
      engine,
      url,
      urlResolver = new URLResolver();

      rootClasses.add('is-loading');

      try {
         storage = supportLocalStorage ? window.localStorage : storage;
      } catch(e) {}

      var isRTL = (root.currentStyle && root.currentStyle['direction'] === 'rtl')
         || (window.getComputedStyle && window.getComputedStyle(root, null) !== null && window.getComputedStyle(root, null).getPropertyValue('direction') === 'rtl');

      if (isRTL) rootClasses.add('is-rtl');

      /*** API ***/
      var api = {

         // properties
         conf: conf,
         currentSpeed: 1,
         volumeLevel: typeof conf.volume === "undefined" ? storage.volume * 1 : conf.volume,
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
         load: function(video, callback) {

            if (api.error || api.loading || api.disabled) return;

            api.finished = false;

            // resolve URL
            video = urlResolver.resolve(video, conf.clip.sources);
            var engineImpl = selectEngine(video);
            if (!engineImpl) return api.trigger("error", { code: flowplayer.support.flashVideo ? 5 : 10 });
            if (!engineImpl.engineName) throw new Error('engineName property of factory should be exposed');
            if (!api.engine || engineImpl.engineName !== api.engine.engineName) {
              api.ready = false;
              if (api.engine) {
                api.engine.unload();
                api.conf.autoplay = true;
              }
              engine = api.engine = engineImpl(api, root);
              api.one('ready', function() {
                engine.volume(api.volumeLevel);
              });
            }

            extend(video, engine.pick(video.sources));

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
            if (api.ready && !api.seeking && !api.disabled && !api.loading) {
               engine.pause();
               api.one("pause", fn);
            }
            return api;
         },

         resume: function() {

            if (api.ready && api.paused && !api.disabled) {
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
            if (api.ready && !api.live) {

               if (typeof time == "boolean") {
                  var delta = api.video.duration * 0.1;
                  time = api.video.time + (time ? delta : -delta);
               }
               time = lastSeekPosition = Math.min(Math.max(time, 0), api.video.duration).toFixed(1);
               var ev = api.trigger('seek', [api, time], true);
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
            var time = position === undefined ? lastSeekPosition : api.video.duration * 0.1 * position;
            return api.seek(time, fn);
         },

         mute: function(flag) {
            if (flag === undefined) flag = !api.muted;
            storage.muted = api.muted = flag;
            storage.volume = !isNaN(storage.volume) ? storage.volume : conf.volume; // make sure storage has volume
            api.volume(flag ? 0 : storage.volume, true);
            api.trigger("mute", flag);
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
                  root.trigger("stop");
               });
            }
            return api;
         },

         unload: function() {
            if (!rootClasses.contains("is-embedding")) {

               if (conf.splash) {
                  api.trigger("unload", [api]);
                  if (engine) engine.unload();
               } else {
                  api.stop();
               }
            }
            return api;
         },

         disable: function(flag) {
            if (flag === undefined) flag = !api.disabled;

            if (flag != api.disabled) {
               api.disabled = flag;
               api.trigger("disable", flag);
            }
            return api;
         }

      };

      api.conf = extend(api.conf, conf);

      /* event binding / unbinding */
      events(api);

      var selectEngine = function(clip) {
        var engine;
        clip.sources.some(function(source) {
          var eng = flowplayer.engines.filter(function(engine) {
            return engine.canPlay(source.type);
          }).pop();
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
            if (conf.splash || rootClasses.contains("is-splash") || !flowplayer.support.firstframe) {
               api.forcedSplash = !conf.splash && !rootClasses.contains("is-splash");
               api.splash = conf.splash = conf.autoplay = true;
               rootClasses.add("is-splash");
            }

            if (conf.splash) Sizzle('video', root).forEach(common.removeNode);

            if (conf.live || rootClasses.contains('is-live')) {
               api.live = conf.live = true;
               rootClasses.add('is-live');
            }

            // extensions
            extensions.forEach(function(e) {
               e(api, root);
            });

            

            // instances
            instances.push(api);

            // start
            conf.splash ? api.unload() : api.load();

            // disabled
            if (conf.disabled) api.disable();

            // initial callback
            api.one("ready", callback);


         }).on("load", function(e, api, video) {

            // unload others
            if (conf.splash) {
              Sizzle('.flowplayer.is-ready,.flowplayer.is-loading').forEach(function(el) {
                var playerId = el.getAttribute('data-flowplayer-instance-id');
                if (playerId === root.getAttribute('data-flowplayer-instance-id')) return;
                var api = instances[playerId];
                if (api && api.conf.splash) api.unload();
              });

            }

            // loading
            rootClasses.add("is-loading");
            api.loading = true;

            if (typeof video.live !== 'undefined') {
              common.toggleClass(root, 'is-live', video.live);
              api.live = video.live;
            }


         }).on("ready", function(e, api, video) {
            video.time = 0;
            api.video = video;

            function notLoading() {
               rootClasses.remove("is-loading");
               api.loading = false;
            }

            if (conf.splash) api.one("progress", notLoading);
            else notLoading();

            // saved state
            if (api.muted) api.mute(true);
            else api.volume(api.volumeLevel);

            // see https://github.com/flowplayer/flowplayer/issues/479

            var hlsFix = api.conf.hlsFix && /mpegurl/i.exec(video.type);
            common.toggleClass(root, 'hls-fix', !!hlsFix);

         }).on("unload", function(e) {
            rootClasses.remove("is-loading");
            api.loading = false;


         }).on("ready unload", function(e) {
           var is_ready = e.type == "ready";
           common.toggleClass(root, 'is-splash', !is_ready);
           common.toggleClass(root, 'is-ready', is_ready);
           api.ready = is_ready;
           api.splash = !is_ready;


         }).on("progress", function(e, api, time) {
            api.video.time = time;


         }).on("speed", function(e, api, val) {
            api.currentSpeed = val;

         }).on("volume", function(e, api, level) {
            api.volumeLevel = Math.round(level * 100) / 100;
            if (!api.muted) storage.volume = level;
            else if (level) api.mute(false);


         }).on("beforeseek seek", function(e) {
            api.seeking = e.type == "beforeseek";
            common.toggleClass(root, 'is-seeking', api.seeking);

         }).on("ready pause resume unload finish stop", function(e, _api, video) {

            // PAUSED: pause / finish
            api.paused = /pause|finish|unload|stop/.test(e.type);

            // SHAKY HACK: first-frame / preload=none
            if (e.type == "ready") {
               api.paused = conf.preload == 'none';
               if (video) {
                  api.paused = !video.duration || !conf.autoplay && (conf.preload != 'none');
               }
            }

            // the opposite
            api.playing = !api.paused;

            // CSS classes
            common.toggleClass(root, 'is-paused', api.paused)
            common.toggleClass(root, 'is-playing', api.playing);

            // sanity check
            if (!api.load.ed) api.pause();

         }).on("finish", function(e) {
            api.finished = true;

         }).on("error", function() {
         });
      }

      // boot
      api.trigger('boot', [api, root]);
  return api;
};
