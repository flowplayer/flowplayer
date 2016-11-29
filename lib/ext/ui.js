'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    bean = require('bean'),
    slider = require('./slider');

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

flowplayer(function(api, root) {

   var conf = api.conf,
      support = flowplayer.support,
      hovertimer;
   common.find('.fp-ratio,.fp-ui', root).forEach(common.removeNode);
   common.addClass(root, 'flowplayer');
   root.appendChild(common.createElement('div', {className: 'fp-ratio'}));
   var ui = common.createElement('div', {className: 'fp-ui'}, '\
         <div class="fp-waiting"><em></em><em></em><em></em></div>\
         <div class="fp-header">\
           <a class="fp-share fp-icon"></a>\
           <a class="fp-fullscreen fp-icon"></a>\
           <a class="fp-unload fp-icon"></a>\
         </div>\
         <p class="fp-speed-flash"></p>\
         <svg class="fp-play" version="1.1"- xmlns="http://www.w3.org/2000/svg"\
           xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
           viewBox="0 0 58 58" style="enable-background:new 0 0 58 58;" xml:space="preserve">\
           <circle class="fp-color" cx="29" cy="29" r="29"/>\
           <g>\
             <polygon style="fill:#ffffff;" points="44,29 22,44 22,29.273 22,14  "/>\
             <path style="fill:#ffffff;" d="M22,45c-0.16,0-0.321-0.038-0.467-0.116C21.205,44.711,21,44.371,21,44V14\
               c0-0.371,0.205-0.711,0.533-0.884c0.328-0.174,0.724-0.15,1.031,0.058l22,15C44.836,28.36,45,28.669,45,29s-0.164,0.64-0.437,0.826\
               l-22,15C22.394,44.941,22.197,45,22,45z M23,15.893v26.215L42.225,29L23,15.893z"/>\
           </g>\
         </svg>\
         <div class="fp-controls">\
            <a class="fp-icon fp-playbtn"></a>\
            <span class="fp-elapsed">0:00</span>\
            <div class="fp-timeline fp-bar">\
               <div class="fp-buffer"></div>\
               <span class="fp-timestamp"></span>\
               <div class="fp-progress fp-color"></div>\
            </div>\
            <span class="fp-duration"></span>\
            <span class="fp-remaining"></span>\
            <div class="fp-volume">\
               <a class="fp-icon fp-volumebtn"></a>\
               <div class="fp-volumebar fp-bar">\
                  <div class="fp-volumelevel fp-color"></div>\
               </div>\
            </div>\
            <strong class="fp-speed fp-hidden"></strong>\
         </div>');
   root.appendChild(ui);
   function find(klass) {
     return common.find(".fp-" + klass, root)[0];
   }

   // widgets
   var buffer = find("buffer"),
      waiting = find('waiting'),
      elapsed = find("elapsed"),
      ratio = find("ratio"),
      speed = find("speed"),
      speedFlash = find('speed-flash'),
      durationEl = find("duration"),
      remaining = find('remaining'),
      timelineTooltip = find('timestamp'),
      origRatio = common.css(ratio, 'padding-top'),

      // sliders
      timeline = find("timeline"),
      timelineApi = slider(timeline, api.rtl),

      fullscreen = find("fullscreen"),
      volumeSlider = find("volumebar"),
      volumeApi = slider(volumeSlider, api.rtl),
      noToggle = common.hasClass(root, 'no-toggle');

   timelineApi.disableAnimation(common.hasClass(root, 'is-touch'));
   api.sliders = api.sliders || {};
   api.sliders.timeline = timelineApi;
   api.sliders.volume = volumeApi;

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
   if (!support.animation) common.html(waiting, "<p>loading &hellip;</p>");

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
      common.html([durationEl, remaining], api.conf.live ? 'Live' : format(duration));

      // do we need additional space for showing hour
      common.toggleClass(root, 'is-long', duration >= 3600);
      volumeApi.slide(api.volumeLevel);

      if (api.engine.engineName === 'flash') timelineApi.disableAnimation(true, true);
      else timelineApi.disableAnimation(false);
      common.find('.fp-title', ui).forEach(common.removeNode);
      if (video.title) {

        common.prepend(ui, common.createElement('div', {
          className: 'fp-message fp-shown fp-title'
        }, video.title));
      }
      common.toggleClass(root, 'has-title', !!video.title);


   }).on("unload", function() {
     if (!origRatio && !conf.splash) common.css(ratio, "paddingTop", "");
     timelineApi.slide(0);

   // buffer
   }).on("buffer", function() {
      var video = api.video,
         max = video.buffer / video.duration;

      if (!video.seekable && support.seekable) timelineApi.max(api.conf.live ? Infinity : max);
      if (max < 1) common.css(buffer, "width", (max * 100) + "%");
      else common.css(buffer, 'width', '100%');
   }).on("speed", function(e, api, val) {
     common.text(speed, val + "x");
     common.addClass(speedFlash, 'fp-hilite');
     setTimeout(function() { common.removeClass(speedFlash, 'fp-hilite'); }, 1000);

   }).on("buffered", function() {
     common.css(buffer, 'width', '100%');
      timelineApi.max(1);

   // progress
   }).on("progress seek", function(_e, _api, time) {

      var duration = api.video.duration,
       offset = api.video.seekOffset || 0;

      time = time || api.video.time;

      if (!timelineApi.dragging) {
        timelineApi.slide((time - offset) / (duration - offset), api.seeking ? 0 : 250);
      }

      common.html(elapsed, format(time));
      common.html(remaining, '-' + format(duration - time, true));

   }).on("finish resume seek", function(e) {
      common.toggleClass(root, "is-finished", e.type == "finish");

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

         api.message((api.engine && api.engine.engineName || 'html5') + ": " + error.message);
         //common.find('p', el)[0].innerHTML = error.url || video.url || video.src || conf.errorUrls[error.code];
         api.off("mouseenter click");
         common.removeClass(root, 'is-mouseover');
      }


   // hover
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
     if (common.hasClass(e.target, 'fp-ui') || common.hasClass(e.target, 'fp-engine') || e.flash) {
         if (e.preventDefault) e.preventDefault();
         return api.toggle();
      }
   });

   bean.on(root, 'mousemove', '.fp-timeline', function(ev) {
     var x = ev.pageX || ev.clientX,
         delta = x - common.offset(timeline).left,
         percentage = delta / common.width(timeline),
         seconds = percentage * api.video.duration;
     if (percentage < 0) return;
     common.html(timelineTooltip, format(seconds));
     common.css(timelineTooltip, 'left', (delta - common.width(timelineTooltip) / 2) + 'px');
   });

   bean.on(root, 'contextmenu', function(ev) {
      var o = common.offset(common.find('.fp-player', root)[0]),
          w = window,
          left = ev.clientX - (o.left + w.scrollX),
          t = ev.clientY - (o.top + w.scrollY);
      if (common.hasClass(root, 'is-flash-disabled')) return;
      var menu = common.find('.fp-context-menu', root)[0];
      if (!menu) return;
      ev.preventDefault();
      common.css(menu, {
        left: left + 'px',
        top: t + 'px',
      });
      common.toggleClass(menu, 'fp-active', true);
      bean.on(root, 'click', '.fp-context-menu', function(ev) {
         ev.stopPropagation();
      });
      bean.on(document, 'click.outsidemenu', function() {
         common.toggleClass(menu, 'fp-active', false);
         bean.off(document, 'click.outsidemenu');
      });
   });
   api.on('flashdisabled', function() {
     common.addClass(root, 'is-flash-disabled');
     api.one('ready progress', function() {
       common.removeClass(root, 'is-flash-disabled');
       common.find('.fp-flash-disabled', root).forEach(common.removeNode);
     });
     root.appendChild(common.createElement('div', {className: "fp-flash-disabled"}, 'Adobe Flash is disabled for this page, click player area to enable'));
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
        api.poster = true;
        api.one(conf.autoplay ? "progress" : "resume", function() {
          common.removeClass(root, "is-poster");
          api.poster = false;
        });
      }
      api.on('stop', function() { initPoster(); });
      api.on('ready', function(_ev, _api, video) {
        if (video.index) return; // No poster for playlist items
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
     common.toggleClass(root, 'is-inverted');
   });

   hover(noToggle);

   api.on('shutdown', function() {
     bean.off(timeline);
     bean.off(volumeSlider);
   });

});


module.exports.format = format;
