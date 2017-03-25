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
    import flash.media.SoundTransform;

    import org.mangui.hls.event.HLSError;
    import org.mangui.hls.event.HLSEvent;
    import org.mangui.hls.constant.HLSPlayStates;
    import org.mangui.hls.constant.HLSSeekMode;
    import org.mangui.hls.HLSSettings;
    import org.mangui.hls.HLS;
    import org.mangui.hls.model.Level;
    import org.mangui.hls.utils.Params2Settings;

    import flash.media.Video;

    public class HLSStreamProvider implements StreamProvider {
        // player/video object
        private var player : Flowplayer;
        private var _video : Video;
        private var hls : HLS;
        private var config : Object;
        private var clip : Object;
        private var pos : Number;
        private var seekOffset : Number = -1;
        private var duration : Number;
        private var offsetPos : Number;
        private var backBuffer : Number;
        private var suppressReady : Boolean;
        private var lastSelectedLevel : Number = -1;

        public function HLSStreamProvider(player : Flowplayer, video : Video) {
            this.player = player;
            this._video = video;
            initHLS();
        }

        private function initHLS() : void {
            hls = new HLS();
            hls.stage = player.stage;
            /* force keyframe seek mode to avoid video glitches when seeking to a non-keyframe position */
            HLSSettings.seekMode = HLSSeekMode.KEYFRAME_SEEK;
            hls.addEventListener(HLSEvent.MANIFEST_LOADED, _manifestHandler);
            hls.addEventListener(HLSEvent.MEDIA_TIME, _mediaTimeHandler);
            hls.addEventListener(HLSEvent.PLAYBACK_COMPLETE, _completeHandler);
            hls.addEventListener(HLSEvent.ERROR, _errorHandler);
            hls.addEventListener(HLSEvent.ID3_UPDATED, _id3Handler);
            _video.attachNetStream(hls.stream);
        }

        public function get video() : Video {
          return this._video;
        }

        public function load(config : Object) : void {
            this.config = config;
            player.debug("loading URL " + config.url);
            hls.load(config.url);
            clip = new Object();
        }

        public function unload() : void {
            hls.removeEventListener(HLSEvent.MANIFEST_LOADED, _manifestHandler);
            hls.removeEventListener(HLSEvent.MEDIA_TIME, _mediaTimeHandler);
            hls.removeEventListener(HLSEvent.PLAYBACK_COMPLETE, _completeHandler);
            hls.removeEventListener(HLSEvent.ERROR, _errorHandler);
            hls.removeEventListener(HLSEvent.ID3_UPDATED, _id3Handler);
            hls.dispose();
            hls = null;
            //player.fire(Flowplayer.UNLOAD, null);
        }

        public function play(url : String) : void {
            config.autoplay = true;
            hls.load(url);
            resume();
        }

        public function pause() : void {
            hls.stream.pause();
            player.fire(Flowplayer.PAUSE, null);
        }

        public function setQuality(q : Number) : void {
          player.debug('Next level will be', q);
          hls.nextLevel = q;
          lastSelectedLevel = q;
        }

        public function resume() : void {
            player.debug('HLSStreamProvider::resume(), hls.playbackState=%s, this.pos=%s, this.offsetPos=%s, this.backBuffer=%s', [hls.playbackState, this.pos, this.offsetPos, this.backBuffer]);
            switch(hls.playbackState) {
                case HLSPlayStates.IDLE:
                // in IDLE state, restart playback
                    hls.stream.play(null,-1);
                    player.fire(Flowplayer.RESUME, null);
                    break;
                case HLSPlayStates.PAUSED:
                case HLSPlayStates.PAUSED_BUFFERING:
                    if (this.offsetPos + this.backBuffer < -1) {
                      player.debug('Stream idle for too long, restart stream');
                      unload();
                      suppressReady = true;
                      initHLS();
                      this.config.autoplay = true;
                      load(this.config);
                      break;
                    } else {
                      hls.stream.resume();
                    }
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
            player.debug('seek requested (seconds, seekOffset, duration, position) - (%d, %d, %d, %d)', [seconds, seekOffset, duration, offsetPos]);
            if (seekOffset !== -1) seconds = seconds - seekOffset;
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
            return {
                time:pos,
                buffer:pos + hls.stream.bufferLength,
                seekOffset: seekOffset,
                duration: duration
            };
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
            var llevel : Object = event.levels[hls.nextLevel];
            clip.bytes = clip.duration = llevel.duration;
            var li : Number = 0;
            while (isNaN(clip.duration) && li < event.levels.length) {
              llevel = event.levels[li];
              clip.bytes = clip.duration = llevel.duration;
              li++;
            }
            clip.width = llevel.width;
            clip.height = llevel.height;
            clip.seekable = true;
            clip.src = clip.url = config.url;
            var confQualities : Array = [];
            var confQualityLabels : Object = {};
            player.debug('config', config);
            if (config.hlsQualities) {
              clip.qualities = [];
              if (config.hlsQualities === "drive") {
                var levels : Vector.<Level> = event.levels;
                player.debug('Drive qualities requested');
                switch (levels.length) {
                  case 4:
                    confQualities = [1, 2, 3];
                    break;
                  case 5:
                    confQualities = [1, 2, 3, 4];
                    break;
                  case 6:
                    confQualities = [1, 3, 4, 5];
                    break;
                  case 7:
                    confQualities = [1, 3, 5, 6];
                    break;
                  case 8:
                    confQualities = [1, 3, 6, 7];
                    break;
                  default:
                    if (levels.length < 3 || (levels[0].height && levels[2].height && levels[0].height === levels[2].height)) {
                      confQualities = [];
                    } else {
                      confQualities = [1, 2];
                    }
                    break;
                }
                player.debug('Resolved drive qualities to ', confQualities);
              } else if (config.hlsQualities is Array) {
                for (var ii: Number = 0; ii < config.hlsQualities.length; ii++) {
                  if (config.hlsQualities[ii] is Number) confQualities.push(config.hlsQualities[ii]);
                  else {
                    confQualities.push(config.hlsQualities[ii].level);
                    confQualityLabels[config.hlsQualities[ii].level] = config.hlsQualities[ii].label;
                  }
                }
              }
              if (!confQualities.length || config.hlsQualities === "drive" || confQualities[0] === -1) {
                clip.qualities = [{ value: -1, label: confQualityLabels[-1] || "Auto" }];
              } else {
                clip.qualities = [];
              }
              var initialLevel : Number = -2;
              for (var i : Number = 0; i < event.levels.length; i++) {
                var label : String;
                if (confQualities.length > 0 && confQualities.indexOf(i) === -1) continue;
                else label = confQualityLabels[i];

                var level : Object = event.levels[i];
                var q : String = "Level " + (i + 1);
                if (level.width || level.height) {
                  q = Math.min(level.width, level.height) + 'p';
                }
                if (level.bitrate && config.hlsQualities !== "drive") q = q + " (" + Math.round(level.bitrate / 1000) + "k)";
                label = label || q;
                clip.qualities.push({
                  value: i,
                  label: label
                });
                if (i == lastSelectedLevel) initialLevel = lastSelectedLevel;
              }
              if (initialLevel == -2) {
                initialLevel = clip.qualities.length ? clip.qualities[0].value : -1;
              }
              clip.quality = initialLevel;
              hls.currentLevel = initialLevel;
            }
            _resize();
            _checkVideoDimension();
            player.debug("manifest received " + clip);
            if (suppressReady) {
              suppressReady = false;
              hls.addEventListener(HLSEvent.PLAYBACK_STATE, _resumeStateHandler);
            } else {
              hls.addEventListener(HLSEvent.PLAYBACK_STATE, _readyStateHandler);
            }

            hls.stream.play();
            if (config.autoplay) {
            } else {
                player.debug("stopping on first frame");
                hls.stream.pause();
            }
        };

        protected function _mediaTimeHandler(event : HLSEvent) : void {
            this.pos = event.mediatime.live_sliding_main + event.mediatime.position;
            this.offsetPos = event.mediatime.position;
            this.backBuffer = event.mediatime.backbuffer;
            this.seekOffset = event.mediatime.live_sliding_main;
            this.duration = event.mediatime.duration;
            _checkVideoDimension();
        };

        protected function _id3Handler(event :HLSEvent) : void {
           player.debug('ID3 event received', event.ID3Data); //, event);
           player.fire(Flowplayer.METADATA, event.ID3Data);
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
            player.resize(); 
        }

        private function _completeHandler(event : HLSEvent) : void {
            player.debug("playback complete,fire pause and finish events");
            player.fire(Flowplayer.PAUSE, null);
            player.fire(Flowplayer.FINISH, null);
        };

        private function _readyStateHandler(event: HLSEvent) : void {
          if (hls.playbackState == HLSPlayStates.PLAYING || hls.playbackState == HLSPlayStates.PAUSED) {
            player.fire(Flowplayer.READY, clip);
            if (config.autoplay) {
                player.fire(Flowplayer.RESUME, null);
            }
            hls.removeEventListener(HLSEvent.PLAYBACK_STATE, _readyStateHandler);
          }
        };

        private function _resumeStateHandler(event: HLSEvent) : void {
          if (hls.playbackState == HLSPlayStates.PLAYING) {
            player.fire(Flowplayer.RESUME, null);
            hls.removeEventListener(HLSEvent.PLAYBACK_STATE, _resumeStateHandler);
          }
        }

        private function _errorHandler(event : HLSEvent) : void {
            var hlsError : HLSError = event.error;
            player.debug("error (code/msg/url):" + hlsError.code + "/" + hlsError.msg + "/" + hlsError.url);
            player.fire(Flowplayer.ERROR, {code:4});
        };
    }
}
