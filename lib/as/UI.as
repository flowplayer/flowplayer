package {
import flash.display.Graphics;
import flash.events.Event;

public class UI {

   private var logo:Logo;
   private var controlbar:Controlbar;
   private var player:Flowplayer;
   private const CONTROLS_HEIGHT:int = 20;

   public function UI(player:Flowplayer) {
      this.player = player;

      logo = new Logo();
      player.addChild(logo);
      controlbar = new Controlbar(player);
      player.addChild(controlbar);

      arrange();
      player.stage.addEventListener(Event.RESIZE, arrange);

      Console.log("UI initialized");
   }

   private function arrange(e:Event = null):void {
      controlbar.arrange(player.stage.stageWidth, CONTROLS_HEIGHT);
      logo.width = 100;
      logo.x = 12;
      logo.scaleY = logo.scaleX;
      logo.y = player.stage.stageHeight - logo.height - CONTROLS_HEIGHT - 5;
      controlbar.y = player.stage.stageHeight - CONTROLS_HEIGHT;
   }

   public static function drawRect(graphics:Graphics, color:Number, alpha:Number, width:int, height:int):void {
         Console.log("drawing rectangle of " + width + "x" + height);
         graphics.beginFill(color, alpha);
         graphics.drawRect(0, 0, width, height);
         graphics.endFill();
   }
}

}