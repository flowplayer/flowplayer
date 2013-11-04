/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2012 - 2013 Flowplayer Ltd
 http://flowplayer.org

 Author: Anssi Piirainen

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
import flash.events.NetStatusEvent;
import flash.events.SecurityErrorEvent;
import flash.net.NetConnection;
import flash.utils.setTimeout;

public class Connection {
   private var player:Flowplayer;
   private var url:String;
   private var connection:NetConnection;
   private var firstAttemptFailed:Boolean;

   public function Connection(player:Flowplayer, url:String) {
      this.player = player;
      this.url = url;
   }

   public function connect(connectedCallback:Function, disconnectedCallback:Function):void {
      firstAttemptFailed = false;
      doConnect(connectedCallback, disconnectedCallback, url);

      if (url && url.indexOf("rtmp:") == 0) {
         debug("connecting with RTMP and RTMPT");

         // RTMPT is attempted after 250 ms
         setTimeout(function ():void {
            var host:String = url.substr("rtmp://".length);
            doConnect(connectedCallback, disconnectedCallback, "rtmpt://" + host);
         }, 250);
      }
   }

   private function doConnect(connectedCallback:Function, disconnectedCallback:Function, url:String):void {
      var connection:NetConnection = new NetConnection();
      connection.client = { onBWDone: function ():void {} };

      connection.addEventListener(NetStatusEvent.NET_STATUS, function (e:NetStatusEvent):void {
         debug("debug.conn", e.info);

         switch (e.info.code) {

            case "NetConnection.Connect.Success":
               debug("connection succeeded with " + connection.uri + ", already connected? " + connected);

               if (connected) {
                  debug("already connected, closing this 2nd connection");
                  connection.close();
                  return;
               }

               setConnection(connection);
               connectedCallback(connection);
               break;

            case "NetConnection.Connect.Failed":
               if (firstAttemptFailed) {
                  fire(Flowplayer.ERROR, { code: 9, url: url});
               }
               firstAttemptFailed = true;
               break;

            case "NetConnection.Connect.Closed":
               if (connection == getConnection()) {
                  disconnectedCallback();
               }
               break;

            case "NetConnection.Connect.Rejected":
               if (connected) return;
               if (e.info.ex.code == 302) {
                  var redirectUrl:String = e.info.ex.redirect;
                  debug("doing a redirect to " + redirectUrl + ", original url " + url);

                  setTimeout(function ():void {
                     connection.connect(redirectUrl);
                  }, 100);
               }
               break;
         }

      });

      connection.addEventListener(SecurityErrorEvent.SECURITY_ERROR, function (e:SecurityError):void {
         fire(Flowplayer.ERROR, e.message);
      });

      connection.connect(url);
   }

   private function debug(msg:String, data:Object = null):void {
      player.debug(msg, data);
   }

   internal function fire(type:String, data:Object = null):void {
      player.fire(type, data);
   }

   public function close():void {
      if (!connection) return;
      connection.close()
   }

   private function getConnection():NetConnection {
      return this.connection;
   }

   private function setConnection(conn:NetConnection):void {
      this.connection = conn;
   }

   private function get connected():Boolean {
      return connection && connection.connected;
   }
}
}