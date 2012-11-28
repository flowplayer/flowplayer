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

public class Timeline extends Sprite {

   private var player:Flowplayer;
   private var progress:Sprite;
   private var buffer:Sprite;
   private var dragTimer:Timer;
   private var prevDragPos:Number;
   private var myWidth:Number;

   public function Timeline(player:Flowplayer) {
      this.player = player;

      progress = new Sprite();
      buffer = new Sprite();

      var timer:Timer = new Timer(50);
      timer.addEventListener("timer", timeupdate);
      timer.start();

      dragTimer = new Timer(20);
      dragTimer.addEventListener("timer", dragging);

      addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
   }

   public function arrange(width:int, height:int):void {
      Console.log("Timeline.arrange: " + width + "x" + height);
      myWidth = width;
      graphics.clear();
      progress.graphics.clear();
      buffer.graphics.clear();
      UI.drawRect(graphics, 0x666666, 1, width, height);
      UI.drawRect(progress.graphics, 0x00a7c8, 1, 1, height);
      UI.drawRect(buffer.graphics, 0xeeeeee, 1, 1, height);
   }

   private function dragging(event:Event):void {
      if (Math.abs(prevDragPos - mouseX) < 1) return;
      prevDragPos = mouseX;
      player.seek(mouseX / width * player.status.duration);
   }

   private function onMouseDown(event:MouseEvent):void {
      player.seek(mouseX / width * player.status.duration);
      addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
      player.stage.addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
      dragTimer.start();
   }

   private function onMouseUp(event:MouseEvent):void {
      removeEventListener(MouseEvent.MOUSE_UP, onMouseUp);
      dragTimer.stop();
   }

   private function timeupdate(event:Event):void {
      var duration:Number = player.status.duration;
      if (duration == 0) return;
      if (player.status.buffer > 0) {
         addChild(buffer);
      }
      if (player.status.time > 0) {
         addChild(progress);
      }
//      Console.log("buffer = " + player.status.buffer + ", duration " + duration);
      resize(buffer, Math.min(width, (player.status.buffer / duration) * width));
      resize(progress, Math.min(width, (player.status.time / duration) * width));
   }

   private function resize(obj:Sprite, width:Number, duration:int = 50): void {
      var tween:Tween = new Tween(obj, "width", None.easeOut, obj.width, width, duration/1000, true);
      tween.start();
   }

   // for some reason the superclass width does not reset when coming back from fullscreen
   override public function get width():Number {
      return myWidth;
   }
}
}