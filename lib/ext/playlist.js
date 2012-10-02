
flowplayer(function(player, root) {

   var conf = $.extend({ active: 'is-active', advance: true, query: ".fp-playlist a" }, player.conf),
      klass = conf.active;

   // disable single clip looping
   player.conf.loop = false;

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

   if (items.length) {

      // playlist wide cuepoint support
      var has_cuepoints = items.filter("[data-cuepoints]").length;

      // highlight
      player.bind("load", function() {

         // active
         var prev = active().removeClass(klass),
            el = $("a[href*='" + player.video.src.replace(TYPE_RE, "") + "']", root).addClass(klass),
            clips = els(),
            index = clips.index(el);

         // index
         root.removeClass("video" + clips.index(prev)).addClass("video" + index);

         // video properties
         player.video.index = index;
         player.video.is_last = index == clips.length - 1;

         // cuepoints
         if (has_cuepoints) player.cuepoints = el.data("cuepoints");

      // without namespace callback called only once. unknown rason.
      }).bind("unload.pl", function() {
         active().tc(klass);

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

      player.play = function(i) {
         els().eq(i).click();
      };


      if (conf.advance) {
         root.unbind("finish.pl").bind("finish.pl", function() {
            root.addClass("is-playing"); // hide play button

            // next clip is found or loop
            if (active().next().length || conf.loop) {
               player.next();

            // stop to last clip, play button starts from 1:st clip
            } else {
               player.one("resume", function() {
                  player.next();
                  return false;
               });
            }
         });
      }

   }


});
