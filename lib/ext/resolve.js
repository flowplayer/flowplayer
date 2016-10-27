'use strict';
var TYPE_RE = /\.(\w{3,4})(\?.*)?$/i,
    extend = require('extend-object');

function parseSource(el) {

   var src = el.attr("src"),
      type = el.attr("type") || "",
      suffix = src.split(TYPE_RE)[1];
   type = type.toLowerCase();
   return extend(el.data(), { src: src, suffix: suffix || type, type: type || suffix });
}

function getType(typ) {
  if (/mpegurl/i.test(typ)) return 'application/x-mpegurl';
  return 'video/' + typ;
}

/* Resolves video object from initial configuration and from load() method */
module.exports = function URLResolver() {
  var self = this;

  self.sourcesFromVideoTag = function(videoTag, $) {
    var sources = [];
    // initial sources
    $("source", videoTag).each(function() {
      sources.push(parseSource($(this)));
    });

    if (!sources.length && videoTag.length) sources.push(parseSource(videoTag));

    return sources;
  };


  self.resolve = function(video, sources) {
    if (!video) return { sources: sources };

    if (typeof video == 'string') {
      video = { src: video, sources: [] };
      video.sources = (sources || []).map(function(source) {
        var suffix = source.src.split(TYPE_RE)[1];
        return {type: source.type, src: video.src.replace(TYPE_RE, '.' + suffix + "$2")};
      });
    }

    if (video instanceof Array) {
      video = {
        sources: video.map(function(src) {
          if (src.type && src.src) return src;
          return Object.keys(src).reduce(function(m, typ) {
            return extend(m, {
              type: getType(typ),
              src: src[typ]
            });
          }, {});
        })
      };
    }

    return video;
  };
};

module.exports.TYPE_RE = TYPE_RE;
