package {
import flash.display.DisplayObject;
import flash.display.DisplayObject;
import flash.display.Graphics;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;

public class UI {
   private const CONTROLS_HEIGHT:int = 20;
   private var player:Flowplayer;

   private var fullescreen:FullscreenToggle;
   private var logo:Logo;
   private var controlbar:Controlbar;
   private var play:Play;

   public function UI(player:Flowplayer) {
      this.player = player;

      logo = new Logo();
      player.addChild(logo);
      controlbar = new Controlbar(player);
      player.addChild(controlbar);

      fullescreen = new FullscreenToggle(player);
      player.addChild(fullescreen);

      play = new Play();

      arrange();

      player.stage.addEventListener(Event.RESIZE, arrange);
      player.stage.addEventListener(MouseEvent.CLICK, onClick);

      var addPlay:Function = function (e:Event):void { player.addChild(play); };
      player.addEventListener(Flowplayer.PAUSE, addPlay);
      player.addEventListener(Flowplayer.FINISH, addPlay);

      Console.log("UI initialized");
   }

   private function arrange(e:Event = null):void {
      controlbar.arrange(player.stage.stageWidth, CONTROLS_HEIGHT);
      logo.width = 100;
      logo.x = 12;
      logo.scaleY = logo.scaleX;
      logo.y = player.stage.stageHeight - logo.height - CONTROLS_HEIGHT - 5;
      controlbar.y = player.stage.stageHeight - CONTROLS_HEIGHT;
      fullescreen.x = player.stage.stageWidth - fullescreen.width;
      fullescreen.y = 5;
      center(play, player.stage);
   }

   public static function drawRect(graphics:Graphics, color:Number, alpha:Number, width:int, height:int):void {
         Console.log("drawing rectangle of " + width + "x" + height);
         graphics.beginFill(color, alpha);
         graphics.drawRect(0, 0, width, height);
         graphics.endFill();
   }

   public static function center(widget:DisplayObject, container:DisplayObject, onlyX:Boolean = false):void {
      widget.x = container.width/2 - widget.width/2;
      if (onlyX) return;
      widget.y = container.height/2 - widget.height/2;
   }

   private function onClick(event:MouseEvent):void {
      // do not toggle if clicked on controlbar
      if (! (event.target is Stage || event.target is Play)) return;

      if (event.target == controlbar) return;
      if (play.parent) {
         player.removeChild(play);
      }
      player.togglePlay();
   }

}

}