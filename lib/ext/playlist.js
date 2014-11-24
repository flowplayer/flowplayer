var flowplayer = require('../flowplayer'),
    extend = require('extend-object'),
    bean = require('bean'),
    ClassList = require('class-list'),
    Sizzle = require('sizzle'),
    common = require('../common');
flowplayer(function(player, root) {

   var conf = extend({ active: 'is-active', advance: true, query: ".fp-playlist a" }, player.conf),
      klass = conf.active, rootClasses = ClassList(root);

   // getters
   function els() {
     return Sizzle(conf.query, root);
   }

   function active() {
      return Sizzle(conf.query + "." + klass, root);
   }


   player.play = function(i) {
      if (i === undefined) return player.resume();
      if (typeof i === 'number' && !player.conf.playlist[i]) return player;
      else if (typeof i != 'number') return player.load.apply(null, arguments);
      if (i === player.video.index) return player.resume();
      player.off('resume.fromfirst'); // Don't start from beginning if clip explicitely chosen
      player.video.index = i;
      player.load(player.conf.playlist[i], function() {
        player.video.index = i;
      });
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

   bean.on(root, 'click', '.fp-next', player.next);
   bean.on(root, 'click', '.fp-prev', player.prev);

   if (conf.advance) {
      player.off("finish.pl").on("finish.pl", function(e, player) {
         // next clip is found or loop
         var next = player.video.index >= 0 ? player.video.index + 1 : undefined;
         if (next < player.conf.playlist.length || conf.loop) {
            next = next === player.conf.playlist.length ? 0 : next;
            rootClasses.remove('is-finished');
            setTimeout(function() { // Let other finish callbacks fire first
               player.play(next);
            });

         // stop to last clip, play button starts from 1:st clip
         } else {
            rootClasses.add('is-playing'); // show play button

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
      if (!player.conf.clip) player.conf.clip = player.conf.playlist[0];
      var plEl = Sizzle('.fp-playlist', root)[0];
      if (!plEl) {
         plEl = common.createElement('div', {className: 'fp-playlist'});
         var cntrls = Sizzle('.fp-next,.fp-prev', root);
         if (!cntrls.length) common.insertAfter(root, Sizzle('video', root)[0], plEl);
         else common.insertBefore(root, cntrls[0], plEl);
      } else {
      }
      plEl.innerHTML = '';
      player.conf.playlist.forEach(function(item, i) {
         var href = typeof item === 'string' ? item : item.sources[0].src;
         plEl.appendChild(common.createElement('a', {
            href: href,
            'data-index': i
         }));
      });
   }

   if (els().length) {
      if (!playlistInitialized) {
         player.conf.playlist = [];
         els().forEach(function(el) {
            var src = el.href;
            el.setAttribute('data-index', player.conf.playlist.length);
            player.conf.playlist.push(src);
         });
      }

      /* click -> play */
      bean.on(root, "click", conf.query, function(e) {
         e.preventDefault();
         var el = e.currentTarget;
         var toPlay = Number(el.getAttribute('data-index'));
         if (toPlay != -1) {
            player.play(toPlay);
         }
      });

      // playlist wide cuepoint support TODO re-implement this
      //var has_cuepoints = els().filter("[data-cuepoints]").length;
      var has_cuepoints = false;

      // highlight
      player.on("load", function(e, api, video) {
         var prev = active()[0],
            prevIndex = prev && prev.getAttribute('data-index'),
            index = video.index = player.video.index || 0,
            el = Sizzle('a[data-index="' + index + '"]', root)[0],
            is_last = index == player.conf.playlist.length - 1;
         prev && ClassList(prev).remove(klass);
         el && ClassList(el).add(klass);
         // index
         rootClasses.remove("video" + prevIndex);
         rootClasses.add("video" + index);
         common.toggleClass(root, "last-video", is_last);

         // video properties
         video.index = api.video.index = index;
         video.is_last = api.video.is_last = is_last;

         // cuepoints
         if (has_cuepoints) player.cuepoints = el.data("cuepoints");


      // without namespace callback called only once. unknown rason.
      }).on("unload.pl", function() {
         active().forEach(function(el) {
           ClassList(el).toggle(klass);
         });
         player.conf.playlist.forEach(function(itm, i) {
           rootClasses.remove('video' + i);
         });
      });

   }

   if (player.conf.playlist.length) {
      // disable single clip looping
      player.conf.loop = false;
   }


});
