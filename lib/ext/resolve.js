
var TYPE_RE = /.(\w{3,4})$/i;

function parseSource(el) {

   var src = el.attr("src"),
      type = (el.attr("type") || "").replace("video/", ""),
      suffix = src.split(TYPE_RE)[1];

   return { src: src, suffix: suffix || type, type: type || suffix };
}

/* Resolves video object from initial configuration and from load() method */
function URLResolver(videoTag) {

   var self = this,
      sources = [];

   // initial sources
   $("source", videoTag).each(function() {
      sources.push(parseSource($(this)));
   });

   if (!sources.length) sources.push(parseSource(videoTag));

   self.initialSources = sources;

   self.resolve = function(video) {
      if (!video) return { sources: sources };

      if ($.isArray(video)) {

         video = { sources: $.map(video, function(el) {
            var type = Object.keys(el)[0];
            el.type = type;
            el.src = el[type];
            delete el[type];
            return el;
         })};

      } else if (typeof video == 'string') {

         video = { src: video, sources: [] };

         $.each(sources, function(i, source) {
            if (source.type != 'flash') {
               video.sources.push({
                  type: source.type,
                  src: video.src.replace(TYPE_RE, "") + "." + source.suffix
               });
            }
         });
      }

      return video;
   };

};
