var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    bean = require('bean'),
    common = require('../common');
flowplayer(function(player, root) {

   // no embedding
   if (player.conf.embed === false) return;

   var conf = player.conf,
      ui = Sizzle('.fp-ui', root)[0],
      trigger = common.createElement('a', { "class": "fp-embed", title: 'Copy to your site'}),
      target = common.createElement('div',{ 'class': 'fp-embed-code'}, '<label>Paste this HTML code on your site to embed.</label><textarea></textarea>'),
      area = Sizzle("textarea", target);

   ui.appendChild(trigger);
   ui.appendChild(target);

   player.embedCode = function() {

      var video = player.video,
         width = video.width || root.width(),
         height = video.height || root.height(),
         el = $("<div/>", { 'class': 'flowplayer', css: { width: width, height: height }}),
         tag = $("<video/>").appendTo(el);

      // configuration
      $.each(['origin', 'analytics', 'key', 'rtmp', 'subscribe', 'bufferTime'], function(i, key) {
         if (conf.hasOwnProperty(key)) {
             el.attr("data-" + key, conf[key]);
         }
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
         tag.append($("<source/>",
               { type: src.type != "mpegurl" ? "video/" + src.type : "application/x-mpegurl", src: path }));
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
    //FIXME
   //root.fptip(".fp-embed", "is-embedding");

   bean.on(area, 'click', function() {
      area.select();
   });

   bean.on(trigger, 'click', function() {
      area.textContent = player.embedCode();
      area.focus();
      area.select();
   });

});

//TODO FIX THIS
//$.fn.fptip = function(trigger, active) {
//
//   return this.each(function() {
//
//      var root = $(this);
//
//      function close() {
//         root.removeClass(active);
//         $(document).unbind(".st");
//      }
//
//      $(trigger || "a", this).click(function(e) {
//
//         e.preventDefault();
//
//         root.toggleClass(active);
//
//         if (root.hasClass(active)) {
//
//            $(document).bind("keydown.st", function(e) {
//               if (e.which == 27) close();
//
//            // click:close
//            }).bind("click.st", function(e) {
//               if (!$(e.target).parents("." + active).length) close();
//            });
//         }
//
//      });
//
//   });
//
//};

