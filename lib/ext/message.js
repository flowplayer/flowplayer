var flowplayer = require('../flowplayer')
  , common = require('../common')
  , bean = require('bean');
flowplayer(function(api, root) {
  var header = common.find('.fp-header', root)[0]
    , ui = common.find('.fp-ui', root)[0];

  api.message = function(txt, ttl) {
    var msg = createMessage(txt);
    var dismiss = function() {
      common.toggleClass(msg, 'fp-shown');
      setTimeout(function() { removeMessage(msg); }, 500);
    };
    if (ttl) setTimeout(dismiss, ttl);
    return dismiss;
  }

  api.textarea = function(txt) {
    var area = document.createElement('textarea');
    area.value = txt;
    area.className = 'fp-textarea';
    ui.appendChild(area);
    bean.on(document, 'click.fptextarea', function(ev) {
      if (ev.target === area) return area.select();
      ev.stopPropagation();
      ev.preventDefault();
      common.removeNode(area);
      bean.off(document, 'click.fptextarea');
    });
  }


  function createMessage(txt) {
    var msg = common.createElement('div', {
      className: 'fp-message'
    }, txt);
    ui.insertBefore(msg, header);
    setTimeout(function() { common.toggleClass(msg, 'fp-shown'); });
    return msg;
  }

  function removeMessage(msg) {
    common.removeNode(msg);
  }
});
