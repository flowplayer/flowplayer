var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');

flowplayer(function(api, root) {
  var ui = common.find('.fp-ui', root)[0]
    , controlbar = common.find('.fp-controls', ui)[0];

  bean.on(root, 'click', '.fp-qsel', function() {
    var menu = common.find('.fp-qsel-menu', root)[0];
    if (common.hasClass(menu, 'fp-active')) api.hideMenu();
    else api.showMenu(menu);
  });

  bean.on(root, 'click', '.fp-qsel-menu a', function(ev) {
    var q = ev.target.getAttribute('data-quality');
    api.quality(q);
  });

  api.quality = function(q) {
    q = isNaN(Number(q)) ? q : Number(q);
    api.trigger('quality', [api, q]);
  };

  api.on('quality', function(_ev, _api, q) {
    selectQuality(q, _api.video.qualities);
  });

  api.on('ready', function(_ev, _api, video) {
    removeMenu();
    if (!video.qualities || video.qualities.filter(function(q) {
      return typeof q.value !== 'undefined' ? q.value > -1 : true;
    }).length < 2) return;
    createMenu(video.qualities, video.quality);
    selectQuality(video.quality, video.qualities);
  });

  function removeMenu() {
    common.find('.fp-qsel-menu', root).forEach(common.removeNode);
    common.find('.fp-qsel', root).forEach(common.removeNode);
  }

  function createMenu(qualities) {
    controlbar.appendChild(common.createElement('strong', { className: 'fp-qsel' }, 'HD'));
    var menu = common.createElement('div', { className: 'fp-menu fp-qsel-menu' }, '<strong>Quality</strong>');
    qualities.forEach(function(q) {
      var a = document.createElement('a')
        , quality = typeof q.value !== 'undefined' ? q.value : q;
      a.setAttribute('data-quality', quality);
      a.innerHTML = q.label || q;
      menu.appendChild(a);
    });
    ui.appendChild(menu);
  }

  function selectQuality(quality) {
    common.find('.fp-qsel-menu a', root).forEach(function(el) {
      common.toggleClass(el, 'fp-selected', el.getAttribute('data-quality') == quality);
      common.toggleClass(el, 'fp-color', el.getAttribute('data-quality') == quality);
    });
  }

});
