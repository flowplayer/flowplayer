var flowplayer = require('../flowplayer')
  , common = require('../common');
flowplayer(function(api, root) {
  var header = common.find('.fp-header', root)[0]
    , ui = common.find('.fp-ui', root)[0];

  api.message = function(txt, ttl) {
    var msg = createMessage(txt);
    if (ttl) setTimeout(function() {
      common.toggleClass(msg, 'fp-shown');
      setTimeout(function() { removeMessage(msg); }, 500);
    }, ttl);
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
