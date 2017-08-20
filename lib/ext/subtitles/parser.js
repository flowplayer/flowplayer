module.exports = function(txt) {
  var TIMECODE_RE = /^(([0-9]+:){1,2}[0-9]{2}[,.][0-9]{3}) --\> (([0-9]+:){1,2}[0-9]{2}[,.][0-9]{3})(.*)/;

  function seconds(timecode) {
     var els = timecode.split(':');
     if (els.length == 2) els.unshift(0);
     return els[0] * 60 * 60 + els[1] * 60 + parseFloat(els[2].replace(',','.'));
  }

  var entries = [];
  for (var i = 0, lines = txt.split("\n"), len = lines.length, entry = {}, title, timecode, text; i < len; i++) {
    timecode = TIMECODE_RE.exec(lines[i]);

    if (timecode) {

      // title
      title = lines[i - 1];

      // text
      text = "<p>" + lines[++i] + "</p><br/>";
      while (typeof lines[++i] === 'string' && lines[i].trim() && i < lines.length) text +=  "<p>" + lines[i] + "</p><br/>";

      // entry
      entry = {
        title: title,
        startTime: seconds(timecode[1]),
        endTime: seconds(timecode[3]),
        text: text
      };
      entries.push(entry);
    }
  }
  return entries;
};
