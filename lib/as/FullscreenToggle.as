package {
import flash.display.Sprite;
import flash.display.StageDisplayState;
import flash.events.Event;
import flash.events.FullScreenEvent;
import flash.events.MouseEvent;
import flash.media.Video;

public class FullscreenToggle extends Sprite {
   private var player:Flowplayer;
   private var enter:EnterFullscreen;
   private var exit:ExitFullscreen;
   private var origWidth:Number;
   private var origHeight:Number;

   public function FullscreenToggle(player:Flowplayer) {
      this.player = player;
      enter = new EnterFullscreen();
      exit = new ExitFullscreen();
      addChild(enter);

      addEventListener(MouseEvent.CLICK, onClick);
      player.stage.addEventListener(FullScreenEvent.FULL_SCREEN, onFullScreen);
   }

   private function onClick(event:MouseEvent):void {
      if (enter.parent) {
         stage.displayState = StageDisplayState.FULL_SCREEN;
      } else {
         stage.displayState = StageDisplayState.NORMAL;
      }
   }

   private function scaled(max:int, orig:int, scaling:Number):int {
      var result:int = Math.ceil(scaling * orig);
      return result > max ? max : result;
   }

   /*
    * resizes the video for fullscreen, preserving aspect ratios.
    */
   private function resizeInAspect():void {
      var xRatio:Number = stage.stageWidth / origWidth;
      var useXRatio:Boolean = xRatio * origHeight <= stage.stageHeight;

      if (useXRatio) {
         resize(stage.stageWidth, scaled(stage.stageHeight, origHeight, xRatio));
      } else {
         var yRatio:Number = stage.stageHeight / origHeight;
         resize(scaled(stage.stageWidth, origWidth, yRatio), stage.stageHeight);
      }
   }

   private function resize(width:int, height:int):void {
      var video:Video = player.videoDisp;
      video.width = width;
      video.height = height;

      // center the video in stage
      video.x = stage.stageWidth / 2 - video.width / 2;
      video.y = stage.stageHeight / 2 - video.height / 2;
   }

   private function onFullScreen(event:FullScreenEvent):void {
      if (event.fullScreen) {
         // store original dimensions before entering fullscreen
         origWidth = player.videoDisp.width;
         origHeight = player.videoDisp.height;
         resizeInAspect();
         removeChild(enter);
         addChild(exit);
      } else {
         resize(origWidth, origHeight);
         removeChild(exit);
         addChild(enter);
      }
   }
}
}