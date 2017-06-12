/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2014 Flowplayer Ltd
 https://flowplayer.com

 Author: Guillaume du Pontavice

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

    import flash.media.Video;
public interface StreamProvider {
    function load(config:Object):void;
    
    function unload():void;

    function play(url:String):void;

    function pause():void;

    function resume():void;

    function seek(seconds:Number):void;

    function volume(level:Number, fireEvent:Boolean = true):void;

    function status():Object;

    function setProviderParam(key:String, value:Object):void;

    function get video() : Video;

    function setQuality(q  : Number) : void;
  }
}
