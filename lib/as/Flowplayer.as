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


      /* constructor */
      public function Flowplayer() {
         Security.allowDomain("*");
         stage.scaleMode = StageScaleMode.NO_SCALE;
         stage.align = StageAlign.TOP_LEFT;

         conf = this.loaderInfo.parameters;
         init();

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
         var timer:Timer = new Timer(250);
         timer.addEventListener("timer", timeupdate);
         timer.start();
      }

      /************ Public API ************/

      // switch url
      public function play(url:String):void {
         if (ready) {
            url = unescape(url);
            conf.autoplay = true; // always begin playback
            if (conf.rtmp) conn.connect(conf.rtmp);
            stream.play(url);
            conf.url = url;
            paused = ready = false;
         }
      }

      public function pause():void {
         if (ready && !paused) {
            stream.pause();
            fire(PAUSE, null);
            paused = true;
         }
      }

      public function resume():void {
         if (ready && paused) {
            if (finished) { seek(0); }
            stream.resume();

            // connection closed
            if (!stream.time) {
               conn.connect(conf.rtmp);
               stream.play(conf.url);
               conf.autoplay = true;
               ready = true;
            }

            fire(RESUME, null);
            paused = false;
         }
      }

      public function seek(seconds:Number):void {
         if (ready) {
            seekTo = seconds;
            stream.seek(seconds);
         }
      }

      public function volume(level:Number):void {
         if (ready && volumeLevel != level) {
            if (level > 1) level = 1;
            else if (level < 0) level = 0;

            stream.soundTransform = new SoundTransform(level);
            volumeLevel = level;
            fire(VOLUME, level);
         }
      }


      public function unload():void {
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
         video = new Video();
         video.smoothing = true;
         this.addChild(video);
         logo = new Logo();
         addChild(logo);
         arrange();

         conf.url = unescape(conf.url);

         if (conf.debug) fire("debug.url", conf.url);

         conn = new NetConnection();

         // RTMP requires this
         conn.client = { onBWDone:function ():void {} };

         paused = !conf.autoplay;

         conn.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

            if (conf.debug) fire("debug.conn", e.info);

            switch (e.info.code) {

               case "NetConnection.Connect.Success":

                  // start streaming
                  stream = new NetStream(conn);

                  video.attachNetStream(stream);
                  stream.play(conf.url);

                  // metadata
                  stream.client = {
                     onMetaData:function (info:Object):void {

                        // use a real object
                        var meta:Object = { seekpoints: [] };
                        for (var key:String in info) { meta[key] = info[key]; }
                        if (conf.debug) fire("debug.metadata", meta);

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
                           if (!conf.autoplay && conf.rtmp) setTimeout(stream.pause, 100);

                           ready = true;
                        }
                     }
                  };

                  // listen for playback events
                  stream.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

                     if (conf.debug) fire("debug.stream", e.info.code);

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
                                 stream.pause();
                              }
                           }
                           break;

                        case "NetStream.Seek.Notify":
                           finished = false;
                           timeupdate(true);
                           fire(Flowplayer.SEEK, seekTo);
                           break;

                        case "NetStream.Play.Stop":
                           finished = true;
                           if (conf.loop) stream.seek(0);
                           else { fire(Flowplayer.FINISH, null); stream.pause(); }
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

      private function fire(type:String, data:Object):void {
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
