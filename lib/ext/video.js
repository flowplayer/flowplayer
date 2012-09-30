
var TYPE_RE = /.(\w{3,4})$/i;

function parseSource(el) {
   var type = el.attr("type"), src = el.attr("src");
   return { src: src, type: type ? type.replace("video/", "") : src.split(TYPE_RE)[1] };
}

/* Resolves video object from initial configuration and from load() method */
flowplayer(function(api, root) {

   var videoTag = $("video", root),
      initialSources = [];

   // initial video
   $("source", videoTag).each(function() {
      initialSources.push(parseSource($(this)));
   });

   if (!initialSources.length) initialSources.push(parseSource(videoTag));

   api.video = { sources: initialSources };

   // a new video is loaded
   api.bind("load", function(e, api, video, engine) {

      video = video || api.video;

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

         $.each(initialSources, function(i, source) {
            video.sources.push({
               type: source.type,
               src: video.src.replace(TYPE_RE, "") + "." + source.type
            });
         });

      }

      api.video = $.extend(video, engine.load(video));



   });

});
