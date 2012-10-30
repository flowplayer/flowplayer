
flowplayer(function(player, root) {

   var conf = $.extend({ active: 'is-active', advance: true, query: ".fp-playlist a" }, player.conf),
      klass = conf.active;

   // getters
   function els() {
      return $(conf.query, root);
   }

   function active() {
      return $(conf.query + "." + klass, root);
   }

   // click -> play
   var items = els().live("click", function(e) {
      var el = $(this);
      el.is("." + klass) ? player.toggle() : player.load(el.attr("href"));
      e.preventDefault();
   });

   player.play = function(i) {
      if (i === undefined) player.resume();
      else if (typeof i != 'number') player.load.apply(null, arguments);
      else els().eq(i).click();
      return player;
   };

   if (items.length) {

      // disable single clip looping
      player.conf.loop = false;

      // playlist wide cuepoint support
      var has_cuepoints = items.filter("[data-cuepoints]").length;

      // highlight
      player.bind("load", function() {

         // active
         var prev = active().removeClass(klass),
            el = $("a[href*='" + player.video.src.replace(TYPE_RE, "") + "']", root).addClass(klass),
            clips = els(),
            index = clips.index(el),
            is_last = index == clips.length - 1;

         // index
         root.removeClass("video" + clips.index(prev)).addClass("video" + index).toggleClass("last-video", is_last);

         // video properties
         player.video.index = index;
         player.video.is_last = is_last;

         // cuepoints
         if (has_cuepoints) player.cuepoints = el.data("cuepoints");


      // without namespace callback called only once. unknown rason.
      }).bind("unload.pl", function() {
         active().toggleClass(klass);

      });

      // api.next() / api.prev()
      $.each(['next', 'prev'], function(i, key) {

         player[key] = function(e) {
            e && e.preventDefault();

            // next (or previous) entry
            var el = active()[key]();

            // cycle
            if (!el.length) el = els().filter(key == 'next' ? ':first' : ':last');;

            el.click();
         };

         $(".fp-" + key, root).click(player[key]);
      });

      if (conf.advance) {
         root.unbind("finish.pl").bind("finish.pl", function() {

            // next clip is found or loop
            if (active().next().length || conf.loop) {
               player.next();

            // stop to last clip, play button starts from 1:st clip
            } else {
               root.addClass("is-playing"); // show play button

               player.one("resume", function() {
                  player.next();
                  return false;
               });
            }
         });
      }

   }


});
