/*    
 *    Author: Anssi Piirainen, <api@iki.fi>
 *
 *    Copyright (c) 2010 Flowplayer Oy
 *
 *    This file is part of Flowplayer.
 *
 *    Flowplayer is licensed under the GPL v3 license with an
 *    Additional Term, see http://flowplayer.org/license_gpl.html
 */
package {
import flash.display.Sprite;
import flash.events.Event;

public class Controlbar extends Sprite {
   private var player:Flowplayer;

   // child widgets
   private var elapsed:Time;
   private var duration:Time;
   private var timeline:Timeline;
   private const TIMELINE_HEIGHT:int = 10;

   public function Controlbar(player:Flowplayer) {
      this.player = player;

      elapsed = new Time(), duration = new Time();
      addChild(elapsed);
      addChild(duration);

      timeline = new Timeline(player);
      timeline.y = TIMELINE_HEIGHT/2;
      timeline.x = elapsed.width;
      addChild(timeline);

      player.addEventListener(Flowplayer.STATUS, onStatus);
      player.addEventListener(Flowplayer.READY, onReady);
   }

   public function arrange(width:int, height:int):void {
      // draw background color
      graphics.clear();
      UI.drawRect(graphics, 0x333333, 0.6, width,  height);

      elapsed.x = 1;
      duration.x = width - duration.width;
      timeline.arrange(width - elapsed.width - duration.width, height - TIMELINE_HEIGHT);
   }

   private function onStatus(event:Event):void {
//      Console.log("onStatus");
      elapsed.value = player.status.time;
   }

   private function onReady(event:Event):void {
      Console.log("onReady");
      duration.value = player.clip.duration;
   }
}

}