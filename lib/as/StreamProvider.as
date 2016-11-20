/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2014 Flowplayer Ltd
 http://flowplayer.org

 Author: Guillaume du Pontavice

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
