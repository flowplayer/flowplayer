package {
import flash.display.Sprite;
import flash.events.MouseEvent;

public class MuteToggle extends Sprite {
   private var mute:Mute;
   private var unmute:UnMute;
   private var player:Flowplayer;
   private var volume:Number;
   
   public function MuteToggle(player:Flowplayer) {
      this.player = player;
      mute = new Mute();
      unmute = new UnMute();
      addChild(mute);
      addEventListener(MouseEvent.CLICK, onClick);
   }

   private function onClick(event:MouseEvent):void {
      if (mute.parent) {
         volume = player.volumeLevel;
         player.volume(0);
         removeChild(mute);
         addChild(unmute);
      } else {
         player.volume(volume);
         removeChild(unmute);
         addChild(mute);
      }
   }
}
}