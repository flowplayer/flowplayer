/*!
   Flowplayer : The Video Player for Web

   Copyright (c) 2008-2012 Flowplayer Ltd
   http://flowplayer.org

   Authors: Tero Piirainen, Anssi Piirainen

   -----

   This GPL version includes Flowplayer branding

   http://flowplayer.org/GPL-license/#term-7

   Commercial versions are available
      * be part of the upgrade cycle
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
      public static const PLAY:String       = "play";
      public static const READY:String      = "ready";
      public static const PAUSE:String      = "pause";
      public static const RESUME:String     = "resume";
      public static const SEEK:String       = "seek";
      public static const STATUS:String     = "status";
      public static const BUFFERED:String   = "buffered";
      public static const VOLUME:String     = "volume";
      public static const FINISH:String     = "finish";
      public static const UNLOAD:String     = "unload";
      public static const ERROR:String      = "error";

      // external interface
      private static const INTERFACE:Array
         = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, UNLOAD);

      // flashvars
      private var conf:Object;

      // state
      private var finished:Boolean;
      private var paused:Boolean;
      private var ready:Boolean;
      private var currentVolume:Number;

      // clip hack properties
      private var seekTo:Number;

      // video stream
      private var conn:NetConnection;
      private var stream:NetStream;
      private var video:Video;
      private var currentClip:Object;

      private var ui:UI;

      /* constructor */
      public function Flowplayer() {
         Security.allowDomain("*");
         stage.align = StageAlign.TOP_LEFT;
         stage.scaleMode = StageScaleMode.NO_SCALE;

         conf = { fullscreen: true, embed: true }; // defaults
         var params:Object = this.loaderInfo.parameters;
         // convert booleans passed in as strings
         for (var prop:String in params) {
            if (params[prop] == 'false') {
               conf[prop] = false;
            } else if (params[prop] == 'true') {
               conf[prop] = true;
            } else {
               conf[prop] = params[prop];
            }
         }
         conf.version = '@VERSION';

         init();

         // IE needs mouse / keyboard events
         stage.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            fire("click", null);
         });
         stage.addEventListener(KeyboardEvent.KEY_DOWN, function(e:KeyboardEvent):void {
            fire("keydown", e.keyCode);
         });

         // The API
         for (var i:Number = 0; i < INTERFACE.length; i++) {
            ExternalInterface.addCallback("__" + INTERFACE[i], this[INTERFACE[i]]);
         }

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
         if (ready && currentVolume != level) {
            if (level > 1) level = 1;
            else if (level < 0) level = 0;

            stream.soundTransform = new SoundTransform(level);
            currentVolume = level;
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

      /************* Flash internal API ***********/

      internal function get clip():Object {
         return currentClip;
      }

      internal function get videoDisp():Video {
         return video;
      }

      internal function togglePlay():void {
         if (paused) {
            resume();
         } else if (ready) {
            pause();
         }
      }

      // TODO: implement this.
      internal function get embedCode():String {
         return "<code></code>";
      }

      internal function get config():Object {
         return conf;
      }

      internal function get volumeLevel():Number  {
         return stream.soundTransform.volume;
      }

      /************* Private API ***********/

      // setup video stream
      private function init(): void {
         initVideo();
      }

      private function initVideo():void {
         video = new Video();
         video.smoothing = true;
         addChild(video);

         if (conf.flashUi) {
            ui = new UI(this);
         }

         conf.url = unescape(conf.url);

         if (conf.debug) fire("debug.url", conf.url);

//         stage.scaleMode = StageScaleMode.EXACT_FIT;
         video.width = stage.stageWidth;
         video.height = stage.stageHeight;

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

                        currentClip = {
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

                           fire(Flowplayer.READY, currentClip);
                           if (conf.autoplay) fire(Flowplayer.RESUME, null);

                           // stop at first frame
                           if (!conf.autoplay && conf.rtmp) setTimeout(stream.pause, 100);

//                           setTimeout(function():void { ui.hideLogo(); }, 8000);

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

      internal function get status():Object {
         return { time: stream.time,  buffer: stream.bytesLoaded, duration: clip ? clip.duration : 0 };
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
         dispatchEvent(new Event(type));
      }

   }
}
