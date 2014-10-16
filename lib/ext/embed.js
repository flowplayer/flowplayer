var flowplayer = require('../flowplayer'),
    Sizzle = require('sizzle'),
    bean = require('bean'),
    common = require('../common'),
    isObject = require('is-object'),
    ClassList = require('class-list');

var createAbsoluteUrl = function(url) {
  return common.createElement('img', {src: url}).src;
};

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

      var video = player.video,
         width = video.width || root.width(),
         height = video.height || root.height(),
         el = common.createElement('div', { 'class': 'flowplayer', css: { width: width, height: height }}),
         tag = common.createElement('video');
      el.appendChild(tag);

      // configuration
      ['origin', 'analytics', 'key', 'rtmp', 'subscribe', 'bufferTime'].forEach(function(key) {
        if (conf.hasOwnProperty(key)) {
          common.attr(el, 'data-' + key, conf[key]);
        }
      });

      //logo
      if (conf.logo) {
         common.attr(el, 'data-logo', createAbsoluteUrl(conf.logo));
      }

      // sources
      video.sources.forEach(function(src) {
         var path = src.src;
         if (!/^https?:/.test(src.src) && src.type !== 'flash' || !conf.rtmp) {
            path = createAbsoluteUrl(src.src);
         }
         tag.appendChild(common.createElement('source', {
           type: src.type,
           src: path 
         }));
      });

      var scriptAttrs = { src: "//@EMBED/@VERSION/embed.min.js" };
      if (isObject(conf.embed)) {
         scriptAttrs['data-swf'] = conf.embed.swf;
         scriptAttrs['data-library'] = conf.embed.library;
         scriptAttrs['src'] = conf.embed.script || scriptAttrs['src'];
         if (conf.embed.skin) { scriptAttrs['data-skin'] = conf.embed.skin; }
      }

      var code = common.createElement('foo', scriptAttrs);
      code.appendChild(el);
      var p = common.createElement('p');
      p.appendChild(code);
      return p.innerHTML.replace(/<(\/?)foo/g, "<$1script");
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

