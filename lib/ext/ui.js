'use strict';
var flowplayer = require('../flowplayer'),
    common = require('../common'),
    ClassList = require('class-list'),
    bean = require('bean'),
    slider = require('./slider');

function zeropad(val) {
   val = parseInt(val, 10);
   return val >= 10 ? val : "0" + val;
}

// display seconds in hh:mm:ss format
function format(sec) {

   sec = sec || 0;

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
      hovertimer,
      rootClasses = ClassList(root);
   common.find('.fp-ratio,.fp-ui', root).forEach(common.removeNode);
   rootClasses.add('flowplayer');
   root.appendChild(common.createElement('div', {className: 'fp-ratio'}));
   var ui = common.createElement('div', {className: 'fp-ui'}, '\
         <div class="waiting"><em></em><em></em><em></em></div>\
         <a class="fullscreen"></a>\
         <a class="unload"></a>\
         <p class="speed"></p>\
         <div class="controls">\
            <a class="play"></a>\
            <div class="timeline">\
               <div class="buffer"></div>\
               <div class="progress"></div>\
            </div>\
            <div class="timeline-tooltip fp-tooltip"></div>\
            <div class="volume">\
               <a class="mute"></a>\
               <div class="volumeslider">\
                  <div class="volumelevel"></div>\
               </div>\
            </div>\
         </div>\
         <div class="time">\
            <em class="elapsed">00:00</em>\
            <em class="remaining"></em>\
            <em class="duration">00:00</em>\
         </div>\
         <div class="message"><h2></h2><p></p></div>'.replace(/class="/g, 'class="fp-'));
   root.appendChild(ui);
   function find(klass) {
     return common.find(".fp-" + klass, root)[0];
   }

   // widgets
   var progress = find("progress"),
      buffer = find("buffer"),
      elapsed = find("elapsed"),
      remaining = find("remaining"),
      waiting = find("waiting"),
      ratio = find("ratio"),
      speed = find("speed"),
      speedClasses = ClassList(speed),
      durationEl = find("duration"),
      controls = find('controls'),
      timelineTooltip = find('timeline-tooltip'),
      origRatio = common.css(ratio, 'padding-top'),

      // sliders
      timeline = find("timeline"),
      timelineApi = slider(timeline, api.rtl),

      volume = find("volume"),
      fullscreen = find("fullscreen"),
      volumeSlider = find("volumeslider"),
      volumeApi = slider(volumeSlider, api.rtl),
      noToggle = rootClasses.contains('fixed-controls') || rootClasses.contains('no-toggle');

   timelineApi.disableAnimation(rootClasses.contains('is-touch'));
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
       rootClasses.add('is-mouseover');
       rootClasses.remove('is-mouseout');
     } else {
       rootClasses.add('is-mouseout');
       rootClasses.remove('is-mouseover');
     }
   }

   // loading...
   if (!support.animation) common.html(waiting, "<p>loading &#x2026;</p>");

   if (conf.ratio) setRatio(conf.ratio);

   // no fullscreen in IFRAME
   try {
      if (!conf.fullscreen) common.removeNode(fullscreen);

   } catch (e) {
      common.removeNode(fullscreen);
   }

   api.on("ready", function(ev, api, video) {

      var duration = api.video.duration;

      timelineApi.disable(api.disabled || !duration);

      if (conf.adaptiveRatio && !isNaN(video.height / video.width)) setRatio(video.height / video.width, true);

      // initial time & volume
      common.html([durationEl, remaining], format(duration));

      // do we need additional space for showing hour
      common.toggleClass(root, 'is-long', duration >= 3600);
      volumeApi.slide(api.volumeLevel);

      if (api.engine.engineName === 'flash') timelineApi.disableAnimation(true, true);
      else timelineApi.disableAnimation(false);
      common.find('.fp-title', ui).forEach(common.removeNode);
      if (video.title) {
        common.prepend(ui, common.createElement('div', {
          className: 'fp-title'
        }, video.title));
      }


   }).on("unload", function() {
     if (!origRatio && !conf.splash) common.css(ratio, "paddingTop", "");
     timelineApi.slide(0);

   // buffer
   }).on("buffer", function() {
      var video = api.video,
         max = video.buffer / video.duration;

      if (!video.seekable && support.seekable) timelineApi.max(max);
      if (max < 1) common.css(buffer, "width", (max * 100) + "%");
      else common.css(buffer, 'width', '100%');

   }).on("speed", function(e, api, val) {
     common.text(speed, val + "x");
     speedClasses.add('fp-hilite');
     setTimeout(function() { speedClasses.remove('fp-hilite'); }, 1000);

   }).on("buffered", function() {
     common.css(buffer, 'width', '100%');
      timelineApi.max(1);

   // progress
   }).on("progress", function() {

      var time = api.video.time,
         duration = api.video.duration;

      if (!timelineApi.dragging) {
        timelineApi.slide(time / duration, api.seeking ? 0 : 250);
      }

      common.html(elapsed, format(time));
      common.html(remaining, '-' + format(duration - time));

   }).on("finish resume seek", function(e) {
      common.toggleClass(root, "is-finished", e.type == "finish");

   }).on("stop", function() {
      common.html(elapsed, format(0));
      timelineApi.slide(0, 100);

   }).on("finish", function() {
      common.html(elapsed, format(api.video.duration));
      timelineApi.slide(1, 100);
      rootClasses.remove('is-seeking');

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

         var el = common.find('.fp-message', root)[0],
             video = error.video || api.video;
         common.find('h2', el)[0].innerHTML = (api.engine && api.engine.engineName || 'html5') + ": " + error.message;
         common.find('p', el)[0].innerHTML = error.url || video.url || video.src || conf.errorUrls[error.code];
         api.off("mouseenter click");
         rootClasses.remove('is-mouseover');
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
       rootClasses.add('is-mouseover');
       rootClasses.remove('is-mouseout');
     }

   // click
   });
   bean.on(root, "click.player", function(e) {
     if (api.disabled) return;
     var kls = ClassList(e.target);
      if (kls.contains('fp-ui') || kls.contains('fp-engine') || e.flash) {
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
     common.css(timelineTooltip, 'left', (x - common.offset(controls).left - common.width(timelineTooltip) / 2) + 'px');
   });

   bean.on(root, 'contextmenu', function(ev) {
      var o = common.offset(common.find('.fp-player', root)[0]),
          w = window,
          left = ev.clientX - (o.left + w.scrollX),
          t = ev.clientY - (o.top + w.scrollY);
      if (rootClasses.contains('is-flash-disabled')) return;
      var menu = common.find('.fp-context-menu', root)[0];
      if (!menu) return;
      ev.preventDefault();
      common.css(menu,
      {left: left + 'px',
         top: t + 'px',
         display: 'block'
      });
      bean.on(root, 'click', '.fp-context-menu', function(ev) {
         ev.stopPropagation();
      });
      bean.on(document, 'click.outsidemenu', function(ev) {
         common.css(menu, 'display', 'none');
         bean.off(document, 'click.outsidemenu');
      });
   });
   api.on('flashdisabled', function() {
     rootClasses.add('is-flash-disabled');
     api.one('ready progress', function() {
       rootClasses.remove('is-flash-disabled');
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

      api.on("ready stop", function() {
        rootClasses.add("is-poster");
        api.poster = true;
        api.one("progress", function() {
          rootClasses.remove("is-poster");
          api.poster = false;
        });
      });

   }

   if (typeof conf.splash === 'string') {
     common.css(root, 'background-image', "url('" + conf.splash + "')");
   }

   // default background color if not present
   if (!has_bg && api.forcedSplash) {
      common.css(root, "background-color", "#555");
   }

   bean.on(root, 'click', '.fp-toggle, .fp-play', function() {
     if (api.disabled) return;
     api.toggle();
   });

   /* controlbar elements */
   bean.on(root, 'click', '.fp-mute', function() { api.mute(); });
   bean.on(root, 'click', '.fp-fullscreen', function() { api.fullscreen(); });
   bean.on(root, 'click', '.fp-unload', function() { api.unload(); });

   bean.on(timeline, 'slide', function(val) {
     api.seeking = true;
     api.seek(val * api.video.duration);
   });

   bean.on(volumeSlider, 'slide', function(val) {
      api.volume(val);
   });

   // times

   var time = find('time');
   bean.on(root, 'click', '.fp-time', function() {
     ClassList(time).toggle('is-inverted');
   });

   hover(noToggle);

   api.on('shutdown', function() {
     bean.off(timeline);
     bean.off(volumeSlider);
   });

});


module.exports.format = format;
