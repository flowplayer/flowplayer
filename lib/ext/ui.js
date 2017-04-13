'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    bean = require('bean'),
    fs = require('fs'),
    slider = require('./ui/slider'),
    barSlider = require('./ui/bar-slider');

function zeropad(val) {
   val = parseInt(val, 10);
   return val >= 10 ? val : "0" + val;
}

// display seconds in hh:mm:ss format
function format(sec, remaining) {

   sec = Math.max(sec || 0, 0);
   sec = remaining ? Math.ceil(sec) : Math.floor(sec);

   var h = Math.floor(sec / 3600),
       min = Math.floor(sec / 60);

   sec = sec - (min * 60);

   if (h >= 1) {
      min -= h * 60;
      return h + ":" + zeropad(min) + ":" + zeropad(sec);
   }

   return zeropad(min) + ":" + zeropad(sec);
}

var PLAY_ROUNDED_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/play-rounded-outline.svg')
  , PLAY_ROUNDED_FILL = fs.readFileSync(__dirname + '/ui/svg/play-rounded-fill.svg')
  , PLAY_SHARP_FILL = fs.readFileSync(__dirname + '/ui/svg/play-sharp-fill.svg')
  , PLAY_SHARP_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/play-sharp-outline.svg')
  , PAUSE_ROUNDED_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/pause-rounded-outline.svg')
  , PAUSE_ROUNDED_FILL = fs.readFileSync(__dirname + '/ui/svg/pause-rounded-fill.svg')
  , PAUSE_SHARP_FILL = fs.readFileSync(__dirname + '/ui/svg/pause-sharp-fill.svg')
  , PAUSE_SHARP_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/pause-sharp-outline.svg');

var LOADING_ROUNDED_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/loading-rounded-outline.svg')
  , LOADING_ROUNDED_FILL = fs.readFileSync(__dirname + '/ui/svg/loading-rounded-fill.svg')
  , LOADING_SHARP_FILL = fs.readFileSync(__dirname + '/ui/svg/loading-sharp-fill.svg')
  , LOADING_SHARP_OUTLINE = fs.readFileSync(__dirname + '/ui/svg/loading-sharp-outline.svg');

flowplayer(function(api, root) {
  common.find('.fp-filters').forEach(common.removeNode);
  try {
    var fc;
    document.body.appendChild(fc = common.createElement('div', {}, fs.readFileSync(__dirname + '/ui/svg/filters.svg')));
    common.css(fc, {
      width: 0,
      height: 0,
      overflow: 'hidden',
      position: 'absolute',
      margin: 0,
      padding: 0
    });

  } catch (e) { /* omit */ }

   var conf = api.conf,
      support = flowplayer.support,
      hovertimer;
   common.find('.fp-ratio,.fp-ui', root).forEach(common.removeNode);
   common.addClass(root, 'flowplayer');
   root.appendChild(common.createElement('div', {className: 'fp-ratio'}));
   var ui = common.createElement('div', {className: 'fp-ui'}, '\
         <div class="fp-waiting">\
           {{ LOADING_SHARP_OUTLINE }}\
           {{ LOADING_SHARP_FILL }}\
           {{ LOADING_ROUNDED_FILL }}\
           {{ LOADING_ROUNDED_OUTLINE }}\
         </div>\
         <div class="fp-header">\
           <a class="fp-share fp-icon"></a>\
           <a class="fp-fullscreen fp-icon"></a>\
           <a class="fp-unload fp-icon"></a>\
         </div>\
         <p class="fp-speed-flash"></p>\
         <div class="fp-play fp-visible">\
           <a class="fp-icon fp-playbtn"></a>\
           {{ PLAY_ROUNDED_FILL }}\
           {{ PLAY_ROUNDED_OUTLINE }}\
           {{ PLAY_SHARP_FILL }}\
           {{ PLAY_SHARP_OUTLINE }}\
         </div>\
         <div class="fp-pause">\
           <a class="fp-icon fp-playbtn"></a>\
           {{ PAUSE_SHARP_OUTLINE }}\
           {{ PAUSE_SHARP_FILL }}\
           {{ PAUSE_ROUNDED_OUTLINE }}\
           {{ PAUSE_ROUNDED_FILL }}\
         </div>\
         <div class="fp-controls">\
            <a class="fp-icon fp-playbtn"></a>\
            <span class="fp-elapsed">00:00</span>\
            <div class="fp-timeline fp-bar">\
               <div class="fp-buffer"></div>\
               <span class="fp-timestamp"></span>\
               <div class="fp-progress fp-color"></div>\
            </div>\
            <span class="fp-duration"></span>\
            <span class="fp-remaining"></span>\
            <div class="fp-volume">\
               <a class="fp-icon fp-volumebtn"></a>\
               <div class="fp-volumebar fp-bar-slider">\
                 <em></em><em></em><em></em><em></em><em></em><em></em><em></em>\
               </div>\
            </div>\
            <strong class="fp-speed fp-hidden"></strong>\
         </div>'.replace('{{ PAUSE_ROUNDED_FILL }}', PAUSE_ROUNDED_FILL)
                .replace('{{ PAUSE_ROUNDED_OUTLINE }}', PAUSE_ROUNDED_OUTLINE)
                .replace('{{ PAUSE_SHARP_FILL }}', PAUSE_SHARP_FILL)
                .replace('{{ PAUSE_SHARP_OUTLINE }}', PAUSE_SHARP_OUTLINE)
                .replace('{{ PLAY_SHARP_OUTLINE }}', PLAY_SHARP_OUTLINE)
                .replace('{{ PLAY_SHARP_FILL }}', PLAY_SHARP_FILL)
                .replace('{{ PLAY_ROUNDED_OUTLINE }}', PLAY_ROUNDED_OUTLINE)
                .replace('{{ PLAY_ROUNDED_FILL }}', PLAY_ROUNDED_FILL)
                .replace('{{ LOADING_ROUNDED_OUTLINE }}', LOADING_ROUNDED_OUTLINE)
                .replace('{{ LOADING_ROUNDED_FILL }}', LOADING_ROUNDED_FILL)
                .replace('{{ LOADING_SHARP_FILL }}', LOADING_SHARP_FILL)
                .replace('{{ LOADING_SHARP_OUTLINE }}', LOADING_SHARP_OUTLINE)
                .replace(/url\(#/g, 'url(' + window.location.href.replace(window.location.hash, "").replace(/\#$/g, '') + '#')
   );
   root.appendChild(ui);
   function find(klass) {
     return common.find(".fp-" + klass, root)[0];
   }

   // widgets
   var buffer = find("buffer"),
      waiting = find('waiting'),
      elapsed = find("elapsed"),
      ratio = find("ratio"),
      speedFlash = find('speed-flash'),
      durationEl = find("duration"),
      remaining = find('remaining'),
      timelineTooltip = find('timestamp'),
      origRatio = common.css(ratio, 'padding-top'),
      play = find('play'),
      pause = find('pause'),

      // sliders
      timeline = find("timeline"),
      timelineApi = slider(timeline, api.rtl),

      fullscreen = find("fullscreen"),
      volumeSlider = find("volumebar"),
      volumeApi = barSlider(volumeSlider, { rtl: api.rtl }),
      noToggle = common.hasClass(root, 'no-toggle');

   timelineApi.disableAnimation(common.hasClass(root, 'is-touch'));
   api.sliders = api.sliders || {};
   api.sliders.timeline = timelineApi;
   api.sliders.volume = volumeApi;

   var speedAnimationTimers = [];

   // aspect ratio
   function setRatio(val) {
     common.css(ratio, 'padding-top', val * 100 + "%");
     if (!support.inlineBlock) common.height(common.find('object', root)[0], common.height(root));
   }

   function hover(flag) {
     if (flag) {
       common.addClass(root, 'is-mouseover');
       common.removeClass(root, 'is-mouseout');
     } else {
       common.addClass(root, 'is-mouseout');
       common.removeClass(root, 'is-mouseover');
     }
   }

   // loading...
   if (!support.svg) common.html(waiting, "<p>loading &hellip;</p>");

   if (conf.ratio) setRatio(conf.ratio);

   // no fullscreen in IFRAME
   try {
      if (!conf.fullscreen) common.removeNode(fullscreen);

   } catch (e) {
      common.removeNode(fullscreen);
   }

   api.on('dvrwindow', function() {
     timelineApi.disable(false);
   });

   api.on("ready", function(ev, api, video) {

      var duration = api.video.duration;

      timelineApi.disable(api.disabled || !duration);

      if (conf.adaptiveRatio && !isNaN(video.height / video.width)) setRatio(video.height / video.width, true);

      // initial time & volume
      common.html([durationEl, remaining], api.live ? 'Live' : format(duration));

      // do we need additional space for showing hour
      common.toggleClass(root, 'is-long', duration >= 3600);
      volumeApi.slide(api.volumeLevel);

      if (api.engine.engineName === 'flash') timelineApi.disableAnimation(true, true);
      else timelineApi.disableAnimation(false);
      common.find('.fp-title', ui).forEach(common.removeNode);
      if (video.title) {

        common.prepend(ui, common.createElement('div', {
          className: 'fp-message fp-title'
        }, video.title));
      }
      common.toggleClass(root, 'has-title', !!video.title);


   }).on("unload", function() {
     if (!origRatio && !conf.splash) common.css(ratio, "paddingTop", "");
     timelineApi.slide(0);
     common.addClass(play, 'fp-visible');

   // buffer
   }).on("buffer", function() {
      var video = api.video,
         max = video.buffer / video.duration;

      if (!video.seekable && support.seekable) timelineApi.max(api.conf.live ? Infinity : max);
      if (max < 1) common.css(buffer, "width", (max * 100) + "%");
      else common.css(buffer, 'width', '100%');
   }).on("speed", function(e, api, val) {
     if (api.video.time) {
       common.text(speedFlash, val + "x");
       common.addClass(speedFlash, 'fp-shown');
       speedAnimationTimers = speedAnimationTimers.filter(function(to) {
         clearTimeout(to);
         return false;
       });
       speedAnimationTimers.push(setTimeout(function() {
        common.addClass(speedFlash, 'fp-hilite');
        speedAnimationTimers.push(setTimeout(function() {
          common.removeClass(speedFlash, 'fp-hilite');
          speedAnimationTimers.push(setTimeout(function() {
            common.removeClass(speedFlash, 'fp-shown');
          }, 300));
        }, 1000));
       }));
     }

   }).on("buffered", function() {
     common.css(buffer, 'width', '100%');
      timelineApi.max(1);

   // progress
   }).on("progress seek", function(_e, _api, time) {

      var duration = api.video.duration,
       offset = api.video.seekOffset || 0;

      time = time || api.video.time;
      var percentage = (time - offset) / (duration - offset);
      if (!timelineApi.dragging) {
        timelineApi.slide(percentage, api.seeking ? 0 : 250);
      }
      common.toggleClass(root, 'is-live-position', duration - time < conf.livePositionOffset);

      common.html(elapsed, format(time));
      common.html(remaining, format(duration - time, true));

   }).on("finish resume seek", function(e) {
      common.toggleClass(root, "is-finished", e.type == "finish");
   }).on('resume', function() {
      common.addClass(play, 'fp-visible');
      setTimeout(function() { common.removeClass(play, 'fp-visible'); }, 300);
   }).on('pause', function() {
      common.addClass(pause, 'fp-visible');
      setTimeout(function() { common.removeClass(pause, 'fp-visible'); }, 300);
   }).on("stop", function() {
      common.html(elapsed, format(0));
      timelineApi.slide(0, 100);

   }).on("finish", function() {
      common.html(elapsed, format(api.video.duration));
      timelineApi.slide(1, 100);
      common.removeClass(root, 'is-seeking');

   // misc
   }).on("beforeseek", function() {
      //TODO FIXME
      //progress.stop();

   }).on("volume", function() {
      volumeApi.slide(api.volumeLevel);


   }).on("disable", function() {
      var flag = api.disabled;
      timelineApi.disable(flag);
      volumeApi.disable(flag);
      common.toggleClass(root, 'is-disabled', api.disabled);

   }).on("mute", function(e, api, flag) {
      common.toggleClass(root, 'is-muted', flag);

   }).on("error", function(e, api, error) {
      common.removeClass(root, 'is-loading');
      common.removeClass(root, 'is-seeking');
      common.addClass(root, 'is-error');
      if (error) {
         error.message = conf.errors[error.code];
         api.error = true;

         var dismiss = api.message((api.engine && api.engine.engineName || 'html5') + ": " + error.message);
         //common.find('p', el)[0].innerHTML = error.url || video.url || video.src || conf.errorUrls[error.code];
         common.removeClass(root, 'is-mouseover');
         api.one('load progress', function() { dismiss(); });
      }


   // hover
   }).one('resume ready', function() {
     var videoTag = common.find('video.fp-engine', root)[0];
     if (!videoTag) return;
     if (!common.width(videoTag) || !common.height(videoTag)) {
       var oldOverflow = root.style.overflow;
       root.style.overflow = 'visible';
       setTimeout(function() {
         if (oldOverflow) root.style.overflow = oldOverflow;
         else root.style.removeProperty('overflow');
       });
     }
   });
   //Interaction events
   bean.on(root, "mouseenter mouseleave", function(e) {
     if (noToggle) return;

      var is_over = e.type == "mouseover",
         lastMove;

      // is-mouseover/out
      hover(is_over);

      if (is_over) {

         var reg = function() {
            hover(true);
            lastMove = new Date();
         };
         api.on("pause.x volume.x", reg);
         bean.on(root, 'mousemove.x', reg);

         hovertimer = setInterval(function() {
            if (new Date() - lastMove > conf.mouseoutTimeout) {
               hover(false);
               lastMove = new Date();
            }
         }, 100);

      } else {
         bean.off(root, 'mousemove.x');
         api.off("pause.x volume.x");
         clearInterval(hovertimer);
      }


   // allow dragging over the player edge
   });
   bean.on(root, "mouseleave", function() {

     if (timelineApi.dragging || volumeApi.dragging) {
       common.addClass(root, 'is-mouseover');
       common.removeClass(root, 'is-mouseout');
     }

   // click
   });
   bean.on(root, "click.player", function(e) {
     if (api.disabled) return;
     if (common.hasClass(e.target, 'fp-ui') || common.hasClass(e.target, 'fp-engine') || e.flash || common.hasParent(e.target, '.fp-play,.fp-pause')) {
         if (e.preventDefault) e.preventDefault();
         return api.toggle();
      }
   });

   bean.on(root, 'mousemove', '.fp-timeline', function(ev) {
     var x = ev.pageX || ev.clientX,
         delta = x - common.offset(timeline).left,
         percentage = delta / common.width(timeline),
         seconds = (api.rtl ? 1 - percentage : percentage) * api.video.duration;
     if (percentage < 0) return;
     common.html(timelineTooltip, format(seconds));
     var left = (delta - common.width(timelineTooltip) / 2);
     if (left < 0) left = 0;
     if (left > common.width(timeline) - common.width(timelineTooltip)) left = false;
     if (left !== false) common.css(timelineTooltip, {
       left: left + 'px',
       right: 'auto'
     });
     else common.css(timelineTooltip, {
       left: 'auto',
       right: '0px'
     });

   });

   bean.on(root, 'contextmenu', function(ev) {
      var w = window;
      if (common.hasClass(root, 'is-flash-disabled')) return;
      var menu = common.find('.fp-context-menu', root)[0];
      if (!menu) return;
      ev.preventDefault();
      api.showMenu(menu, {
        left: ev.clientX - w.scrollX,
        top: ev.clientY - w.scrollY
      });
      bean.on(root, 'click', '.fp-context-menu', function(ev) {
         ev.stopPropagation();
      });
   });
   api.on('flashdisabled', function(_e, _a, showMessage) {
     common.addClass(root, 'is-flash-disabled');
     var dismiss;
     if (showMessage !== false) dismiss = api.message('Seems something is blocking Adobe Flash from running');
     api.one('ready progress', function() {
       common.removeClass(root, 'is-flash-disabled');
       if (dismiss) dismiss();
     });
   });

   // poster -> background image
   if (conf.poster) common.css(root, 'background-image', "url(" + conf.poster + ")");

   var bc = common.css(root, 'background-color'),
      has_bg = common.css(root, 'background-image') != "none" || bc && bc != "rgba(0, 0, 0, 0)" && bc != "transparent";

   // is-poster class
   if (has_bg && !conf.splash) {
      if (!conf.poster) conf.poster = true;
      var initPoster = function() {
        common.addClass(root, "is-poster");
        common.addClass(play, 'fp-visible');
        api.poster = true;
        api.one(conf.autoplay ? "progress seek" : "resume seek", function() {
          common.removeClass(root, "is-poster");
          common.removeClass(play, 'fp-visible');
          api.poster = false;
        });
      }
      api.on('stop', function() { initPoster(); });
      api.on('ready', function(_ev, _api, video) {
        if (video.index || video.autoplay) return; // No poster for playlist items
        initPoster();
      });
   }

   if (typeof conf.splash === 'string') {
     common.css(root, 'background-image', "url('" + conf.splash + "')");
   }

   // default background color if not present
   if (!has_bg && api.forcedSplash) {
      common.css(root, "background-color", "#555");
   }

   bean.on(root, 'click', '.fp-toggle, .fp-play, .fp-playbtn', function() {
     if (api.disabled) return;
     api.toggle();
   });

   /* controlbar elements */
   bean.on(root, 'click', '.fp-volumebtn', function() { api.mute(); }); bean.on(root, 'click', '.fp-fullscreen', function() { api.fullscreen(); });
   bean.on(root, 'click', '.fp-unload', function() { api.unload(); });

   bean.on(timeline, 'slide', function(val) {
     api.seeking = true;
     api.seekTo(val * 10);
   });

   bean.on(volumeSlider, 'slide', function(val) {
      api.volume(val);
   });

   // times

   bean.on(root, 'click', '.fp-duration,.fp-remaining', function() {
     if (api.dvr) return api.seekTo(10);
     common.toggleClass(root, 'is-inverted');
   });

   hover(noToggle);

   api.on('shutdown', function() {
     bean.off(timeline);
     bean.off(volumeSlider);
   });

});


module.exports.format = format;
