package {
import flash.events.TimerEvent;
import flash.utils.Timer;
import flash.utils.getTimer;

public class PlayTimeTracker {
    private var player:Flowplayer;
    private var progressTimer:Timer = new Timer(100);
    private var endDetectTimer:Timer = new Timer(100);
    private var lastTime:int;
    private var atSameTimeCount:int = 0;

    public function PlayTimeTracker(fp:Flowplayer) {
        player = fp;
    }

    public function start(duration:int):void {
        progressTimer = new Timer(200);

        progressTimer.addEventListener(TimerEvent.TIMER, function (e:TimerEvent):void {
            if (duration - time <= 0) {
                completelyPlayed();

            } else if (duration - time < 2 && time == lastTime) {
                checkStuckOnEnd();
            }

            lastTime = time;
        });

        progressTimer.start();
    }

    private function get time():int {
        return player.status().time;
    }

    private function checkStuckOnEnd():void {
        if (atSameTimeCount == 3) return completelyPlayed();
        atSameTimeCount++;
    }

    private function completelyPlayed():void {
        progressTimer.stop();
        endDetectTimer.stop();
        player.durationReached();
    }
}
}