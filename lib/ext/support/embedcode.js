var w = window, d = document, e;
if (!w._fpes) {
  w._fpes = [];
  w.addEventListener('load', function() {
    var s = d.createElement('script');
    s.src = '//@EMBED/@VERSION/embed.min.js';
    d.body.appendChild(s);
  });
}
e = [].slice.call(d.getElementsByTagName('script'), -1)[0].parentNode;
w._fpes.push({e: e, l: '$library', c: $conf});
