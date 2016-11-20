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
    import flash.events.*;
    import flash.media.SoundTransform;
    import flash.media.Video;
    import flash.net.NetConnection;
    import flash.net.NetStream;
    import flash.utils.Timer;
import flash.utils.setTimeout;

public class NetStreamProvider implements StreamProvider {
        // flashvars
        private var conf : Object;
        // state
        private var preloadComplete : Boolean;
        private var finished : Boolean;
        private var paused : Boolean;
        private var ready : Boolean;
        private var volumeLevel : Number;
        // clip hack properties
        private var seekTo : Number;
        // video stream
        private var connector : Connector;
        private var netStream : NetStream;
        private var clip : Object;
        // player/video object
        private var player : Flowplayer;
        private var _video : Video;

        public function NetStreamProvider(player : Flowplayer, video : Video) {
            this.player = player;
            this._video = video;
        }

        /************ Public API ************/
        public function load(config : Object) : void {
            conf = config;
            connect();
        }

        public function get video() : Video {
          return this._video;
        }

        // switch url
        public function play(url : String) : void {
            player.debug("play()")
            if (!ready) return;
            conf.url = url;

            conf.autoplay = true;
            netStream.close();
            netStreamPlay();
            paused = ready = false;
            video.visible = true;
        }

        public function pause() : void {
            player.debug("pause()");
            if (ready && !paused) {
                pauseStream();
                player.debug("firing pause");
                player.fire(Flowplayer.PAUSE, null);
                paused = true;
            }
        }

        private function pauseStream() : void {
            if (conf.live) {
                player.debug("pauseStream(): closing live stream");
                netStream.close();
                connector.close();
            } else {
                netStream.pause();
            }
        }

        public function resume() : void {
            player.debug("resume()");
            if (preloadComplete && !paused) {
                player.debug("preloadComplete? " + preloadComplete + ", paused? " + paused + ", ready= " + ready);
                return;
            }

            try {
                conf.autoplay = true;
                paused = false;
                video.visible = true;

                player.debug("live? " + conf.live);
                if (conf.live) {
                    if (!connector.connected) {
                        player.debug("resuming live stream (reconnecting)");
                        connector.connect(function(conn : NetConnection) : void {
                            ready = true;
                            setupStream(conn);
                            netStreamPlay();
                        }, onDisconnect);
                    } else {
                        netStreamPlay();
                    }
                } else {
                    if (!ready) return;

                    if (preloadNone() && !preloadComplete) {
                        netStreamPlay();
                    } else {
                        player.debug("resuming stream");
                        if (finished) {
                            netStreamPlay();
                        } else {
                            netStream.resume();
                        }
                    }
                }
                player.debug("firing RESUME");
                player.fire(Flowplayer.RESUME, null);
            } catch (e : Error) {
                player.debug("resume(), error", e);
                // net stream is invalid, because of a timeout
                conf.autoplay = true;
                ready = true;
                connect();
            }
        }

        private function preloadNone() : Boolean {
            var result : Boolean = !conf.splash && conf.preload == "none";
            player.debug("preload == 'none'? " + result + ", conf.splash == " + conf.splash + ", conf.preload == " + conf.preload);
            return result;
        }

        public function seek(seconds : Number) : void {
            if (ready) {
                player.debug("seek() " + seconds);
                seekTo = seconds;
                netStream.seek(seconds);
                if (paused) netStream.pause();
            }
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
            var changed : Boolean = level != volumeLevel;
            if (netStream) {
                player.debug("setting volume to " + level);
                if (level > 1) level = 1;
                else if (level < 0) level = 0;

                netStream.soundTransform = new SoundTransform(level);
                volumeLevel = level;
                if (fireEvent && changed) {
                    player.fire(Flowplayer.VOLUME, level);
                }
            }
        }

        public function unload() : void {
            player.debug('NetStreamProvider::unload(), ready? ' + ready);
            if (ready) {
                pause();
                netStream.close();
                connector.close();
                //player.fire(Flowplayer.UNLOAD, null);
            }
        }

        public function status() : Object {
            if (!netStream) return null;
            return {time:netStream.time, buffer:netStream.bytesLoaded};
        }

        public function setProviderParam(key:String, value:Object) : void { }
        public function setQuality(q: Number) : void {}

        /************* Private API ***********/
        private function isRtmpUrl(url : String) : Boolean {
            var protocols : Array = ["rtmp", "rtmpt", "rtmpe", "rtmpte", "rtmfp", "rtmps"];
            var protocol : String = url.substr(0, url.indexOf("://"));
            return protocols.indexOf(protocol) >= 0;
        }

        private function get rtmpUrls() : Array {
            var url : String = conf.url;
            if (isRtmpUrl(url)) {
                var lastSlashPos : Number = url.lastIndexOf("/");
                return [url.substring(0, lastSlashPos), url.substring(lastSlashPos + 1)];
            }
            return [conf.rtmp, url];
        }

        private function get stream() : String {
            return rtmpUrls[1];
        }

        private function get completeClipUrl() : String {
            var urls : Array = rtmpUrls;
            if (urls[0] && urls[0].indexOf("rtmp") == 0) {
                return urls[0] + "/" + urls[1];
            } else {
                return urls[1];
            }
        }

        private function connect() : void {
            var urls : Array = rtmpUrls;
            player.debug("connect() subscribe? " + conf.subscribe + ", urls", urls);
            // connector = new SubscribingConnector(this, conf.rtmp, stream);
            connector = conf.subscribe ? new SubscribingConnector(player, urls[0], urls[1], conf.rtmpt, conf.proxy) : new ParallelConnector(player, urls[0], conf.rtmpt, conf.proxy);
            try { 
              connector.connect(onConnect, onDisconnect);
            } catch(e : TypeError) {
              if (e.errorID === 1009) return; // Suppress
              throw e;
            }
        }

        private function onDisconnect() : void {
            player.debug("onDisconnect()")
            this.ready = false;
        }

        private function onConnect(conn : NetConnection) : void {
            setupStream(conn);

            // set volume to zero so that we don't hear anything if stopping on first frame
            // if (!conf.autoplay) {
            // volume(0, false);
            // }

            player.fire("debug-preloadComplete = " + preloadComplete, null);
            // start streaming

            if (conf.autoplay) {
                netStreamPlay();
                return;
            }

            if (preloadNone() && !preloadComplete) {
                ready = true;
                player.fire(Flowplayer.READY, {seekable:!!conf.rtmp, bytes:netStream.bytesTotal, src:stream, url:stream});
                player.fire(Flowplayer.PAUSE, null);

                // we pause when metadata is received
            } else {
                netStreamPlay();
            }
        }

        private function setupStream(conn : NetConnection) : void {
            player.debug("setupStream() ", {ready:ready, preloadCompete:preloadComplete, paused:paused, autoplay:conf.autoplay});

            netStream = new NetStream(conn);
            var bufferTime : Number = conf.hasOwnProperty("bufferTime") ? conf.bufferTime : conf.live ? 0 : 3;
            player.debug("bufferTime == " + bufferTime);
            netStream.bufferTime = bufferTime;
            video.attachNetStream(netStream);
            volume(volumeLevel || Number(conf.initialVolume), false);

            // metadata
            netStream.client = {
                onPlayStatus:function(info : Object) : void {
                    player.debug("onPlayStatus", info);
                    if (info.code == "NetStream.Play.Complete") {
                        fireFinished();
                    }
                },

                onMetaData:function(info : Object) : void {
                    player.debug("onMetaData()", {ready:ready, preloadCompete:preloadComplete, paused:paused, autoplay:conf.autoplay});

                    // use a real object
                    var meta : Object = {seekpoints:[]};
                    for (var key : String in info) {
                        meta[key] = info[key];
                    }
                    if (conf.debug) player.fire("debug.metadata", meta);

                    clip = {seekable:!!conf.rtmp, bytes:netStream.bytesTotal, duration:meta.duration, height:meta.height, width:meta.width, seekpoints:meta.seekpoints, src:conf.url, url:completeClipUrl};
                    player.resize();

                    if (!ready) {
                        ready = true;

                        if (conf.autoplay) {
                            player.fire(Flowplayer.READY, clip);
                            player.fire(Flowplayer.RESUME, null);
                        } else {
                            player.debug("stopping on first frame");
                            netStream.seek(0);
                            pauseStream();
                            // hide the video if splash or poster should stay visible and not be hidden behind the first frame
                            if (conf.splash || conf.poster) {
                                player.debug("splash or poster used, hiding video");
                                video.visible = false;
                            }

                            // make autoplay true so that first-frame pause is not done with webkit-fullscreen-toggling
                            conf.autoplay = true;
                            player.fire(Flowplayer.READY, clip);
                        }
                        return;
                    }

                    if (preloadNone() && !preloadComplete) {
                        preloadComplete = true;
                        player.fire(Flowplayer.READY, clip);
                        player.fire(Flowplayer.RESUME, null);
                    }
                }};

            // listen for playback events
            netStream.addEventListener(NetStatusEvent.NET_STATUS, function(e : NetStatusEvent) : void {
                if (conf.debug) player.fire("NetStatusEvent: ", e.info.code);

                switch (e.info.code) {
                    case "NetStream.Play.Start":
                        finished = false;
                        // RTMP fires start a lot
                        if (!conf.rtmp) {
                            if (conf.autoplay) {
                                paused = false;
                            }
                        }
                        break;
                    case "NetStream.Seek.Notify":
                        finished = false;
                        if (conf.autoplay) {
                            // timeupdate(true);
                            player.fire(Flowplayer.SEEK, seekTo);
                        }
                        break;
                    case "NetStream.Buffer.Full":
                        player.fire(Flowplayer.BUFFERED, null);
                        break;
                    case "NetStream.Play.StreamNotFound":
                    case "NetStream.Play.Failed":
                        finished = true;
                        player.fire(Flowplayer.ERROR, {code:4});
                        break;
                    case "NetStream.Play.Stop":
                        var stopTracker : Timer = new Timer(100);
                        var prevTime : Number = 0;
                        if (stopTracker && stopTracker.running) return;
                        stopTracker.addEventListener(TimerEvent.TIMER, function(e : TimerEvent) : void {
                            // player.debug("checking end of clip: duration " + duration + ", time " + netStream.time + ", prevTime " + prevTime);
                            if (duration == 0) return;
                            if (prevTime < netStream.time) {
                                prevTime = netStream.time;
                                return;
                            }
                            if (duration - netStream.time > 3) return;

                            prevTime = netStream.time;
                            stopTracker.stop();
                            fireFinished();
                        });
                        stopTracker.start();
                        break;
                }
            });
        }

    private function fireFinished():void {
        if (! finished && ! paused) {
            finished = true;
            paused = true;
            player.fire(Flowplayer.PAUSE, null);
            player.fire(Flowplayer.FINISH, null);
        }
    }

    private function get duration() : Number {
            if (!clip) return 0;
            return clip.duration;
        }

    private function netStreamPlay():void {
        var st : String = decodeURIComponent(stream)
        player.debug("netStreamPlay() " + st);
        if (conf.live) {
            netStream.play(st, -1);
        } else {
            netStream.play(st, 0, -1);
        }
    }

}


}
