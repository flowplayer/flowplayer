
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
      hovertimer;
   root.find('.fp-ratio,.fp-ui').remove();
   root.addClass("flowplayer").append('\
      <div class="ratio"/>\
      <div class="ui">\
         <div class="waiting"><em/><em/><em/></div>\
         <a class="fullscreen"/>\
         <a class="unload"/>\
         <p class="speed"/>\
         <div class="controls">\
            <a class="play"></a>\
            <div class="timeline">\
               <div class="buffer"/>\
               <div class="progress"/>\
            </div>\
            <div class="volume">\
               <a class="mute"></a>\
               <div class="volumeslider">\
                  <div class="volumelevel"/>\
               </div>\
            </div>\
         </div>\
         <div class="time">\
            <em class="elapsed">00:00</em>\
            <em class="remaining"/>\
            <em class="duration">00:00</em>\
         </div>\
         <div class="message"><h2/><p/></div>\
      </div>'.replace(/class="/g, 'class="fp-')
   );

   function find(klass) {
      return $(".fp-" + klass, root);
   }

   // widgets
   var progress = find("progress"),
      buffer = find("buffer"),
      elapsed = find("elapsed"),
      remaining = find("remaining"),
      waiting = find("waiting"),
      ratio = find("ratio"),
      speed = find("speed"),
      durationEl = find("duration"),
      origRatio = ratio.css("paddingTop"),

      // sliders
      timeline = find("timeline").slider2(api.rtl),
      timelineApi = timeline.data("api"),

      volume = find("volume"),
      fullscreen = find("fullscreen"),
      volumeSlider = find("volumeslider").slider2(api.rtl),
      volumeApi = volumeSlider.data("api"),
      noToggle = root.is(".fixed-controls, .no-toggle");

   timelineApi.disableAnimation(root.hasClass('is-touch'));

   // aspect ratio
   function setRatio(val) {
      if ((root.css('width') === '0px' || root.css('height') === '0px') || val !== flowplayer.defaults.ratio) {
         if (!parseInt(origRatio, 10)) ratio.css("paddingTop", val * 100 + "%");
      }
      if (!support.inlineBlock) $("object", root).height(root.height());
   }

   function hover(flag) {
      root.toggleClass("is-mouseover", flag).toggleClass("is-mouseout", !flag);
   }

   // loading...
   if (!support.animation) waiting.html("<p>loading &hellip;</p>");

   setRatio(conf.ratio);

   // no fullscreen in IFRAME
   try {
      if (!conf.fullscreen) fullscreen.remove();

   } catch (e) {
      fullscreen.remove();
   }


   api.bind("ready", function() {

      var duration = api.video.duration;

      timelineApi.disable(api.disabled || !duration);

      conf.adaptiveRatio && setRatio(api.video.height / api.video.width);

      // initial time & volume
      durationEl.add(remaining).html(format(duration));

      // do we need additional space for showing hour
      ((duration >= 3600) && root.addClass('is-long')) || root.removeClass('is-long');
      volumeApi.slide(api.volumeLevel);


   }).bind("unload", function() {
      if (!origRatio) ratio.css("paddingTop", "");

   // buffer
   }).bind("buffer", function() {
      var video = api.video,
         max = video.buffer / video.duration;

      if (!video.seekable && support.seekable) timelineApi.max(max);
      if (max < 1) buffer.css("width", (max * 100) + "%");
      else buffer.css({ width: '100%' });

   }).bind("speed", function(e, api, val) {
      speed.text(val + "x").addClass("fp-hilite");
      setTimeout(function() { speed.removeClass("fp-hilite") }, 1000);

   }).bind("buffered", function() {
      buffer.css({ width: '100%' });
      timelineApi.max(1);

   // progress
   }).bind("progress", function() {

      var time = api.video.time,
         duration = api.video.duration;

      if (!timelineApi.dragging) {
         timelineApi.slide(time / duration, api.seeking ? 0 : 250);
      }

      elapsed.html(format(time));
      remaining.html("-" + format(duration - time));

   }).bind("finish resume seek", function(e) {
      root.toggleClass("is-finished", e.type == "finish");

   }).bind("stop", function() {
      elapsed.html(format(0));
      timelineApi.slide(0, 100);

   }).bind("finish", function() {
      elapsed.html(format(api.video.duration));
      timelineApi.slide(1, 100);
      root.removeClass("is-seeking");

   // misc
   }).bind("beforeseek", function() {
      progress.stop();

   }).bind("volume", function() {
      volumeApi.slide(api.volumeLevel);


   }).bind("disable", function() {
      var flag = api.disabled;
      timelineApi.disable(flag);
      volumeApi.disable(flag);
      root.toggleClass("is-disabled", api.disabled);

   }).bind("mute", function(e, api, flag) {
      root.toggleClass("is-muted", flag);

   }).bind("error", function(e, api, error) {
      root.removeClass("is-loading").addClass("is-error");

      if (error) {
         error.message = conf.errors[error.code];
         api.error = true;

         var el = $(".fp-message", root);
         $("h2", el).text((api.engine || 'html5') + ": " + error.message);
         $("p", el).text(error.url || api.video.url || api.video.src || conf.errorUrls[error.code]);
         root.unbind("mouseenter click").removeClass("is-mouseover");
      }


   // hover
   }).bind("mouseenter mouseleave", function(e) {
      if (noToggle) return;

      var is_over = e.type == "mouseenter",
         lastMove;

      // is-mouseover/out
      hover(is_over);

      if (is_over) {

         root.bind("pause.x mousemove.x volume.x", function() {
            hover(true);
            lastMove = new Date;
         });

         hovertimer = setInterval(function() {
            if (new Date - lastMove > 5000) {
               hover(false)
               lastMove = new Date;
            }
         }, 100);

      } else {
         root.unbind(".x");
         clearInterval(hovertimer);
      }


   // allow dragging over the player edge
   }).bind("mouseleave", function() {

      if (timelineApi.dragging || volumeApi.dragging) {
         root.addClass("is-mouseover").removeClass("is-mouseout");
      }

   // click
   }).bind("click.player", function(e) {
      if ($(e.target).is(".fp-ui, .fp-engine") || e.flash) {
         e.preventDefault();
         return api.toggle();
      }
   }).bind('contextmenu', function(ev) {
      ev.preventDefault();
      var o = root.offset(),
          w = $(window),
          left = ev.clientX - o.left,
          t = ev.clientY - o.top + w.scrollTop();
      var menu = root.find('.fp-context-menu').css({
         left: left + 'px',
         top: t + 'px',
         display: 'block'
      }).on('click', function(ev) {
         ev.stopPropagation();
      });
      $('html').on('click.outsidemenu', function(ev) {
         menu.hide();
         $('html').off('click.outsidemenu');
      });
   });

   // poster -> background image
   if (conf.poster) root.css("backgroundImage", "url(" + conf.poster + ")");

   var bc = root.css("backgroundColor"),
      has_bg = root.css("backgroundImage") != "none" || bc && bc != "rgba(0, 0, 0, 0)" && bc != "transparent";

   // is-poster class
   if (has_bg && !conf.splash && !conf.autoplay) {

      api.bind("ready stop", function() {
         root.addClass("is-poster").one("progress", function() {
            root.removeClass("is-poster");
         });
      });

   }

   // default background color if not present
   if (!has_bg && api.forcedSplash) {
      root.css("backgroundColor", "#555");
   }

   $(".fp-toggle, .fp-play", root).click(api.toggle);

   /* controlbar elements */
   $.each(['mute', 'fullscreen', 'unload'], function(i, key) {
      find(key).click(function() {
         api[key]();
      });
   });

   timeline.bind("slide", function(e, val) {
      api.seeking = true;
      api.seek(val * api.video.duration);
   });

   volumeSlider.bind("slide", function(e, val) {
      api.volume(val);
   });

   // times
   find("time").click(function(e) {
      $(this).toggleClass("is-inverted");
   });

   hover(noToggle);

});
