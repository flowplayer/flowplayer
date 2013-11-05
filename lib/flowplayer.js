
// auto-install (any video tag with parent .flowplayer)
$(function() {
   if (typeof $.fn.flowplayer == 'function') {
      $("video").parent(".flowplayer").flowplayer();
   }
});

var instances = [],
   extensions = [],
   UA = window.navigator.userAgent;


/* flowplayer()  */
window.flowplayer = function(fn) {
   return $.isFunction(fn) ? extensions.push(fn) :
      typeof fn == 'number' || fn === undefined ? instances[fn || 0] :
      $(fn).data("flowplayer");
};

$(window).on('beforeunload', function() {
   $.each(instances, function(i, api) {
      if (api.conf.splash) {
         api.unload();
      } else {
         api.bind("error", function () {
            $(".flowplayer.is-error .fp-message").remove();
         });
      }
   });
});

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
      volume: typeof localStorage != "object" ? 1 : localStorage.muted == "true" ? 0 : !isNaN(localStorage.volume) ? localStorage.volume || 1 : 1,

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
      playlist: []

   }

});

// keep track of players
var playerCount = 1;

// jQuery plugin
$.fn.flowplayer = function(opts, callback) {

   if (typeof opts == 'string') opts = { swf: opts }
   if ($.isFunction(opts)) { callback = opts; opts = {} }

   return !opts && this.data("flowplayer") || this.each(function() {

      // private variables
      var root = $(this).addClass("is-loading"),
         conf = $.extend({}, flowplayer.defaults, flowplayer.conf, opts, root.data()),
         videoTag = $("video", root).addClass("fp-engine").removeAttr("controls"),
         urlResolver = videoTag.length ? new URLResolver(videoTag) : null,
         storage = {},
         lastSeekPosition,
         engine;

      if (!flowplayer.support.firstframe) videoTag.detach();

      if (conf.playlist.length) { // Create initial video tag if called without
         var preload = videoTag.attr('preload'), placeHolder;
         if (videoTag.length) videoTag.replaceWith(placeHolder = $('<p />'));
         videoTag = $('<video />').addClass('fp-engine');
         placeHolder ? placeHolder.replaceWith(videoTag) : root.prepend(videoTag);
         videoTag.attr('preload', preload);
         if (typeof conf.playlist[0] === 'string') videoTag.attr('src', conf.playlist[0]);
         else {
            $.each(conf.playlist[0], function(i, plObj) {
               for (var type in plObj) {
                  if (plObj.hasOwnProperty(type)) {
                     videoTag.append($('<source />').attr({type: 'video/' + type, src: plObj[type]}));
                  }
               }
            });
         }
         urlResolver = new URLResolver(videoTag);

      }

      //stop old instance
      var oldApi = root.data('flowplayer');
      if (oldApi) oldApi.unload();

      root.data('fp-player_id', root.data('fp-player_id') || playerCount++);

      try {
         storage = window.localStorage || storage;
      } catch(e) {}

      var isRTL = (this.currentStyle && this.currentStyle['direction'] === 'rtl')
         || (window.getComputedStyle && window.getComputedStyle(this, null).getPropertyValue('direction') === 'rtl');

      if (isRTL) root.addClass('is-rtl');

      /*** API ***/
      var api = oldApi || {

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

            // resolve URL
            video = urlResolver.resolve(video);
            $.extend(video, engine.pick(video.sources));

            if (video.src) {
               var e = $.Event("load");
               root.trigger(e, [api, video, engine]);

               if (!e.isDefaultPrevented()) {
                  engine.load(video);

                  // callback
                  if ($.isFunction(video)) callback = video;
                  if (callback) root.one("ready", callback);
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
               time = lastSeekPosition = Math.min(Math.max(time, 0), api.video.duration).toFixed(1);
               var ev = $.Event('beforeseek');
               root.trigger(ev, [api, time]);
               if (!ev.isDefaultPrevented()) {
                  engine.seek(time);
                  if ($.isFunction(callback)) root.one("seek", callback);
               } else {
                  api.seeking = false;
                  root.toggleClass("is-seeking", api.seeking); // remove loading indicator
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

      api.conf = $.extend(api.conf, conf);


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
      if (!root.data('flowplayer')) { // Only bind once
         root.bind("boot", function() {

            // conf
            $.each(['autoplay', 'loop', 'preload', 'poster'], function(i, key) {
               var val = videoTag.attr(key);
               if (val !== undefined) conf[key] = val ? val : true;
            });

            // splash
            if (conf.splash || root.hasClass("is-splash") || !flowplayer.support.firstframe) {
               api.forcedSplash = !conf.splash && !root.hasClass("is-splash");
               api.splash = conf.splash = conf.autoplay = true;
               root.addClass("is-splash");
               videoTag.attr("preload", "none");
            }

            if (conf.live || root.hasClass('is-live')) {
               api.live = conf.live = true;
               root.addClass('is-live');
            }

            // extensions
            $.each(extensions, function(i) {
               var v;
               if  (!flowplayer.support.firstframe) v = videoTag.clone().prependTo(root); //Hack for a hack..
               this(api, root);
               if (v) v.remove();
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

            // instances
            instances.push(api);

            // no engine
            if (!api.engine) return api.trigger("error", { code: flowplayer.support.flashVideo ? 5 : 10 });

            // start
            conf.splash ? api.unload() : api.load();

            // disabled
            if (conf.disabled) api.disable();

            //initial volumelevel
            engine.volume(api.volumeLevel);

            // initial callback
            root.one("ready", callback);


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
            video.time = 0;
            api.video = video;

            function notLoading() {
               root.removeClass("is-loading");
               api.loading = false;
            }

            if (conf.splash) root.one("progress", notLoading);
            else notLoading();

            // saved state
            if (api.muted) api.mute(true);
            else api.volume(api.volumeLevel);


         }).bind("unload", function(e) {
            if (conf.splash) videoTag.remove();
            root.removeClass("is-loading");
            api.loading = false;


         }).bind("ready unload", function(e) {
            var is_ready = e.type == "ready";
            root.toggleClass("is-splash", !is_ready).toggleClass("is-ready", is_ready);
            api.ready = is_ready;
            api.splash = !is_ready;


         }).bind("progress", function(e, api, time) {
            api.video.time = time;


         }).bind("speed", function(e, api, val) {
            api.currentSpeed = val;

         }).bind("volume", function(e, api, level) {
            api.volumeLevel = Math.round(level * 100) / 100;
            if (!api.muted) storage.volume = level;
            else if (level) api.mute(false);


         }).bind("beforeseek seek", function(e) {
            api.seeking = e.type == "beforeseek";
            root.toggleClass("is-seeking", api.seeking);

         }).bind("ready pause resume unload finish stop", function(e, _api, video) {

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
            root.toggleClass("is-paused", api.paused).toggleClass("is-playing", api.playing);

            // sanity check
            if (!api.load.ed) api.pause();

         }).bind("finish", function(e) {
            api.finished = true;

         }).bind("error", function() {
            videoTag.remove();
         });
      }

      // boot
      root.trigger("boot", [api, root]).data("flowplayer", api);

   });

};
