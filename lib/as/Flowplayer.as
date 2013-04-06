/*!
   Flowplayer : The Video Player for Web

   Copyright (c) 2008-2012 Flowplayer Ltd
   http://flowplayer.org

   Author: Tero Piirainen

   -----

   This GPL version includes Flowplayer branding

   http://flowplayer.org/GPL-license/#term-7

   Commercial versions are available
      * part of the upgrade cycle
      * support the player development
      * no Flowplayer trademark

   http://flowplayer.org/download/
*/
package {

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
import flash.utils.setTimeout;

public class Flowplayer extends Sprite {

      // events
      private static const PLAY:String       = "play";
      private static const READY:String      = "ready";
      private static const PAUSE:String      = "pause";
      private static const RESUME:String     = "resume";
      private static const SEEK:String       = "seek";
      private static const STATUS:String     = "status";
      private static const BUFFERED:String   = "buffered";
      private static const VOLUME:String     = "volume";
      private static const FINISH:String     = "finish";
      private static const UNLOAD:String     = "unload";
      private static const ERROR:String      = "error";

      // external interface
      private static const INTERFACE:Array
         = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, UNLOAD);

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
      private var conn:NetConnection;
      private var stream:NetStream;
      private var video:Video;
      private var logo:Logo;

      private var timer:Timer;


      /* constructor */
      public function Flowplayer() {
         Security.allowDomain("*");
         stage.scaleMode = StageScaleMode.NO_SCALE;
         stage.align = StageAlign.TOP_LEFT;

         conf = this.loaderInfo.parameters;

         // The API
         for (var i:Number = 0; i < INTERFACE.length; i++) {
            ExternalInterface.addCallback("__" + INTERFACE[i], this[INTERFACE[i]]);
         }

         // IE needs mouse / keyboard events
         stage.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            fire("click", null);
         });

         stage.addEventListener(KeyboardEvent.KEY_DOWN, function(e:KeyboardEvent):void {
            fire("keydown", e.keyCode);
         });

         stage.addEventListener(Event.RESIZE, arrange);

         // timeupdate event
         timer = new Timer(250);
         timer.addEventListener("timer", timeupdate);

         init();
      }

      /************ Public API ************/

      // switch url
      public function play(url:String):void {
         debug("play()");
         if (ready) {
            url = unescape(url);
            conf.autoplay = true; // always begin playback
            if (conf.rtmp) conn.connect(conf.rtmp);
            stream.play(url);
            conf.url = url;
            paused = ready = false;
            timer.start();
         }
      }

      public function pause():void {
         debug("pause()");
         if (ready && !paused) {
            stream.pause();
            fire(PAUSE, null);
            paused = true;
         }
      }

      public function resume():void {
         debug("resume()");
         if (!ready) return;
         if (preloadComplete && !paused) return;

         debug("debug-resume", { ready: ready,  preloadComplete: preloadComplete });

         if (conf.preload == "none" && !preloadComplete) {
            conf.autoplay = true;
            paused = false;
            stream.play(conf.url);
         } else {
            debug("resume(), finished? " + finished);
            if (finished) { seek(0); }
            paused = false;
            stream.resume();
            fire(RESUME, null);

            // connection closed
            if (!stream.time) {
               debug("debug-resume: stream.time == 0, connecting again", null);
               conn.connect(conf.rtmp);
               conf.autoplay = true;
               ready = true;
               stream.play(conf.url);
            }
         }
         timer.start();
      }

      public function seek(seconds:Number):void {
         debug("seek()");
         if (ready) {
            seekTo = seconds;
            stream.seek(seconds);
         }
      }

      public function volume(level:Number, storeValue:Boolean = true):void {
         if (stream && volumeLevel != level) {
            if (level > 1) level = 1;
            else if (level < 0) level = 0;

            stream.soundTransform = new SoundTransform(level);
            if (storeValue) {
               volumeLevel = level;
               fire(VOLUME, level);
            }
         }
      }


      public function unload():void {
         debug("unload()");
         if (ready) {
            pause();
            stream.close();
            conn.close();
            fire(UNLOAD, null);
         }
      }


      /************* Private API ***********/


      // setup video stream
      private function init(): void {
         initVideo();
      }

      private function initVideo():void {
         debug("initVideo()");

         video = new Video();
         video.smoothing = true;
         this.addChild(video);
         logo = new Logo();
         addChild(logo);
         arrange();

         conf.url = unescape(conf.url);

         debug("debug.url", conf.url);

         conn = new NetConnection();

         // RTMP requires this
         conn.client = { onBWDone:function ():void {} };

         paused = !conf.autoplay;
         preloadComplete = conf.preload != "none";

         if (conf.autoplay && preloadComplete) {
            timer.start();
         }


         conn.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

            debug("debug.conn", e.info);

            switch (e.info.code) {

               case "NetConnection.Connect.Success":
                  stream = new NetStream(conn);
                  video.attachNetStream(stream);
                  // set volume to zero so that we don't hear anything if stopping on first frame
                  if (!conf.autoplay) {
                     volume(0, false);
                  }

                  fire("debug-preloadComplete = " + preloadComplete, null);
                  // start streaming
                  if (preloadComplete) {
                     stream.play(conf.url);
                  } else {
                     ready = true;
                     fire(Flowplayer.READY, {
                        seekable: !!conf.rtmp,
                        bytes: stream.bytesTotal,
                        src: conf.url,
                        url: conf.url
                     });
                     fire(Flowplayer.PAUSE, null);
                  }

                  // metadata
                  stream.client = {

                     onPlayStatus: function (info:Object):void {
                        debug("onPlayStatus", info);
                        if (info.code == "NetStream.Play.Complete") {
                           finished = true;
                           if (conf.loop) {
                              stream.seek(0);
                           }  else {
                              paused = true;
                              fire(Flowplayer.FINISH, null);
                           }
                        }
                     },

                     onMetaData:function (info:Object):void {

                        // use a real object
                        var meta:Object = { seekpoints: [] };
                        for (var key:String in info) { meta[key] = info[key]; }
                        debug("debug.metadata", meta);

                        var clip:Object = {
                           seekable: !!conf.rtmp,
                           bytes: stream.bytesTotal,
                           duration: meta.duration,
                           height: meta.height,
                           width: meta.width,
                           seekpoints: meta.seekpoints,
                           src: conf.url,
                           url: conf.url
                        };

                        if (!ready) {

                           fire(Flowplayer.READY, clip);
                           if (conf.autoplay) fire(Flowplayer.RESUME, null);

                           // stop at first frame
                           if (!conf.autoplay && conf.rtmp) setTimeout(
                                   function ():void {
                                      debug("pausing stream");
                                      stream.pause();
                                      volume(1);
                                   }, 100);

                           ready = true;
                        }

                        if (!preloadComplete) {
                           fire(Flowplayer.READY, clip);
                           fire(Flowplayer.RESUME, null);
                           preloadComplete = true;
                        }
                     }
                  };

                  // listen for playback events
                  stream.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

                     debug("debug.stream", e.info.code);

                     switch (e.info.code) {

                        case "NetStream.Play.Start":

                           finished = false;

                           // RTMP fires start a lot
                           if (!conf.rtmp) {
                              if (conf.autoplay) {
                                 paused = false;

                              // stop at first frame
                              } else {
                                 stream.seek(0);
                                 debug("pausing stream");
                                 stream.pause();
                                 volume(1);
                              }
                           }
                           break;

                        case "NetStream.Unpause.Notify":
                           debug("time " + stream.time);
                           break;

                        case "NetStream.Seek.Notify":
                           finished = false;
                           timeupdate(true);
                           fire(Flowplayer.SEEK, seekTo);
                           break;

                        case "NetStream.Buffer.Full":
                           fire(Flowplayer.BUFFERED, null);
                           break;

                        case "NetStream.Play.StreamNotFound": case "NetStream.Play.Failed":
                           finished = true;
                           fire(Flowplayer.ERROR, { code:4 });
                           break;

                     }

                  });

                  break;

               case "NetConnection.Connect.Failed":
                  fire(Flowplayer.ERROR, { code: 9, url: conf.rtmp });
                  break;

               case "NetConnection.Connect.Closed":
                  ready = false;
                  // fire("close", null);
                  break;

            }

         });

         conn.addEventListener(SecurityErrorEvent.SECURITY_ERROR, function (e:SecurityError):void {
            fire(Flowplayer.ERROR, e.message);
         });

         debug("debug-connecting-to " + conf.rtmp, null);
         conn.connect(conf.rtmp);
      }

      private function timeupdate(e:Object):void {
         if (ready) {
            var buffer:Number = stream.bytesLoaded,
               delta:Number = stream.bytesTotal - buffer;

            // first frame & no preload
            if (!conf.autoplay && !conf.preload && !conf.rtmp) { stream.close(); }

            // http://www.brooksandrus.com/blog/2008/11/05/3-years-later-netstream-still-sucks/
            if (e === true) {
               fire(STATUS, { time: seekTo, buffer: buffer });
               setTimeout(function():void { seekTo = 0; }, 100);

            } else if (!(paused || finished || seekTo) || delta > 0) {
               fire(STATUS, { time: stream.time, buffer: buffer });
            }
         }
      }

      private function debug(msg:String, data:Object = null):void {
         if (!conf.debug) return;
         fire("debug: " + msg, data);
      }

      private function fire(type:String, data:Object = null):void {
         if (conf.callback) {
            ExternalInterface.call(conf.callback, type, data);
         }
      }

      private function arrange(e:Event = null):void {
         logo.x = 12;
         logo.y = stage.stageHeight - 50;
         video.width = stage.stageWidth;
         video.height = stage.stageHeight;
      };

   }

}
