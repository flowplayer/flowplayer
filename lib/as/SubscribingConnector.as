/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2012 - 2014 Flowplayer Ltd
 http://flowplayer.org

 Author: Anssi Piirainen

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
import flash.net.NetConnection;

public class SubscribingConnector implements Connector {
    private var connector:ParallelConnector;
    private var rtmpUrl:String;
    private var player:Flowplayer;
    private var stream:String;

    public function SubscribingConnector(player:Flowplayer, url:String, stream:String, doRtmpt:Boolean, proxyType:String) {
        this.player = player;
        this.rtmpUrl = url;
        this.stream = stream;
        this.connector = new ParallelConnector(player, url, doRtmpt, proxyType);
    }


    public function connect(connectedCallback:Function, disconnectedCallback:Function):void {

        connector.connect(function (conn:NetConnection):void {

            // listener for successful FCSubscribe
            conn.client = {
                onFCSubscribe: function (info:Object):void {

                    player.debug("FCSubscribe successful, connection established");
                    connectedCallback(conn);
                }
            };

            player.debug("Calling FCSubscribe for stream '" + stream + "'");
            conn.call("FCSubscribe", null, stream);

        }, disconnectedCallback);
    }

    public function close():void {
        connector.close();
    }

    public function get connected():Boolean {
        return connector.connected;
    }
}
}