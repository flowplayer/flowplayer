
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


   player.play = function(i) {
      if (i === undefined) player.resume();
      else if (typeof i != 'number') player.load.apply(null, arguments);
      player.load(player.conf.playlist[i].map(function(item) { return $.extend({}, item); }));
      return player;
   };

   var indexForVideo = function(src,sources) {
      var i, j;
      for (i = 0; i < player.conf.playlist.length; i++) {
         for (j = 0; j < player.conf.playlist[i].length; j++) {
            var source = player.conf.playlist[i][j];
            for (var type in source) {
               if (source.hasOwnProperty(type) && source[type] == src) {
                  return i;
               }
            }
         }
      }
      //Not found, try if has additional sources like from initial load
      if (sources && sources.length) {
         for (i = 0; i < sources.length; i++) {
            var found = indexForVideo(sources[i].src);
            if (found != -1) return found;
         }
      }
      return -1;
   };

   var currentClipIndex = function() {
      return indexForVideo(player.video.src);
   };

   var getType = function(src) {
      return 'video/' + src.split(TYPE_RE)[1];
   };

   player.next = function(e) {
      e && e.preventDefault();
      var current = currentClipIndex();
      if (current != -1) {
         current = current === player.conf.playlist.length - 1 ? 0 : current + 1;
         player.play(current);
      }
   };

   player.prev = function(e) {
      e && e.preventDefault();
      var current = currentClipIndex();
      if (current != -1) {
         current = current === 0 ? player.conf.playlist.length - 1 : current - 1;
         player.play(current);
      }
   };

   $('.fp-next', root).click(player.next);
   $('.fp-prev', root).click(player.prev);

   if (conf.advance) {
      root.unbind("finish.pl").bind("finish.pl", function(e, player) {

         // next clip is found or loop
         var next = indexForVideo(player.video.src, player.video.sources) + 1;
         if (next < player.conf.playlist.length || conf.loop) {
            next = next === player.conf.playlist.length ? 0 : next;
            player.play(next);

         // stop to last clip, play button starts from 1:st clip
         } else {
            root.addClass("is-playing"); // show play button

            player.one("resume", function() {
               player.play(0);
               return false;
            });
         }
      });
   }

   if (els().length) {
      els().each(function() {
         var src = $(this).attr('href');
         var type = getType(src);
         var one = {};
         one[type] = src;
         player.conf.playlist.push([one]);
      });

      /* click -> play */
      root.on("click", conf.query, function(e) {
         var el = $(e.target).closest(conf.query);
         var toPlay = indexForVideo(el.attr('href'));
         if (toPlay != -1) {
            player.play(toPlay);
         }
         e.preventDefault();
      });

      // playlist wide cuepoint support
      var has_cuepoints = els().filter("[data-cuepoints]").length;

      // highlight
      player.bind("load", function(e, api, video) {

         // active
         var prev = active().removeClass(klass),
            el = $("a[href*='" + video.src.replace(TYPE_RE, "") + ".']", root).addClass(klass),
            clips = els(),
            index = clips.index(el),
            is_last = index == clips.length - 1;

         // index
         root.removeClass("video" + clips.index(prev)).addClass("video" + index).toggleClass("last-video", is_last);

         // video properties
         video.index = index;
         video.is_last = is_last;

         // cuepoints
         if (has_cuepoints) player.cuepoints = el.data("cuepoints");


      // without namespace callback called only once. unknown rason.
      }).bind("unload.pl", function() {
         active().toggleClass(klass);

      });

   }

   if (player.conf.playlist.length) {
      // disable single clip looping
      player.conf.loop = false;
   }


});
