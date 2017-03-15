'use strict';
var flowplayer = require('../flowplayer'),
    extend = require('extend-object'),
    bean = require('bean'),
    common = require('../common'),
    Resolve = require('./resolve'),
    resolver = new Resolve(),
    $ = window.jQuery,
    externalRe = /^#/;
flowplayer(function(player, root) {

   var conf = extend({ active: 'is-active', advance: true, query: ".fp-playlist a" }, player.conf)
     , klass = conf.active
     , ui = common.find('.fp-ui', root)[0];

   var hasCustomPlaylist = common.hasClass(root, 'fp-custom-playlist') || !!conf.customPlaylist;
   common.toggleClass(root, 'fp-custom-playlist', hasCustomPlaylist);
   common.toggleClass(root, 'fp-default-playlist', !hasCustomPlaylist);

   // getters
   function els() {
     return common.find(conf.query, queryRoot());
   }

   function queryRoot() {
     if (externalRe.test(conf.query)) return;
     return root;
   }

   function active() {
      return common.find(conf.query + "." + klass, queryRoot());
   }


   player.play = function(i) {
      if (i === undefined) return player.resume();
      if (typeof i === 'number' && !player.conf.playlist[i]) return player;
      else if (typeof i != 'number') return player.load.apply(null, arguments);
      var arg = extend({index: i}, player.conf.playlist[i]);
      player.off('beforeresume.fromfirst'); // Don't start from beginning if clip explicitely chosen
      if (i === player.video.index) return player.load(arg, function() { player.resume(); });
      player.load(arg, function() {
        player.video.index = i;
      });
      return player;
   };

   player.next = function(e) {
      if (e) e.preventDefault();
      var current = player.video.index;
      if (current != -1) {
         current = current === player.conf.playlist.length - 1 ? 0 : current + 1;
         player.play(current);
      }
      return player;
   };

   player.prev = function(e) {
      if (e) e.preventDefault();
      var current = player.video.index;
      if (current != -1) {
         current = current === 0 ? player.conf.playlist.length - 1 : current - 1;
         player.play(current);
      }
      return player;
   };

   player.setPlaylist = function(items, keepCurrentIndex) {
     player.conf.playlist = items;
     if (!keepCurrentIndex) delete player.video.index;
     generatePlaylist();
     return player;
   };

   player.addPlaylistItem = function(item) {
     delete player.video.is_last;
     return player.setPlaylist(player.conf.playlist.concat([item]), true);
   };

   player.removePlaylistItem = function(idx) {
     var pl = player.conf.playlist;
     return player.setPlaylist(pl.slice(0, idx).concat(pl.slice(idx+1)));
   };

   bean.on(root, 'click', '.fp-next', player.next);
   bean.on(root, 'click', '.fp-prev', player.prev);

   if (conf.advance) {
      player.off("finish.pl").on("finish.pl", function(e, player) {
         // clip looping
         if (player.video.loop) return player.seek(0, function() { player.resume(); });
         // next clip is found or loop
         var next = player.video.index >= 0 ? player.video.index + 1 : undefined;
         if (next < player.conf.playlist.length || conf.loop) {
            next = next === player.conf.playlist.length ? 0 : next;
            common.removeClass(root, 'is-finished');
            setTimeout(function() { // Let other finish callbacks fire first
               player.play(next);
            });

         // stop to last clip, play button starts from 1:st clip
         } else {

            // If we have multiple items in playlist, start from first
            if (player.conf.playlist.length > 1) {
              player.one("beforeresume.fromfirst", function(ev) {
                ev.preventDefault();
                player.play(0);
              });
              player.one('seek', function() { player.off('beforeresume.fromfirst'); });
            }
         }
      });
   }

   function generatePlaylist() {
      var plEl = common.find('.fp-playlist', root)[0]
      if (!plEl) {
         plEl = common.createElement('div', {className: 'fp-playlist'});
         var cntrls = common.find('.fp-next,.fp-prev', root);
         if (!cntrls.length) common.insertAfter(root, common.find('video', root)[0], plEl);
         else cntrls[0].parentElement.insertBefore(plEl, cntrls[0]);
      }
      plEl.innerHTML = '';
      if (player.conf.playlist[0].length) { // FP5 style playlist
        player.conf.playlist = player.conf.playlist.map(function(itm) {
          if (typeof itm === 'string') {
            var type = itm.split(Resolve.TYPE_RE)[1];
            return {
              sources: [{
                type: type.toLowerCase() === 'm3u8' ? 'application/x-mpegurl' : 'video/' + type,
                src: itm
              }]
            };
          }
          return {
            sources: itm.map(function(src) {
              var s = {};
              Object.keys(src).forEach(function(k) {
                s.type = /mpegurl/i.test(k) ? 'application/x-mpegurl' : 'video/' + k;
                s.src = src[k];
              });
              return s;
            })
          };
        });
      }
      player.conf.playlist.forEach(function(item, i) {
         var href = item.sources[0].src;
         plEl.appendChild(common.createElement('a', {
            href: href,
            className: player.video.index === i ? klass : undefined,
            'data-index': i
         }));
      });
   }

   var playlistInitialized = false;
   if (player.conf.playlist.length) { // playlist configured by javascript, generate playlist
      playlistInitialized = true;
      generatePlaylist();
      if (!player.conf.clip || !player.conf.clip.sources.length) {
        player.conf.clip = player.conf.playlist[player.conf.startIndex || 0];
      }
   }

   if (els().length && !playlistInitialized) { //generate playlist from existing elements
       player.conf.playlist = [];
       delete player.conf.startIndex;
       els().forEach(function(el) {
          var src = el.href;
          el.setAttribute('data-index', player.conf.playlist.length);
          var itm = resolver.resolve(src, player.conf.clip.sources);
          if ($) {
            extend(itm, $(el).data());
          }
          player.conf.playlist.push(itm);
       });
    }

    common.find('.fp-prev,.fp-next,.fp-playlist', root).forEach(function(el) {
      ui.appendChild(el);
    });

    /* click -> play */
    bean.on(externalRe.test(conf.query) ? document : root, "click", conf.query, function(e) {
       e.preventDefault();
       var el = e.currentTarget;
       var toPlay = Number(el.getAttribute('data-index'));
       if (toPlay != -1) {
          player.play(toPlay);
       }
    });

    // highlight
    function videoIndex(video) {
      if (typeof video.index !== 'undefined') return video.index;
      if (typeof player.video.index !== 'undefined') return player.video.index;
      return player.conf.startIndex || 0;
    }
    player.on("load", function(e, api, video) {
       if (!player.conf.playlist.length) return;
       var prev = active()[0],
          prevIndex = prev && prev.getAttribute('data-index'),
          index = video.index = videoIndex(video),
          el = common.find(conf.query +'[data-index="' + index + '"]', queryRoot())[0],
          is_last = index == player.conf.playlist.length - 1;
       if (prev) common.removeClass(prev, klass);
       if (el) common.addClass(el, klass);
       // index
       common.removeClass(root, 'video' + prevIndex);
       common.addClass(root, 'video' + index);
       common.toggleClass(root, "last-video", is_last);

       // video properties
       video.index = api.video.index = index;
       video.is_last = api.video.is_last = is_last;

    // without namespace callback called only once. unknown rason.
    }).on("unload.pl", function() {
       if (!player.conf.playlist.length) return;
       active().forEach(function(el) {
         common.toggleClass(el, klass);
       });
       player.conf.playlist.forEach(function(itm, i) {
         common.removeClass(root, 'video' + i);
       });
    });

   if (player.conf.playlist.length) {
      // disable single clip looping
      player.conf.loop = false;
   }


});
