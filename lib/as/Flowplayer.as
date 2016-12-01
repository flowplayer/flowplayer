/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2012 - 2014 Flowplayer Ltd
 http://flowplayer.org

 Authors: Tero Piirainen, Anssi Piirainen

 -----

 This GPL version includes Flowplayer branding

 http://flowplayer.org/GPL-license/#term-7

 Commercial versions are available
 * part of the upgrade cycle
 * support the player development
 * no Flowplayer trademark

 http://flowplayer.org/pricing/
 */
package {
    import flash.display.DisplayObject;
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.*;
    import flash.external.ExternalInterface;
    import flash.media.Video;
    import flash.system.Security;
    import flash.geom.Rectangle;

    public class Flowplayer extends Sprite {
        // events
        internal static const PLAY : String = "play";
        internal static const READY : String = "ready";
        internal static const PAUSE : String = "pause";
        internal static const RESUME : String = "resume";
        internal static const SEEK : String = "seek";
        internal static const STATUS : String = "status";
        internal static const BUFFERED : String = "buffered";
        internal static const VOLUME : String = "volume";
        internal static const FINISH : String = "finish";
        internal static const UNLOAD : String = "unload";
        internal static const ERROR : String = "error";
        internal static const METADATA : String = "metadata";
        internal static const SET : String = "set";
        internal static const GET : String = "get";
        internal static const QUALITY : String = "quality";
        // external interface
        private static const INTERFACE : Array = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, UNLOAD, STATUS, SET, GET, QUALITY);
        // flashvars
        private var conf : Object;
        // state
        private var preloadComplete : Boolean;
        private var paused : Boolean;
        private var video : Video;
        private var logo : DisplayObject;
        private var provider : StreamProvider;

        /* constructor */
        public function Flowplayer() {
            Security.allowDomain("*");
            stage.scaleMode = StageScaleMode.NO_SCALE;
            stage.align = StageAlign.TOP_LEFT;

            var swfUrl : String = decodeURIComponent(this.loaderInfo.url);
            if (swfUrl.indexOf("callback=") > 0) throw new Error("Security error");

            configure();

            // IE needs mouse / keyboard events
            stage.addEventListener(MouseEvent.CLICK, function(e : MouseEvent) : void {
                fire("click", null);
            });

            stage.addEventListener(KeyboardEvent.KEY_DOWN, function(e : KeyboardEvent) : void {
                fire("keydown", e.keyCode);
            });

            stage.addEventListener(Event.RESIZE, arrange);
            stage.addEventListener(Event.RESIZE, _onStageResize);

            var player : Flowplayer = this;
            // The API
            for (var i : Number = 0; i < INTERFACE.length; i++) {
                debug("creating callback " + INTERFACE[i] + " id == " + ExternalInterface.objectID);
                ExternalInterface.addCallback("__" + INTERFACE[i], player[INTERFACE[i]]);
            }
            init();

            initProvider(); 
        }

        public function set(key : String, value : String) : void {
            debug('set: ' + key + ':' + value);
            if (value === "false") conf[key] = false;
            else if (value === "null") conf[key] = null;
            else conf[key] = value;
            if (CONFIG::HLS) {
              if (key.indexOf("hls_") !== -1 && provider is HLSStreamProvider) {
                provider.setProviderParam(key.substr(4), value);
              }
            }
        }

        public function get(key : String) : String {
          debug('get: ' + key);
          return conf[key];
        }

        /************ Public API ************/
        // switch url
        public function play(url : String, reconnect : Boolean) : void {
            debug("play(" + url + ", " + reconnect + ")");
            conf.url = encodeURI(url);
            debug("debug.url", conf.url);
            if (reconnect || providerChangeNeeded(url)) {
              initProvider();
            } else {
              provider.play(conf.url);
            }
            return;
        }

        public function resize() : void {
            debug('Flowplayer::resize()');
            var video : Video = provider.video;
            var rect : Rectangle = resizeRectangle();
            video.width = rect.width;
            video.height = rect.height;
            video.x = rect.x;
            video.y = rect.y;
        }

        public function quality(q : Number) : void {
          debug("quality()", q);
          provider.setQuality(q);
        }


        public function pause() : void {
            debug("pause()");
            provider.pause();
            return;
        }

        public function resume() : void {
            debug("resume()");
            provider.resume();
            return;
        }

        public function seek(seconds : Number) : void {
            debug("seek(" + seconds + ")");
            provider.seek(seconds);
            return;
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
            debug("volume(" + level + ")");
            provider.volume(level, fireEvent);
            return;
        }

        public function unload() : void {
            debug("unload()");
            provider.unload();
            return;
        }

        public function status() : Object {
            if (! provider) return null;
            return provider.status();
        }

        /************* Private API ***********/
        private function init() : void {
            debug("init()", conf);
            video = new Video();
            video.smoothing = true;
            this.addChild(video);
            logo = new Logo();
            addLogo();
            arrange();

            conf.url = encodeURI(conf.url);
            debug("debug.url", conf.url);

            paused = !conf.autoplay;
            preloadComplete = false;
        }

        private function providerChangeNeeded(url: String) : Boolean {
            if (!CONFIG::HLS) return false;
            else {
              return (url.indexOf(".m3u") != -1 && provider is NetStreamProvider) ||
                  (url.indexOf('.m3u') == -1 && !(provider is NetStreamProvider));
            }
        }
        // Adapted from https://github.com/mangui/flashls/blob/dev/src/org/mangui/hls/utils/ScaleVideo.as
        private function resizeRectangle() : Rectangle {
          var video : Video = provider.video,
              videoWidth : int = video.videoWidth,
              videoHeight : int = video.videoHeight,
              containerWidth : int = stage.stageWidth,
              containerHeight : int = stage.stageHeight;
          var rect : Rectangle = new Rectangle();
          var xscale : Number = containerWidth / videoWidth;
          var yscale : Number = containerHeight / videoHeight;
          if (xscale >= yscale) {
              rect.width = Math.min(videoWidth * yscale, containerWidth);
              rect.height = videoHeight * yscale;
          } else {
              rect.width = Math.min(videoWidth * xscale, containerWidth);
              rect.height = videoHeight * xscale;
          }
          rect.width = Math.ceil(rect.width);
          rect.height = Math.ceil(rect.height);
          rect.x = Math.round((containerWidth - rect.width) / 2);
          rect.y = Math.round((containerHeight - rect.height) / 2);
          return rect;
        }

        private function initProvider() : void {
            if (provider) provider.unload();
            // setup provider from URL
            if (CONFIG::HLS) {
                // detect HLS by checking the extension of src
                if (conf.url.indexOf(".m3u") != -1) {
                    debug("HLS stream detected!");
                    provider = new HLSStreamProvider(this, video);
                    for (var key : String in conf) {
                      if (key.indexOf("hls_") !== -1) {
                        provider.setProviderParam(key.substr(4), conf[key]);
                      }
                    }
                } else {
                    provider = new NetStreamProvider(this, video);
                }
            } else {
                provider = new NetStreamProvider(this, video);
            }
            provider.load(conf);
        }

        internal function debug(msg : String, data : Object = null) : void {
            if (!conf.debug) return;
            fire("debug: " + msg, data);
            // ExternalInterface.call("console.log", msg, data);
        }

        internal function fire(type : String, data : Object = null) : void {
            if (conf.callback) {
                if (data !== null) {
                    ExternalInterface.call(conf.callback, type, data);
                } else {
                    ExternalInterface.call(conf.callback, type);
                }
            }
        }

        private function arrange(e : Event = null) : void {
            logo.x = 12;
            logo.y = stage.stageHeight - 50;
            video.width = stage.stageWidth;
            video.height = stage.stageHeight;
        };

        private function _onStageResize(e: Event) : void {
          debug('Stage resized');
          resize();
        }

        private function addLogo() : void {
            var url : String = (conf.rtmp) ? conf.rtmp : unescape(conf.url) ? unescape(conf.url) : '';
            var pos : Number;
            var whitelist : Array = ['cdn.flowplayer.org', 'cdn.dev.flowplayer.org', 'drive.flowplayer.org', 'drive.dev.flowplayer.org', 'my.flowplayer.org', 'rtmp.flowplayer.org'];

            for each (var wl : String in whitelist) {
                pos = url.indexOf('://' + wl)
                if (pos == 4 || pos == 5) return;
                // from flowplayer Drive
            }

            addChild(logo);
        }

        private function configure() : void {
            conf = this.loaderInfo.parameters;

            function decode(prop : String, parseAsJSON : Boolean = false) : void {
                if (conf[prop] == "false") {
                    conf[prop] = false;
                    return;
                }
                if (parseAsJSON) {
                  if (conf[prop] is String) conf[prop] = JSON.parse(conf[prop]);
                  return;
                }
                conf[prop] = !!conf[prop];
            }
            if (conf.rtmpt == undefined) {
                conf.rtmpt = true;
            }
            if (conf.rtmp && conf.rtmp.indexOf("rtmp") < 0) {
                delete conf.rtmp;
            }

            decode("rtmpt");
            decode("live");
            decode("splash");
            decode("debug");
            decode("subscribe");
            decode("loop");
            decode("autoplay");
            decode("hlsQualities", true);
            debug("configure()", conf);
        }
    }
}
