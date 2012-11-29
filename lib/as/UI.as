package {
import flash.display.BlendMode;
import flash.display.DisplayObject;
import flash.display.DisplayObject;
import flash.display.Graphics;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.system.System;
import flash.text.AntiAliasType;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;

public class UI {
   private const CONTROLS_HEIGHT:int = 20;
   private var player:Flowplayer;

   private var fullescreen:FullscreenToggle;
   private var logo:Logo;
   private var controlbar:Controlbar;
   private var play:Play;
   private var embed:Embed;
   private var embedCode:EmbedCode;

   public function UI(player:Flowplayer) {
      this.player = player;

      logo = new Logo();
      player.addChild(logo);
      controlbar = new Controlbar(player);
      player.addChild(controlbar);

      fullescreen = new FullscreenToggle(player);
      player.addChild(fullescreen);

      play = new Play();

      embed = new Embed();
      player.addChild(embed);
      embedCode = new EmbedCode(player);

      arrange();

      player.stage.addEventListener(Event.RESIZE, arrange);
      player.stage.addEventListener(MouseEvent.CLICK, onClick);

      embed.addEventListener(MouseEvent.CLICK, toggleEmbed);

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
      embed.x = embed.y = 5;
      embedCode.x = embed.x + embed.width - 3;
      embedCode.y = 7;
      embedCode.arrange(Math.min(417, player.stage.stageWidth - embedCode.x - 5)); // embed code stretches to the right edge of stage minus 5px
      center(play, player.stage);
   }

   public static function drawRect(graphics:Graphics, color:Number, alpha:Number, width:int, height:int):void {
         Console.log("drawing rectangle of " + width + "x" + height);
         graphics.beginFill(color, alpha);
         graphics.drawRect(0, 0, width, height);
         graphics.endFill();
   }

   public static function center(widget:DisplayObject, container:DisplayObject, onlyX:Boolean = false):void {
      var prop:String = container is Stage ? "stageWidth" : "width";
      widget.x = container[prop]/2 - widget.width/2;
      if (onlyX) return;
      prop = container is Stage ? "stageHeight" : "height";
      widget.y = container[prop]/2 - widget.height/2;
   }

   public static function createText(color:Number = 0xffffff, size:int = 12):TextField {
      var field:TextField = new TextField();
      field.blendMode = BlendMode.LAYER;
      var format:TextFormat = new TextFormat();
      format.font = "Lucida Grande, Lucida Sans Unicode, Bitstream Vera, Verdana, Arial, _sans, _serif";
      field.antiAliasType = AntiAliasType.ADVANCED;
      format.size = size;
      format.color = color;
      field.defaultTextFormat = format;
      field.autoSize = TextFieldAutoSize.LEFT;
      return field;
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

   private function toggleEmbed(event:MouseEvent):void {
      if (embedCode && embedCode.parent) {
         player.removeChild(embedCode);
      } else {
         System.setClipboard(player.embedCode);
         player.addChild(embedCode);
      }
   }

}

}