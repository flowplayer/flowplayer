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
import flash.external.ExternalInterface;

public class Console {
   public static function _log(message:String):void {
      if(ExternalInterface.available) {
         ExternalInterface.call('console.log', message);
      }
   }
}
}