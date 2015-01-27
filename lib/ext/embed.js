'use strict';
var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    bean = require('bean'),
    common = require('../common'),
    isObject = require('is-object'),
    ClassList = require('class-list');

var fs = require('fs');

flowplayer(function(player, root) {

   // no embedding
   if (player.conf.embed === false) return;

   var conf = player.conf,
      ui = Sizzle('.fp-ui', root)[0],
      trigger = common.createElement('a', { "class": "fp-embed", title: 'Copy to your site'}),
      target = common.createElement('div',{ 'class': 'fp-embed-code'}, '<label>Paste this HTML code on your site to embed.</label><textarea></textarea>'),
      area = Sizzle("textarea", target)[0];

   ui.appendChild(trigger);
   ui.appendChild(target);

   player.embedCode = function() {
     var embedConf = player.conf.embed || {},
         video = player.video,
         width = embedConf.width || video.width || root.width(),
         height = embedConf.height || video.height || root.height();

     if (embedConf.iframe) {
       var src = player.conf.embed.iframe;
       return '<iframe src="' + player.conf.embed.iframe + '" frameBorder="0" allowfullscreen width="' + width + '" height="' + height + '"></iframe>';
     }
     var script = fs.readFileSync(__dirname + '/support/embedcode.min.js', 'utf8').replace('$conf', JSON.stringify(common.pick(player.conf, ['clip', 'ratio', 'rtmp', 'live', 'bufferTime', 'origin', 'analytics', 'key', 'subscribe'])));

     return '<a href="$href">Watch video!\n<script>$script</script></a>'.replace('$href', player.conf.origin || window.location.href).replace('$script', script);

   };
   fptip(root, ".fp-embed", "is-embedding");

   bean.on(area, 'click', function() {
      area.select();
   });

   bean.on(trigger, 'click', function() {
      area.textContent = player.embedCode();
      area.focus();
      area.select();
   });

});

var fptip = function(root, trigger, active) {

  function close() {
    rootClasses.remove(active);
    bean.off(document, '.st');
  }

  var rootClasses = ClassList(root);

  bean.on(root, 'click', trigger || 'a', function(e) {
    e.preventDefault();

    rootClasses.toggle(active);

    if (rootClasses.contains(active)) {

      bean.on(document, 'keydown.st', function(e) {
        if (e.which == 27) close();
      });
      bean.on(document, 'click.st', function(e) {
        if (!common.hasParent(e.target, '.' + active)) close();
      });
    }
  });
};

