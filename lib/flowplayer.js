
// auto-install (any video tag with parent .flowplayer)
$(function() {
   if (typeof $.fn.flowplayer == 'function') {
      $("video").parent(".flowplayer").flowplayer();
   }
});

var instances = [],
   extensions = [],
   UA = navigator.userAgent,
   use_native = /iPhone/i.test(UA) || /Android/.test(UA) && /Firefox/.test(UA);


/* flowplayer()  */
window.flowplayer = function(fn) {
   return use_native ? 0 :
      $.isFunction(fn) ? extensions.push(fn) :
      typeof fn == 'number' || fn === undefined ? instances[fn || 0] :
      $(fn).data("flowplayer");
};

$.extend(flowplayer, {

   version: '@VERSION',

   engine: {},

   conf: {},

   support: {},

   defaults: {

      debug: false,

      // true = forced playback
      disabled: false,

      // first engine to try
      engine: 'html5',

      // keyboard shortcuts
      keyboard: true,

      // default aspect ratio
      ratio: 9 / 16,

      rtmp: 0,

      splash: false,

      swf: "http://@CDN/@VERSION/@CDN_PATHflowplayer.swf",

      speeds: [0.25, 0.5, 1, 1.5, 2],

      // initial volume level
      volume: 1,

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
         'Invalid RTMP URL'
      ]

   }

});

// smartphones simply use native controls
if (use_native) {
   return $(function() { $("video").attr("controls", "controls"); });
}

// jQuery plugin
$.fn.flowplayer = function(opts, callback) {

   if (typeof opts == 'string') opts = { swf: opts }
   if ($.isFunction(opts)) { callback = opts; opts = {} }

   return !opts && this.data("flowplayer") || this.each(function() {

      // private variables
      var root = $(this),
         conf = $.extend({}, flowplayer.defaults, flowplayer.conf, opts, root.data()),
         videoTag = $("video", root),
         urlResolver = new URLResolver(videoTag),
         lastSeekPosition,
         savedVolume,
         engine;


      /*** API ***/
      var api = {

         // properties
         conf: conf,
         currentSpeed: 1,
         volumeLevel: conf.volume,
         video: null,

         // states
         splash: false,
         ready: false,
         paused: false,
         playing: false,
         loading: false,
         muted: false,
         disabled: false,
         finished: false,

         // methods
         load: function(video, callback) {

            if (api.error || api.loading || api.disabled) return;

            // resolve URL
            video = urlResolver.resolve(video);
            $.extend(video, engine.pick(video.sources));

            if (video.src && (!api.video || api.video.src != video.src)) {
               var e = $.Event("load");
               root.trigger(e, [api, video, engine]);

               if (!e.isDefaultPrevented()) {
                  engine.load(video);

                  // callback
                  if ($.isFunction(video)) callback = video;
                  if (callback) root.one("ready", callback);
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
                  api.trigger("resume");
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
            if (api.ready) {

               if (typeof time == "boolean") {
                  var delta = api.video.duration * 0.1;
                  time = api.video.time + (time ? delta : -delta);
               }

               time = lastSeekPosition = Math.min(Math.max(time, 0), api.video.duration);
               engine.seek(time);
               if ($.isFunction(callback)) root.one("seek", callback);
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

         volume: function(level) {
            if (api.ready && level != api.volumeLevel) engine.volume(Math.min(Math.max(level, 0), 1));
            return api;
         },

         speed: function(val, callback) {

            if (api.ready) {

               // increase / decrease
               if (typeof val == "boolean") {
                  val = conf.speeds[$.inArray(api.currentSpeed, conf.speeds) + (val ? 1 : -1)] || api.currentSpeed;
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
            if (!root.hasClass("is-embedding")) {
               if (conf.splash) {
                  api.trigger("unload");
                  engine.unload();
               } else {
                  api.stop();
               }
            }
            return api;
         }

      };

      /* togglers */
      $.each(['disable', 'mute'], function(i, key) {
         api[key] = function() {
            return api.trigger(key);
         };
      });

      /* event binding / unbinding */
      $.each(['bind', 'one', 'unbind'], function(i, key) {
         api[key] = function(type, fn) {
            root[key](type, fn);
            return api;
         };
      });

      api.trigger = function(event, arg) {
         root.trigger(event, [api, arg]);
         return api;
      };


      /*** Behaviour ***/

      root.bind("boot", function() {

         // conf
         $.each(['autoplay', 'loop', 'preload'], function(i, key) {
            var val = videoTag.attr(key);
            if (val !== undefined) conf[key] = val ? val : true;
         });

         // splash
         if (conf.splash || root.hasClass("is-splash")) {
            api.splash = conf.splash = conf.autoplay = true;
            root.addClass("is-splash");
         }

         // extensions
         $.each(extensions, function(i) {
            this(api, root);
         });

         // 1. use the configured engine
         engine = flowplayer.engine[conf.engine];
         if (engine) engine = engine(api, root);

         if (engine.pick(urlResolver.initialSources)) {
            api.engine = conf.engine;

         // 2. failed -> try another
         } else {
            $.each(flowplayer.engine, function(name, impl) {
               if (name != conf.engine) {
                  engine = this(api, root);
                  if (engine.pick(urlResolver.initialSources)) api.engine = name;
                  return false;
               }
            });
         }

         // no engine
         if (!api.engine) return api.trigger("error", { code: 5 });

         // start
         conf.splash ? api.unload() : api.load();

         // disabled
         if (conf.disabled) api.disable();

         // initial callback
         root.one("ready", callback);

         // instances
         instances.push(api);


      }).bind("load", function(e, api, video) {

         // unload others
         if (conf.splash) {
            $(".flowplayer").filter(".is-ready, .is-loading").not(root).each(function() {
               var api = $(this).data("flowplayer");
               if (api.conf.splash) api.unload();
            });
         }

         // loading
         root.addClass("is-loading");
         api.loading = true;


      }).bind("ready", function(e, api, video) {
         api.video = video;


      }).bind("ready unload", function(e) {
         var ready = e.type == "ready";
         root.toggleClass("is-splash", !ready).toggleClass("is-ready", ready);
         api.ready = ready;
         api.splash = !ready;

         function noLoad() {
            root.removeClass("is-loading");
            api.loading = false;
         }

         // load
         if (ready) {
            api.volume(conf.volume);

            if (conf.autoplay) {
               root.one("resume", noLoad);

            } else {
               if (!api.playing) api.trigger("pause");
               noLoad();
            }

         // unload
         } else if (api.ready) {
            api.video.time = 0;
            if (conf.splash) videoTag.remove();
         }

      }).bind("progress", function(e, api, time) {
         api.video.time = time;

      }).bind("mute", function(e) {
         var flag = api.muted = !api.muted;
         if (flag) savedVolume = api.volumeLevel;
         api.volume(flag ? 0 : savedVolume);

      }).bind("speed", function(e, api, val) {
         api.currentSpeed = val;

      }).bind("volume", function(e, api, level) {
         api.volumeLevel = Math.round(level * 100) / 100;

         if (api.muted && api.volumeLevel) {
            root.removeClass("is-muted");
            api.muted = false;
         }

      }).bind("beforeseek seek", function(e) {
         api.seeking = e.type == "beforeseek";
         root.toggleClass("is-seeking", api.seeking);

      }).bind("ready pause resume unload finish stop", function(e, _api, video) {

         // PAUSED: pause / finish
         api.paused = /pause|finish|unload|stop/.test(e.type);

         // SHAKY HACK: first-frame / preload=none
         if (e.type == "ready") {
            if (video) {
               api.paused = !video.duration || !conf.autoplay && (conf.preload != 'none' || api.engine == 'flash');
            }
         }

         // the opposite
         api.playing = !api.paused;

         // CSS classes
         root.toggleClass("is-paused", api.paused).toggleClass("is-playing", api.playing);

         // sanity check
         if (!api.load.ed) api.pause();

      }).bind("disable", function(){
         api.disabled = !api.disabled;

      }).bind("finish", function(e) {
         api.finished = true;


      }).bind("error", function() {
         videoTag.remove();
      });

      // boot
      root.trigger("boot", [api, root]).data("flowplayer", api);

   });

};
