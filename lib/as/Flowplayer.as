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
        internal static const SET : String = "set";
        // external interface
        private static const INTERFACE : Array = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, UNLOAD, STATUS, SET);
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

            var player : Flowplayer = this;
            // The API
            for (var i : Number = 0; i < INTERFACE.length; i++) {
                debug("creating callback " + INTERFACE[i] + " id == " + ExternalInterface.objectID);
                ExternalInterface.addCallback("__" + INTERFACE[i], player[INTERFACE[i]]);
            }
            init();

            // setup provider from URL

            if (CONFIG::HLS) {
                // detect HLS by checking the extension of src
                if (conf.url.indexOf(".m3u") != -1) {
                    debug("HLS stream detected!");
                    provider = new HLSStreamProvider(this, video);
                } else {
                    provider = new NetStreamProvider(this, video);
                }
            } else {
                provider = new NetStreamProvider(this, video);
            }
            provider.load(conf);
        }

        public function set(key : String, value : String) : void {
            debug('set: ' + key + ':' + value);
            conf[key] = value;
        }

        /************ Public API ************/
        // switch url
        public function play(url : String) : void {
            // TODO : switch provider if needed here
            provider.play(url);
            return;
        }

        public function pause() : void {
            provider.pause();
            return;
        }

        public function resume() : void {
            provider.resume();
            return;
        }

        public function seek(seconds : Number) : void {
            provider.seek(seconds);
            return;
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
            provider.volume(level, fireEvent);
            return;
        }

        public function unload() : void {
            provider.unload();
            return;
        }

        public function status() : Object {
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

            debug("debug.url", conf.url);

            paused = !conf.autoplay;
            preloadComplete = false;
        }

        internal function debug(msg : String, data : Object = null) : void {
            if (!conf.debug) return;
            fire("debug: " + msg, data);
            // ExternalInterface.call("console.log", msg, data);
        }

        internal function fire(type : String, data : Object = null) : void {
            if (conf.callback) {
                if (data) {
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

        private function addLogo() : void {
            var url : String = (conf.rtmp) ? conf.rtmp : unescape(conf.url) ? unescape(conf.url) : '';
            var pos : Number;
            var whitelist : Array = ['drive.flowplayer.org', 'drive.dev.flowplayer.org', 'my.flowplayer.org', 'rtmp.flowplayer.org'];

            for each (var wl : String in whitelist) {
                pos = url.indexOf('://' + wl)
                if (pos == 4 || pos == 5) return;
                // from flowplayer Drive
            }

            addChild(logo);
        }

        private function configure() : void {
            conf = this.loaderInfo.parameters;
            conf.rtmpt = conf.rtmpt == "false" ? false : (conf.rtmpt == undefined ? true : !!conf.rtmpt);
            conf.live = conf.live == "false" ? false : !!conf.live;
            debug("configure()", conf);
        }
    }
}
