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
import fl.transitions.Tween;
import fl.transitions.easing.None;

import flash.display.Sprite;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.utils.Timer;

public class Controlbar extends Sprite {
   private var player:Flowplayer;

   // child widgets
   private var elapsed:Time;
   private var duration:Time;
   private var timeline:Timeline;
   private const TIMELINE_HEIGHT:int = 10;
   private var mouseOutTimer:Timer;
   private var origHeight:int;
   private var origWidth:int;
   private var tweens:Array;
   private var inactiveTimer:Timer;

   public function Controlbar(player:Flowplayer) {
      this.player = player;

      elapsed = new Time(), duration = new Time();
      addChild(elapsed);
      addChild(duration);

      timeline = new Timeline(player);
      addChild(timeline);

      player.addEventListener(Flowplayer.STATUS, onStatus);
      player.addEventListener(Flowplayer.READY, onReady);

      player.stage.addEventListener(Event.MOUSE_LEAVE, onMouseOut);
      player.stage.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
      player.stage.addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);

      mouseOutTimer = new Timer(200, 1);
      mouseOutTimer.addEventListener("timer", minimize);

      inactiveTimer = new Timer(5000, 1);
      inactiveTimer.addEventListener("timer", minimize);
      inactiveTimer.start();
   }

   public function arrange(width:int, height:int):void {
      origWidth = width;
      origHeight = height;
      // draw background color
      graphics.clear();
      UI.drawRect(graphics, 0x333333, 0.6, width,  height);

      timeline.y = TIMELINE_HEIGHT/2;
      timeline.x = elapsed.width;

      elapsed.x = 1;
      duration.x = width - duration.width;
      timeline.arrange(width - elapsed.width - duration.width, height - TIMELINE_HEIGHT);
   }

   private function onStatus(event:Event):void {
      elapsed.value = player.status.time;
   }

   private function onReady(event:Event):void {
      duration.value = player.clip.duration;
   }

   private function minimize(e:Event = null):void {
      if (! elapsed.parent) {
         // already minimized
         return;
      }
      if (tweens && tweens[0].isPlaying) {
         return;
      }
      removeChild(elapsed);
      removeChild(duration);
      var animDuration:Number = 0.1;
      tweens = [
         new Tween(timeline, "height", None.easeOut, timeline.height, 3, animDuration, true),
         new Tween(timeline, "width", None.easeOut, timeline.width, player.stage.stageWidth, animDuration, true),
         new Tween(timeline, "y", None.easeOut, timeline.y, height - 3, animDuration, true),
         new Tween(timeline, "x", None.easeOut, timeline.x, 0, animDuration, true)
      ];
      animations("start");
      graphics.clear();
   }

   private function animations(func:String):void {
      tweens.forEach(function (tween:Tween,  i:int,  arr:Array):void {
         tween[func]();
      });
   }

   private function maximize():void {
      if (elapsed.parent) {
         // already maximized;
         return;
      }
      addChild(elapsed);
      addChild(duration);
      arrange(origWidth, origHeight);
   }

   private function onMouseMove(event:MouseEvent):void {
      maximize();
      animations("stop");
      mouseOutTimer.stop();
      inactiveTimer.reset();
      inactiveTimer.start();
   }

   private function onMouseOut(event:Event):void {
      mouseOutTimer.start();
   }
}

}