/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2012 - 2014 Flowplayer Ltd
 https://flowplayer.com

 Author: Anssi Piirainen

 -----

 This GPL version includes Flowplayer branding

 https://flowplayer.com/license/#additional-term-per-gpl-section-7

 Commercial versions are available
 * part of the upgrade cycle
 * support the player development
 * no Flowplayer trademark

 https://flowplayer.com/pricing/
 */
package {

public interface Connector {

    function connect(connectedCallback:Function, disconnectedCallback:Function):void;

    function close():void;

    function get connected():Boolean;
}
}