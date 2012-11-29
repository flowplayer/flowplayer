package {
import flash.display.Sprite;
import flash.text.TextField;
import flash.text.TextFieldType;

public class EmbedCode extends Sprite {
   private var code:TextField;

   public function EmbedCode(player:Flowplayer) {
      var msg:TextField = UI.createText(0x6a6a6a, 10);
      msg.text = "Paste this HTML code to your site to embed.";
      addChild(msg);
      msg.x = 8;
      msg.y = 3;

      code = UI.createText(0xcccccc, 10);
      addChild(code);
      code.type = TextFieldType.DYNAMIC;
      code.text = player.embedCode;
      code.x = 8;
      code.y = msg.y + msg.height + 2;

      code.setSelection(0, code.text.length);
      code.selectable = false;
      code.scrollH = code.scrollV = 0;
      code.background = true;
      code.backgroundColor = 0x6283ac;
   }

   public function arrange(width:int):void {
      var xOrig:int = 5;

      graphics.clear();
      graphics.lineStyle(1, 0x4a4d4a);

      graphics.beginFill(0x333333, alpha);
      var ellipseWidth:int = 5;
      graphics.moveTo(xOrig, 0);
      graphics.lineTo(width - ellipseWidth, 0);
      graphics.curveTo(width, 0, width, ellipseWidth);

      graphics.lineTo(width, 43 - ellipseWidth);
      graphics.curveTo(width, 43, width - ellipseWidth, 43);

      graphics.lineTo(xOrig + ellipseWidth, 43);
      graphics.curveTo(xOrig, 43, xOrig, 43 - ellipseWidth);

      graphics.lineTo(xOrig, 10);
      graphics.lineTo(0, 5);
      graphics.lineTo(xOrig, 0);
      graphics.endFill();

      code.width = width - 16;
   }
}
}