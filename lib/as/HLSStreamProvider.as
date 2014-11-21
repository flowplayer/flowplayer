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
    import flash.media.SoundTransform;

    import org.mangui.hls.event.HLSEvent;
    import org.mangui.hls.HLS;

    import flash.media.Video;

    public class HLSStreamProvider implements StreamProvider {
        // player/video object
        private var player : Flowplayer;
        private var video : Video;
        private var hls : HLS;
        private var config : Object;
        private var clip : Object;

        public function HLSStreamProvider(player : Flowplayer, video : Video) {
            this.player = player;
            this.video = video;
            hls = new HLS();
            hls.stage = video.stage;
            hls.addEventListener(HLSEvent.MANIFEST_LOADED, _manifestHandler);
            /*
            hls.addEventListener(HLSEvent.PLAYBACK_COMPLETE, _completeHandler);
            hls.addEventListener(HLSEvent.ERROR, _errorHandler);
            hls.addEventListener(HLSEvent.MEDIA_TIME, _mediaTimeHandler);
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
            hls.dispose();
            hls = null;
        }

        public function play(url : String) : void {
        }

        public function pause() : void {
            hls.stream.pause();
            player.fire(Flowplayer.PAUSE, null);
        }

        public function resume() : void {
            hls.stream.resume();
            player.fire(Flowplayer.RESUME, null);
        }

        public function seek(seconds : Number) : void {
            hls.stream.seek(seconds);
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
            hls.stream.soundTransform = new SoundTransform(level);
            if (fireEvent) {
                player.fire(Flowplayer.VOLUME, level);
            }
        }

        public function status() : Object {
            var pos : Number = hls.position;
            if (isNaN(pos) || pos < 0) {
                pos = 0;
            }
            return {time:pos, buffer:pos + hls.bufferLength};
        }

        /* private */
        private function _manifestHandler(event : HLSEvent) : void {
            clip.bytes = clip.duration = event.levels[hls.startlevel].duration;
            clip.seekable = true;
            clip.src = clip.url = config.url;
            clip.width = event.levels[hls.startlevel].width;
            clip.height = event.levels[hls.startlevel].height;
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
    }
}
