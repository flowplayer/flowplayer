/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2014 Flowplayer Ltd
 http://flowplayer.org

 Authors: Guillaume du Pontavice

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
    import flash.events.Event;
    import flash.geom.Rectangle;
    import flash.media.SoundTransform;

    import org.mangui.hls.event.HLSError;
    import org.mangui.hls.event.HLSEvent;
    import org.mangui.hls.utils.ScaleVideo;
    import org.mangui.hls.constant.HLSPlayStates;
    import org.mangui.hls.constant.HLSSeekMode;
    import org.mangui.hls.HLSSettings;
    import org.mangui.hls.HLS;
    import org.mangui.hls.utils.Params2Settings;

    import flash.media.Video;

    public class HLSStreamProvider implements StreamProvider {
        // player/video object
        private var player : Flowplayer;
        private var video : Video;
        private var hls : HLS;
        private var config : Object;
        private var clip : Object;
        private var pos : Number;

        public function HLSStreamProvider(player : Flowplayer, video : Video) {
            this.player = player;
            this.video = video;
            hls = new HLS();
            hls.stage = player.stage;
            /* force keyframe seek mode to avoid video glitches when seeking to a non-keyframe position */
            HLSSettings.seekMode = HLSSeekMode.KEYFRAME_SEEK;
            player.stage.addEventListener(Event.RESIZE, _onStageResize);
            hls.addEventListener(HLSEvent.MANIFEST_LOADED, _manifestHandler);
            hls.addEventListener(HLSEvent.MEDIA_TIME, _mediaTimeHandler);
            hls.addEventListener(HLSEvent.PLAYBACK_COMPLETE, _completeHandler);
            hls.addEventListener(HLSEvent.ERROR, _errorHandler);
            /*
            hls.addEventListener(HLSEvent.PLAYBACK_STATE, _stateHandler);
             */
            video.attachNetStream(hls.stream);
        }

        public function load(config : Object) : void {
            this.config = config;
            player.debug("loading URL " + config.url);
            hls.load(config.url);
            clip = new Object();
        }

        public function unload() : void {
            player.stage.removeEventListener(Event.RESIZE, _onStageResize);
            hls.removeEventListener(HLSEvent.MANIFEST_LOADED, _manifestHandler);
            hls.removeEventListener(HLSEvent.MEDIA_TIME, _mediaTimeHandler);
            hls.removeEventListener(HLSEvent.PLAYBACK_COMPLETE, _completeHandler);
            hls.removeEventListener(HLSEvent.ERROR, _errorHandler);
            hls.dispose();
            hls = null;
            //player.fire(Flowplayer.UNLOAD, null);
        }

        public function play(url : String) : void {
            hls.load(url);
            resume();
        }

        public function pause() : void {
            hls.stream.pause();
            player.fire(Flowplayer.PAUSE, null);
        }

        public function resume() : void {
            switch(hls.playbackState) {
                case HLSPlayStates.IDLE:
                // in IDLE state, restart playback
                    hls.stream.play(null,-1);
                    player.fire(Flowplayer.RESUME, null);
                    break;
                case HLSPlayStates.PAUSED:
                case HLSPlayStates.PAUSED_BUFFERING:
                    hls.stream.resume();
                    player.fire(Flowplayer.RESUME, null);
                    break;
                // do nothing if already in play state
                //case HLSPlayStates.PLAYING:
                //case HLSPlayStates.PLAYING_BUFFERING:
                default:
                    break;
            }
        }

        public function seek(seconds : Number) : void {
            hls.stream.seek(seconds);
            player.fire(Flowplayer.SEEK, seconds);
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
            hls.stream.soundTransform = new SoundTransform(level);
            if (fireEvent) {
                player.fire(Flowplayer.VOLUME, level);
            }
        }

        public function status() : Object {
            var pos : Number = this.pos;
            if (isNaN(pos) || pos < 0) {
                pos = 0;
            }
            return {time:pos, buffer:pos + hls.stream.bufferLength};
        }

        public function setProviderParam(key:String, value:Object) : void {
            var decode : Function = function(value : String) : Object {
              if (value == "false") return false;
              if (!isNaN(Number(value))) return Number(value);
              if (value == "null") return null;
              return value;
            };
            player.debug("HLSStreamProvider::setProviderParam: " + key, decode(value));
            Params2Settings.set(key, decode(value));
        }

        /* private */
        private function _manifestHandler(event : HLSEvent) : void {
            clip.bytes = clip.duration = event.levels[hls.startLevel].duration;
            player.setDuration(clip.duration);

            clip.seekable = true;
            clip.src = clip.url = config.url;
            clip.width = event.levels[hls.startLevel].width;
            clip.height = event.levels[hls.startLevel].height;
            _checkVideoDimension();
            player.debug("manifest received " + clip);
            player.fire(Flowplayer.READY, clip);

            hls.stream.play();
            if (config.autoplay) {
                player.fire(Flowplayer.RESUME, null);
            } else {
                player.debug("stopping on first frame");
                hls.stream.pause();
            }
        };

        protected function _mediaTimeHandler(event : HLSEvent) : void {
            this.pos = event.mediatime.live_sliding_main + event.mediatime.position;
            _checkVideoDimension();
        };

        protected function _onStageResize(event : Event) : void {
            player.debug("player resized");
            _resize();
        };

        private function _checkVideoDimension() : void {
            var videoWidth : int = video.videoWidth;
            var videoHeight : int = video.videoHeight;

            if (videoWidth && videoHeight) {
                var changed : Boolean = clip.width != videoWidth || clip.height != videoHeight;
                if (changed) {
                    player.debug("video dimension changed");
                    _resize();
                }
            }
        }

        private function _resize() : void {
            player.debug("video/player size : " + video.videoWidth + "," + video.videoHeight + "/" + player.stage.stageWidth + "," + player.stage.stageHeight);
            clip.width = video.videoWidth;
            clip.height = video.videoHeight;
            var rect : Rectangle = ScaleVideo.resizeRectangle(video.videoWidth, video.videoHeight, player.stage.stageWidth, player.stage.stageHeight);
            video.width = rect.width;
            video.height = rect.height;
            video.x = rect.x;
            video.y = rect.y;
        }

        private function _completeHandler(event : HLSEvent) : void {
            player.debug("playback complete,fire pause and finish events");
            player.fire(Flowplayer.PAUSE, null);
            player.fire(Flowplayer.FINISH, null);
        };

        private function _errorHandler(event : HLSEvent) : void {
            var hlsError : HLSError = event.error;
            player.debug("error (code/msg/url):" + hlsError.code + "/" + hlsError.msg + "/" + hlsError.url);
            player.fire(Flowplayer.ERROR, {code:4});
        };

    }
}
