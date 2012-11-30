package {
import flash.display.BlendMode;
import flash.display.DisplayObject;
import flash.display.DisplayObject;
import flash.display.Graphics;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.ContextMenuEvent;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.net.URLRequest;
import flash.net.navigateToURL;
import flash.system.System;
import flash.text.AntiAliasType;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;
import flash.ui.ContextMenu;
import flash.ui.ContextMenuItem;

public class UI extends Sprite {
   private const CONTROLS_HEIGHT:int = 20;
   private var player:Flowplayer;

   private var fullescreen:FullscreenToggle;
   private var logo:Logo;
   private var controlbar:Controlbar;
   private var play:Play;
   private var embed:Embed;
   private var embedCode:EmbedCode;
   private var conf:Object;

   public function UI(player:Flowplayer) {
      this.player = player;
      this.conf = player.config;
      player.addChild(this);

      controlbar = new Controlbar(player);
      player.addChild(controlbar);
      play = new Play();

      contextMenu = createMenu();
      logo = new Logo();
      // logo needs a solid hit area for mouse clicks
      var hitArea:Sprite = new Sprite();
      hitArea = new Sprite();
      hitArea.visible = hitArea.mouseEnabled = false;
      UI.drawRect(hitArea.graphics, 0, 1, logo.width, logo.height);
      logo.hitArea = hitArea;
      logo.buttonMode = true;
      logo.addEventListener(MouseEvent.CLICK, function (e:Event):void { navigateToURL(new URLRequest("http://flowplayer.org"), "_self"); } );
      player.addChild(hitArea);
      player.addChild(logo);

      if (conf.fullscreen) {
         fullescreen = new FullscreenToggle(player);
         player.addChild(fullescreen);
      }

      if (conf.embed) {
         embed = new Embed();
         player.addChild(embed);
         embedCode = new EmbedCode(player);
         embed.addEventListener(MouseEvent.CLICK, toggleEmbed);
      }

      arrange();

      player.stage.addEventListener(Event.RESIZE, arrange);
      player.stage.addEventListener(MouseEvent.CLICK, onClick);

      var addPlay:Function = function (e:Event):void { player.addChild(play); };
      player.addEventListener(Flowplayer.PAUSE, addPlay);
      player.addEventListener(Flowplayer.FINISH, addPlay);
   }

   private function arrange(e:Event = null):void {
      // fill this UI layer with transparent color to receive mouse events properly
      UI.drawRect(graphics, 0, 0, player.stage.stageWidth, player.stage.stageHeight);

      controlbar.arrange(player.stage.stageWidth, CONTROLS_HEIGHT);
      controlbar.y = player.stage.stageHeight - CONTROLS_HEIGHT;

      logo.width = 100;
      logo.x = 12;
      logo.scaleY = logo.scaleX;
      logo.y = player.stage.stageHeight - logo.height - CONTROLS_HEIGHT - 5;
      logo.hitArea.x = logo.x;
      logo.hitArea.y = logo.y;

      if (fullescreen) {
         fullescreen.x = player.stage.stageWidth - fullescreen.width;
         fullescreen.y = 5;
      }
      if (embed) {
         embed.x = embed.y = 5;
         embedCode.x = embed.x + embed.width - 3;
         embedCode.y = 7;
         embedCode.arrange(Math.min(417, player.stage.stageWidth - embedCode.x - 5)); // embed code stretches to the right edge of stage minus 5px
      }
      center(play, player.stage);
   }

   public static function drawRect(graphics:Graphics, color:Number, alpha:Number, width:int, height:int):void {
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

   private function buildMenu(menu:ContextMenu):ContextMenu {

      return menu;
   }

   private function createMenu():ContextMenu {
      var menu:ContextMenu = new ContextMenu();
      menu.hideBuiltInItems();
      addItem(menu, new ContextMenuItem("About Flowplayer " + conf.version + "...", false, true), function(event:ContextMenuEvent):void {
         navigateToURL(new URLRequest("http://flowplayer.org"), "_self");
      });
      var date:Date = new Date();
      addItem(menu, new ContextMenuItem("Copyright " + date.fullYear + " Flowplayer Oy", true, false));
      addItem(menu, new ContextMenuItem("GPL based license...", false, true), function(event:ContextMenuEvent):void {
         navigateToURL(new URLRequest("http://flowplayer.org/license/"), "_self");
      });
      return menu;
   }

   private function addItem(menu:ContextMenu, item:ContextMenuItem, selectHandler:Function = null):void {
      menu.customItems.push(item);
      if (selectHandler != null) {
         item.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT, selectHandler);
      }
   }

   private function onClick(event:MouseEvent):void {
      // do not toggle if clicked on controlbar
      if (! (event.target is UI || event.target is Play)) return;

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