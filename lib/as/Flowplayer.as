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
import flash.media.SoundTransform;
import flash.media.Video;
import flash.net.NetConnection;
import flash.net.NetStream;
import flash.system.Security;
import flash.utils.Timer;

public class Flowplayer extends Sprite {

    // events
    internal static const PLAY:String = "play";
    internal static const READY:String = "ready";
    internal static const PAUSE:String = "pause";
    internal static const RESUME:String = "resume";
    internal static const SEEK:String = "seek";
    internal static const STATUS:String = "status";
    internal static const BUFFERED:String = "buffered";
    internal static const VOLUME:String = "volume";
    internal static const FINISH:String = "finish";
    internal static const UNLOAD:String = "unload";
    internal static const ERROR:String = "error";
    internal static const SET:String = "set";

    // external interface
    private static const INTERFACE:Array
        = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, UNLOAD, STATUS, SET);

    // flashvars
    private var conf:Object;

    // state
    private var preloadComplete:Boolean;
    private var finished:Boolean;
    private var paused:Boolean;
    private var ready:Boolean;
    private var volumeLevel:Number;

    // clip hack properties
    private var seekTo:Number;
    private var clipUrl:String;

    // video stream
    private var connector:Connector;
    private var netStream:NetStream;
    private var video:Video;
    private var logo:DisplayObject;
    private var clip:Object;


    /* constructor */
    public function Flowplayer() {
        Security.allowDomain("*");
        stage.scaleMode = StageScaleMode.NO_SCALE;
        stage.align = StageAlign.TOP_LEFT;

        var swfUrl:String = decodeURIComponent(this.loaderInfo.url);
        if (swfUrl.indexOf("callback=") > 0) throw new Error("Security error");

        configure();

        // IE needs mouse / keyboard events
        stage.addEventListener(MouseEvent.CLICK, function (e:MouseEvent):void {
            fire("click", null);
        });

        stage.addEventListener(KeyboardEvent.KEY_DOWN, function (e:KeyboardEvent):void {
            fire("keydown", e.keyCode);
        });

        stage.addEventListener(Event.RESIZE, arrange);

        var player:Flowplayer = this;
        // The API
        for (var i:Number = 0; i < INTERFACE.length; i++) {
            debug("creating callback " + INTERFACE[i] + " id == " + ExternalInterface.objectID);
            ExternalInterface.addCallback("__" + INTERFACE[i], player[INTERFACE[i]]);
        }

        init();
    }

    /************ Public API ************/

        // switch url
    public function play(url:String, reconnect:Boolean = false):void {
        debug("play() " + url);
        if (!ready)  return;
        conf.url = url;

        conf.autoplay = true;
        netStream.close();
        debug("starting play of stream '" + url + "'");
        if (reconnect) {
          connect();
        } else {
          netStream.play(url);
        }
        paused = ready = false;
        video.visible = true;
    }

    public function pause():void {
        debug("pause() ready? " + ready + " paused? " + paused);
        if (ready && !paused) {
            pauseStream();
            debug("firing pause");
            fire(PAUSE, null);
            paused = true;
        }
    }

    private function pauseStream():void {
        if (conf.live) {
            debug("pauseStream(): closing live stream");
            netStream.close();
            connector.close();
        } else {
            netStream.pause();
        }
    }

    public function resume():void {
        debug("resume()", { ready: ready, preloadComplete: preloadComplete, splash: conf.splash });

        if (preloadComplete && !paused) {
            debug("preloadComplete? " + preloadComplete + ", paused? " + paused + ", ready= " + ready);
            return;
        }

        try {
            conf.autoplay = true;
            paused = false;
            video.visible = true;

            debug("live? " + conf.live);
            if (conf.live) {

                if (!connector.connected) {
                    debug("resuming live stream (reconnecting)");
                    connector.connect(function (conn:NetConnection):void {
                        ready = true;
                        setupStream(conn);
                        netStream.play(stream);
                    }, onDisconnect);
                } else {
                    debug("starting play of stream '" + stream + "'");
                    netStream.play(stream);
                }

            } else {
                if (!ready) return;

                if (preloadNone() && !preloadComplete) {
                    debug("starting play of stream '" + stream + "'");
                    netStream.play(stream);
                } else {
                    if (finished) {
                        seek(0);
                    }
                    debug("resuming stream");
                    netStream.resume();
//                    if (stream.time == 0 && !conf.rtmp) {
//                        debug("starting play of stream '" + stream + "'");
//                        stream.play(stream);
//                    } else {
//                        debug("resuming stream");
//                        stream.resume();
//                    }
                }
            }
            debug("firing RESUME");
            fire(RESUME, null);
        } catch (e:Error) {
            debug("resume(), error", e);
            // net stream is invalid, because of a timeout
            conf.autoplay = true;
            ready = true;
            connect();
        }
    }

    public function set(key:String, value:String):void {
        debug('set: ' + key + ':' + value);
        conf[key] = value;
    }

    private function preloadNone():Boolean {
        var result:Boolean = !conf.splash && conf.preload == "none";
        debug("preload == 'none'? " + result + ", conf.splash == " + conf.splash + ", conf.preload == " + conf.preload);
        return result;
    }

    public function seek(seconds:Number):void {
        debug("seek() target = " + seconds + " ready?" + ready);
        if (ready) {
            seekTo = seconds;
            netStream.seek(seconds);
        }
    }

    public function volume(level:Number, fireEvent:Boolean = true):void {
        debug("volume(), setting to " + level + " (was at " + volumeLevel + ")");
        if (netStream && volumeLevel != level) {
            debug("setting volume to " + level);
            if (level > 1) level = 1;
            else if (level < 0) level = 0;

            netStream.soundTransform = new SoundTransform(level);
            volumeLevel = level;
            if (fireEvent) {
                fire(VOLUME, level);
            }
        }
    }


    public function unload():void {
        debug("unload");
        if (ready) {
            pause();
            netStream.close();
            connector.close();
            fire(UNLOAD, null);
        }
    }

    public function status():Object {
        if (!netStream) return null;
        return { time: netStream.time, buffer: netStream.bytesLoaded };
    }


    /************* Private API ***********/

    private function init():void {
        debug("init()", conf);
        video = new Video();
        video.smoothing = true;
        this.addChild(video);
        logo = new Logo();
        addLogo();
        arrange();

        debug("init() stream name", stream);

        paused = !conf.autoplay;
        preloadComplete = false;

        connect();
    }

    private function isRtmpUrl(url:String):Boolean {
        var protocols:Array = ["rtmp","rtmpt", "rtmpe", "rtmpte", "rtmfp"];
        var protocol:String = url.substr(0,url.indexOf("://"));
        return protocols.indexOf(protocol) >= 0;
    }

    private function get rtmpUrls():Array {
        debug("conf.url = " + conf.url);
        var url:String = unescape(conf.url);
        if (isRtmpUrl(url)) {
            var lastSlashPos : Number = url.lastIndexOf("/");
            return [url.substring(0, lastSlashPos), url.substring(lastSlashPos + 1)];
        }
        return [conf.rtmp, url];
    }

    private function get stream():String {
        return rtmpUrls[1];
    }

    private function get completeClipUrl():String {
        var urls:Array = rtmpUrls;
        if (urls[0] && urls[0].indexOf("rtmp") == 0) {
            return urls[0] + "/" + urls[1];
        } else {
            return urls[1];
        }
    }

    private function connect():void {
        var urls:Array = rtmpUrls;
        debug("connect() subscribe? " + conf.subscribe + ", urls", urls);
//      connector = new SubscribingConnector(this, conf.rtmp, stream);
        connector = conf.subscribe ? new SubscribingConnector(this, urls[0], urls[1], conf.rtmpt) : new ParallelConnector(this, urls[0], conf.rtmpt);
        connector.connect(onConnect, onDisconnect);
    }

    private function onDisconnect():void {
        debug("onDisconnect()")
        this.ready = false;
    }

    private function onConnect(conn:NetConnection):void {
        setupStream(conn);

        // set volume to zero so that we don't hear anything if stopping on first frame
//        if (!conf.autoplay) {
//            volume(0, false);
//        }

        fire("debug-preloadComplete = " + preloadComplete, null);
        // start streaming

        if (conf.autoplay) {
            debug("autoplay is on, starting play of stream '" + stream + "'");
            netStream.play(stream);
            return;
        }

        if (preloadNone() && !preloadComplete) {
            ready = true;
            fire(Flowplayer.READY, {
                seekable: !!conf.rtmp,
                bytes: netStream.bytesTotal,
                src: stream,
                url: stream
            });
            fire(Flowplayer.PAUSE, null);

            // we pause when metadata is received
        } else {
            debug("preload: starting play of stream '" + stream + "'");
            netStream.play(stream);
        }
    }

    private function setupStream(conn:NetConnection):void {
        debug("Connection success", { ready: ready, preloadCompete: preloadComplete, paused: paused, autoplay: conf.autoplay });

        netStream = new NetStream(conn);
        var bufferTime:Number = conf.hasOwnProperty("bufferTime") ? conf.bufferTime : 3;
        debug("bufferTime == " + bufferTime);
        netStream.bufferTime = bufferTime;
        video.attachNetStream(netStream);
        volume(volumeLevel || conf.initialVolume, false);

        // metadata
        netStream.client = {

            onPlayStatus: function (info:Object):void {
                debug("onPlayStatus", info);
                if (info.code == "NetStream.Play.Complete") {
                    if (!paused) {
                        finished = true;
                        paused = true;
                        fire(Flowplayer.PAUSE, null);
                        fire(Flowplayer.FINISH, null);
                    }
                }
            },

            onMetaData: function (info:Object):void {
                debug("onMetaData()", { ready: ready, preloadCompete: preloadComplete, paused: paused, autoplay: conf.autoplay });

                // use a real object
                var meta:Object = { seekpoints: [] };
                for (var key:String in info) {
                    meta[key] = info[key];
                }
                if (conf.debug) fire("debug.metadata", meta);

                clip = {
                    seekable: !!conf.rtmp,
                    bytes: netStream.bytesTotal,
                    duration: meta.duration,
                    height: meta.height,
                    width: meta.width,
                    seekpoints: meta.seekpoints,
                    src: completeClipUrl,
                    url: completeClipUrl
                };

                if (!ready) {
                    ready = true;

                    if (conf.autoplay) {
                        fire(Flowplayer.READY, clip);
                        fire(Flowplayer.RESUME, null);
                    } else {
                        debug("stopping on first frame");
                        netStream.seek(0);
                        pauseStream();

                        // hide the video if splash or poster should stay visible and not be hidden behind the first frame
                        if (conf.splash || conf.poster) {
                            debug("splash or poster used, hiding video");
                            video.visible = false;
                        }

                        // make autoplay true so that first-frame pause is not done with webkit-fullscreen-toggling
                        conf.autoplay = true;
                        fire(Flowplayer.READY, clip);
                    }
                    return;
                }

                if (preloadNone() && !preloadComplete) {
                    preloadComplete = true;
                    fire(Flowplayer.READY, clip);
                    fire(Flowplayer.RESUME, null);
                }
            }
        };

        // listen for playback events
        netStream.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

            if (conf.debug) fire("debug.stream", e.info.code);

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
//                  timeupdate(true);
                        fire(Flowplayer.SEEK, seekTo);
                    }
                    break;

                case "NetStream.Buffer.Full":
                    fire(Flowplayer.BUFFERED, null);
                    break;

                case "NetStream.Play.StreamNotFound":
                case "NetStream.Play.Failed":
                    finished = true;
                    fire(Flowplayer.ERROR, { code: 4 });
                    break;

                case "NetStream.Play.Stop":
                    var stopTracker:Timer = new Timer(100);
                    var prevTime:Number = 0;

                    if (stopTracker && stopTracker.running) return;

                    stopTracker.addEventListener(TimerEvent.TIMER, function (e:TimerEvent):void {
//                        debug("checking end of clip: duration " + duration + ", time " + netStream.time + ", prevTime " + prevTime);
                        if (duration == 0) return;
                        if (prevTime < netStream.time) {
                            prevTime = netStream.time;
                            return;
                        }
                        if (duration - netStream.time > 3) return;

                        prevTime = netStream.time;

                        stopTracker.stop();

                        if (!conf.rtmp && !paused) {
                            finished = true;
                            paused = true;
                            netStream.pause();
                            fire(Flowplayer.PAUSE, null);
                            fire(Flowplayer.FINISH, null);
                        }
                    });
                    stopTracker.start();

                    break;

            }

        });
    }

    internal function debug(msg:String, data:Object = null):void {
        if (!conf.debug) return;
        fire("debug: " + msg, data);
//        ExternalInterface.call("console.log", msg, data);
    }

    internal function fire(type:String, data:Object = null):void {
        if (conf.callback) {
            if (data) {
                ExternalInterface.call(conf.callback, type, data);
            } else {
                ExternalInterface.call(conf.callback, type);
            }
        }
    }

    private function arrange(e:Event = null):void {
        logo.x = 12;
        logo.y = stage.stageHeight - 50;
        video.width = stage.stageWidth;
        video.height = stage.stageHeight;
    };

    private function addLogo():void {
        var url:String = (conf.rtmp) ? conf.rtmp : unescape(conf.url) ? unescape(conf.url) : '';
        var pos:Number;
        var whitelist:Array = [
            'drive.flowplayer.org',
            'drive.dev.flowplayer.org',
            'my.flowplayer.org',
            'rtmp.flowplayer.org'
        ];

        for each (var wl:String in whitelist) {
            pos = url.indexOf('://' + wl)
            if (pos == 4 || pos == 5) return; // from flowplayer Drive
        }

        addChild(logo);
    }

    private function get duration():Number {
        if (!clip) return 0;
        return clip.duration;
    }

    private function configure():void {
        conf = this.loaderInfo.parameters;

        function decode(prop:String):void {
            if (conf[prop] == "false") {
                conf[prop] = false;
                return;
            };
            conf[prop] = !! conf[prop];
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
        debug("configure()", conf);
    }

}

}
