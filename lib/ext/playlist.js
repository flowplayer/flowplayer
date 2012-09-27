
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

   if (items.length) {

      // highlight
      player.bind("load", function() {

         // active
         var prev = active().removeClass(klass),
            el = $("a[href*='" + player.video.src.replace(TYPE_RE, "") + "']", root).addClass(klass);

         // index
         root.removeClass("video" + els().index(prev)).addClass("video" + els().index(el));

      // without namespace callback called only once. unknown rason.
      }).bind("unload.pl", function() {
         active().tc(klass);

      });

      // next / prev
      $.each(['next', 'prev'], function(i, key) {

         player[key] = function(e) {
            var el = active()[key](); // active().next();
            if (!el.length) el = els().filter(key == 'next' ? ':first' : ':last');;
            el.click();
            e && e.preventDefault();
         };

         $(".fp-" + key, root).click(player[key]);
      });

      if (conf.advance) {
         root.unbind("finish.pl").bind("finish.pl", function() {
            root.addClass("is-playing"); // hide play button
            player.next();
         });
      }

   }


});
