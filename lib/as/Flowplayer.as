/*!
   Flowplayer : The Video Player for Web

   Copyright (c) 2008-2012 Flowplayer Ltd
   http://flowplayer.org

   Licensed under MIT and GPL 2+
   http://www.opensource.org/licenses

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

   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.LoaderInfo;
   import flash.display.Sprite;
   import flash.display.StageScaleMode;

   import flash.events.*;
   import flash.external.ExternalInterface;
   import flash.media.SoundTransform;
   import flash.media.Video;
   import flash.net.NetConnection;
   import flash.net.NetStream;
   import flash.net.URLRequest;
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
      private static const STOP:String       = "stop";
      private static const ERROR:String      = "error";

      // external interface
      private static const INTERFACE:Array
         = new Array(PLAY, PAUSE, RESUME, SEEK, VOLUME, STOP, UNLOAD);

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

         // timeupdate event
         var timer:Timer = new Timer(250);
         timer.addEventListener("timer", timeupdate);
         timer.start();

         // http://flowplayer.org/GPL-license/#term-7
         logo = new Logo();

         // size
         logo.width = 50;

         // position
         logo.x = 12;
         logo.y = stage.stageHeight - logo.height - 18;
         addChild(logo);

         // retain proportions
         logo.scaleY = logo.scaleX;

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
            ready = false;
         }
      }

      public function stop():void {
         if (ready) {
            seek(0);
            pause();
            togglePoster(true);
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
         if (ready) {
            if (finished) { seek(0); }
            if (paused) stream.resume();
            togglePoster(false);

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
            if (level < 0) level = 0;

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


      private function togglePoster(flag:Boolean):void {
         var poster:DisplayObject = getChildByName("poster");

         if (poster) {
            poster.visible = flag;
            video.visible = !flag;
         }
      }

      // setup video stream
      private function init(): void {
         if (conf.poster) loadPoster();
         initVideo();
      }

      private function loadPoster():void {
         var img:Loader = new Loader();

         var error:Function = function(e:Event):void {
            fire(Flowplayer.ERROR, { code:4, url:conf.poster });
         };

         img.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR, error);
         img.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, error);

         img.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event):void {

            img.name = "poster";
            addChild(img);

            // center
            img.x = int((stage.stageWidth / 2) - (img.width / 2));
            img.y = int((stage.stageHeight / 2) - (img.height / 2));

         });

         img.load(new URLRequest(conf.poster));

      }



      private function initVideo():void {
         video = new Video();
         video.smoothing = true;
         this.addChild(video);

         conf.url = unescape(conf.url);

         if (conf.poster) video.visible = false;

         stage.scaleMode = StageScaleMode.EXACT_FIT;
         video.width = stage.stageWidth;
         video.height = stage.stageHeight;

         conn = new NetConnection();

         // RTMP requires this
         conn.client = { onBWDone:function ():void {} };

         paused = !conf.autoplay;

         conn.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

            // fire("debug.conn", e.info.code);

            switch (e.info.code) {

               case "NetConnection.Connect.Success":

                  // start streaming
                  stream = new NetStream(conn);
                  video.attachNetStream(stream);
                  stream.play(conf.url);

                  // metadata
                  stream.client = {
                     onMetaData:function (info:Object):void {

                        var clip:Object = {
                           seekable:!!conf.rtmp,
                           bytes:stream.bytesTotal,
                           duration:info.duration,
                           height:info.height,
                           width:info.width
                        };

                        if (!ready) {

                           fire(Flowplayer.READY, clip);
                           if (conf.autoplay) fire(Flowplayer.RESUME, null);

                           // RTMP & poster image
                           if (!conf.autoplay && conf.rtmp) setTimeout(stream.pause, 100);

                           setTimeout(function():void { if (logo.parent) removeChild(logo); }, 8000);

                           ready = true;
                        }
                     }
                  };

                  // listen for playback events
                  stream.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {

                     // fire("debug.stream", e.info.code);

                     switch (e.info.code) {

                        case "NetStream.Play.Start":

                           finished = false;

                           // RTMP fires start a lot
                           if (!conf.rtmp) {
                              if (conf.autoplay) {
                                 paused = false;

                                 // poster
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
                           else fire(Flowplayer.FINISH, null);
                           break;

                        case "NetStream.Buffer.Full":
                           fire(Flowplayer.BUFFERED, null);
                           break;

                        case "NetStream.Play.StreamNotFound":
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
               setTimeout(function():void { seekTo = 0; }, 1000);

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

   }

}
