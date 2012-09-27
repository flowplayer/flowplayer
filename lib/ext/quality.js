
// dynamic quality switching: not in v1

flowplayer(function(player, root) {

   var conf = $.extend({ labels: { lo: 'low', med: 'medium', hi: 'high' }}, player.conf.quality),
      q = player.video.qualities,
      list = q ? q.split(",") : $.map(player.video.sources, function(el) { return el.quality; }),
      klass = "active",
      wrap = $("<div/>").addClass("video-quality");


   // populate list
   if (list.length) {
      wrap.appendTo(root);

      $.each(conf.labels, function(q, label) {
         if (list.indexOf(q) != -1) {
            $("<a/>").text(label).appendTo(wrap).addClass("q-" + q).click(function() {
               if (!$(this).hasClass(klass)) setQuality(q);
            });
         }
      });
   }

   player.bind("beforeplay", function() {
      $("." + klass, wrap).removeClass(klass);
      $(".q-" + player.video.quality, wrap).addClass(klass);
   });

   function setQuality(quality) {
      var video = player.video;

      video.start = video.time;

      // -med replacement
      if (q) {
         video.src = video.src.replace("-med", "-" + quality);
         video.quality = quality;

      // pick from sources
      } else {
         $.each(video.sources, function(i, source) {
            if (source.type == video.type && source.quality == quality) {
               $.extend(video, source);
            }
         })
      }

      // Continue earlier state (play/pause)
      var paused = player.paused;

      delete video.duration;
      delete video.time;
      delete video.buffer;

      player.play(video, function() {
         if (!paused) player.play();
      });
   }

});

