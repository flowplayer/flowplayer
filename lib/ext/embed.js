'use strict';
var flowplayer = require('../flowplayer'),
    bean = require('bean'),
    common = require('../common'),
    ClassList = require('class-list');

flowplayer(function(player, root) {

   // no embedding
   if (player.conf.embed === false) return;

   var btnContainer = common.find('.fp-share-menu', root)[0],
      trigger = common.createElement('a', { "class": "fp-icon fp-embed", title: 'Copy to your site'}, 'Embed');
    //target = common.createElement('div',{ 'class': 'fp-embed-code'}, '<label>Paste this HTML code on your site to embed.</label><textarea></textarea>'),
    //area = common.find("textarea", target)[0];

   common.append(btnContainer, trigger);
  //ui.appendChild(target);

   player.embedCode = function() {
     var embedConf = player.conf.embed || {},
         video = player.video;

     var width = embedConf.width || video.width || common.width(root),
         height = embedConf.height || video.height || common.height(root),
         itrunc = '<iframe src="' + player.shareUrl(true) + '" allowfullscreen style="border:none;';

     if (embedConf.width || embedConf.height) {
        if (!isNaN(width)) width += 'px';
        if (!isNaN(height)) height += 'px';
        return itrunc + 'width:' + width + 'px;height:' + height + 'px;"></iframe>';
     }
     var ctrlHeight = common.hasClass(root, 'fixed-controls')
            ? common.height(common.find('.fp-controls', root)[0])
            : common.hasClass(root, 'no-toggle') ? 0 : 4,
         ratio = player.conf.ratio;

     ctrlHeight = ctrlHeight ? 'padding-bottom:' + ctrlHeight + 'px;' : '';
     if (!ratio || player.conf.adaptiveRatio) ratio = height / width;
     return '<div style="position:relative;width:100%;display:inline-block;' + ctrlHeight + '">' + itrunc + 'position:absolute;top:0;left:0;width:100%;height:100%;"></iframe><div style="padding-top:' + (ratio * 100) + '%;"></div></div>';
   };
   fptip(root, ".fp-embed", "is-embedding");

    /*bean.on(root, 'click', '.fp-embed-code textarea',  function() {
      area.select();
   });*/

    /*bean.on(root, 'click', '.fp-embed', function() {
      area.textContent = player.embedCode().replace(/(\r\n|\n|\r)/gm,"");
      area.focus();
      area.select();
   });*/

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

