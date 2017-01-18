'use strict';
var flowplayer = require('../flowplayer'),
    bean = require('bean'),
    common = require('../common'),
    clipboard = require('./util/clipboard');

flowplayer(function(player, root) {

   // no embedding
   if (player.conf.embed === false || player.conf.share === false) return;

   var btnContainer = common.find('.fp-share-menu', root)[0],
      trigger = common.createElement('a', { "class": "fp-icon fp-embed", title: 'Copy to your site'}, 'Embed');

   common.append(btnContainer, trigger);
  //ui.appendChild(target);

   player.embedCode = function() {
     var embedConf = player.conf.embed || {},
         video = player.video,
         width = embedConf.width || video.width || common.width(root),
         height = embedConf.height || video.height || common.height(root),
         ratio = player.conf.ratio,
         itrunc = '<iframe src="' + player.shareUrl(true) + '" allowfullscreen style="border:none;';

     if (embedConf.width || embedConf.height) {
        if (!isNaN(width)) width += 'px';
        if (!isNaN(height)) height += 'px';
        return itrunc + 'width:' + width + ';height:' + height + ';"></iframe>';
     }

     if (!ratio || player.conf.adaptiveRatio) ratio = height / width;
     return '<div style="position:relative;width:100%;display:inline-block;">' + itrunc + 'position:absolute;top:0;left:0;width:100%;height:100%;"></iframe><div style="padding-top:' + (ratio * 100) + '%;"></div></div>';
   };

   bean.on(root, 'click', '.fp-embed', function() {
     clipboard(player.embedCode(), function() {
       player.message('The embed code is now on your clipboard', 2000);
     }, function() {
       player.textarea(player.embedCode(), 'Copy the code below to embed your video');
     });
   });

});
