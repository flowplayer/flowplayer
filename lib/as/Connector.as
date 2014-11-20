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

public interface Connector {

    function connect(connectedCallback:Function, disconnectedCallback:Function):void;

    function close():void;

    function get connected():Boolean;
}
}