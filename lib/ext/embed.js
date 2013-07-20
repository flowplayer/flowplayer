
flowplayer(function(player, root) {

   // no embedding
   if (player.conf.embed === false) return;

   var conf = player.conf,
      ui = $(".fp-ui", root),
      trigger = $("<a/>", { "class": "fp-embed", title: 'Copy to your site'}).appendTo(ui),
      target = $("<div/>", { 'class': 'fp-embed-code'})
         .append("<label>Paste this HTML code on your site to embed.</label><textarea/>").appendTo(ui),
      area = $("textarea", target);

   player.embedCode = function() {

      var video = player.video,
         width = video.width || root.width(),
         height = video.height || root.height(),
         el = $("<div/>", { 'class': 'flowplayer', css: { width: width, height: height }}),
         tag = $("<video/>").appendTo(el);

      // configuration
      $.each(['origin', 'analytics', 'key', 'rtmp'], function(i, key) {
         if (conf[key]) el.attr("data-" + key, conf[key]);
      });

      //logo
      if (conf.logo) {
         el.attr('data-logo', $('<img />').attr('src', conf.logo)[0].src);
      }

      // sources
      $.each(video.sources, function(i, src) {
         var path = src.src;
         if (!/^https?:/.test(src.src) && src.type !== 'flash' || !conf.rtmp) {
            path = $("<img/>").attr("src", src.src)[0].src;
         }
         tag.append($("<source/>", { type: "video/" + src.type, src: path }));
      });

      var scriptAttrs = { src: "//@EMBED/@VERSION/embed.min.js" };
      if ($.isPlainObject(conf.embed)) {
         scriptAttrs['data-swf'] = conf.embed.swf;
         scriptAttrs['data-library'] = conf.embed.library;
         scriptAttrs['src'] = conf.embed.script || scriptAttrs['src'];
         if (conf.embed.skin) { scriptAttrs['data-skin'] = conf.embed.skin; }
      }

      var code = $("<foo/>", scriptAttrs).append(el);
      return $("<p/>").append(code).html().replace(/<(\/?)foo/g, "<$1script");
   };

   root.fptip(".fp-embed", "is-embedding");

   area.click(function() {
      this.select();
   });

   trigger.click(function() {
      area.text(player.embedCode());
      area[0].focus();
      area[0].select();
   });

});


$.fn.fptip = function(trigger, active) {

   return this.each(function() {

      var root = $(this);

      function close() {
         root.removeClass(active);
         $(document).unbind(".st");
      }

      $(trigger || "a", this).click(function(e) {

         e.preventDefault();

         root.toggleClass(active);

         if (root.hasClass(active)) {

            $(document).bind("keydown.st", function(e) {
               if (e.which == 27) close();

            // click:close
            }).bind("click.st", function(e) {
               if (!$(e.target).parents("." + active).length) close();
            });
         }

      });

   });

};

