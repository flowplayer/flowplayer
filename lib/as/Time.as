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
import flash.display.BlendMode;
import flash.display.Sprite;
import flash.text.AntiAliasType;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;

public class Time extends Sprite {
   private var field:TextField;

   public function Time() {
      field = UI.createText();
      addChild(field);
      this.value = 0;
   }

   public function set value(newVal:int):void {
      field.text = format(newVal);
      field.x = 3;
   }

   private function zeropad(val:int):String {
      return val >= 10 ? "" + val : "0" + val;
   }

// display seconds in hh:mm:ss format
   private function format(sec:int):String {
      sec = sec || 0;

      var h:int = Math.floor(sec / 3600),
              min:int = Math.floor(sec / 60);

      sec = sec - (min * 60);

      if (h >= 1) {
         min -= h * 60;
         return h + "h:" + zeropad(min);
      }
      return zeropad(min) + ":" + zeropad(sec);
   }

   override public function get width():Number {
      return field.textWidth + 10;
   }
}
}