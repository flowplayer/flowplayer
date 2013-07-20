
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
      if (i === undefined) return player.resume();
      if (typeof i === 'number' && !player.conf.playlist[i]) return player;
      else if (typeof i != 'number') player.load.apply(null, arguments);
      player.unbind('resume.fromfirst'); // Don't start from beginning if clip explicitely chosen
      player.video.index = i;
      player.load(typeof player.conf.playlist[i] === 'string' ?
         player.conf.playlist[i].toString() :
         $.map(player.conf.playlist[i], function(item) { return $.extend({}, item); })
      );
      return player;
   };

   player.next = function(e) {
      e && e.preventDefault();
      var current = player.video.index;
      if (current != -1) {
         current = current === player.conf.playlist.length - 1 ? 0 : current + 1;
         player.play(current);
      }
      return player;
   };

   player.prev = function(e) {
      e && e.preventDefault();
      var current = player.video.index;
      if (current != -1) {
         current = current === 0 ? player.conf.playlist.length - 1 : current - 1;
         player.play(current);
      }
      return player;
   };

   $('.fp-next', root).click(player.next);
   $('.fp-prev', root).click(player.prev);

   if (conf.advance) {
      root.unbind("finish.pl").bind("finish.pl", function(e, player) {

         // next clip is found or loop
         var next = player.video.index + 1;
         if (next < player.conf.playlist.length || conf.loop) {
            next = next === player.conf.playlist.length ? 0 : next;
            root.removeClass('is-finished');
            setTimeout(function() { // Let other finish callbacks fire first
               player.play(next);
            });

         // stop to last clip, play button starts from 1:st clip
         } else {
            root.addClass("is-playing"); // show play button

            // If we have multiple items in playlist, start from first
            if (player.conf.playlist.length > 1) player.one("resume.fromfirst", function() {
               player.play(0);
               return false;
            });
         }
      });
   }

   var playlistInitialized = false;
   if (player.conf.playlist.length) { // playlist configured by javascript, generate playlist
      playlistInitialized = true;
      var plEl = root.find('.fp-playlist');
      if (!plEl.length) {
         plEl = $('<div class="fp-playlist"></div>');
         var cntrls = $('.fp-next,.fp-prev', root);
         if (!cntrls.length) $('video', root).after(plEl);
         else cntrls.eq(0).before(plEl);
      }
      plEl.empty();
      $.each(player.conf.playlist, function(i, item) {
         var href;
         if (typeof item === 'string') {
            href = item;
         } else {
            for (var key in item[0]) {
               if (item[0].hasOwnProperty(key)) {
                  href = item[0][key];
                  break;
               }
            }
         }
         plEl.append($('<a />').attr({
            href: href,
            'data-index': i
         }));
      });
   }

   if (els().length) {
      if (!playlistInitialized) {
         player.conf.playlist = [];
         els().each(function() {
            var src = $(this).attr('href');
            $(this).attr('data-index', player.conf.playlist.length);
            player.conf.playlist.push(src);
         });
      }

      /* click -> play */
      root.on("click", conf.query, function(e) {
         e.preventDefault();
         var el = $(e.target).closest(conf.query);
         var toPlay = Number(el.attr('data-index'));
         if (toPlay != -1) {
            player.play(toPlay);
         }
      });

      // playlist wide cuepoint support
      var has_cuepoints = els().filter("[data-cuepoints]").length;

      // highlight
      player.bind("load", function(e, api, video) {
         var prev = active().removeClass(klass),
            prevIndex = prev.attr('data-index'),
            index = video.index = player.video.index || 0,
            el = $('a[data-index="' + index + '"]', root).addClass(klass),
            is_last = index == player.conf.playlist.length - 1;
         // index
         root.removeClass("video" + prevIndex).addClass("video" + index).toggleClass("last-video", is_last);

         // video properties
         video.index = api.video.index = index;
         video.is_last = api.video.is_last = is_last;

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
