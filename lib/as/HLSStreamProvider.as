/*!
 Flowplayer : The Video Player for Web

 Copyright (c) 2014 Flowplayer Ltd
 http://flowplayer.org

 Authors: Guillaume du Pontavice

 -----

 This GPL version includes Flowplayer branding

 http://flowplayer.org/GPL-license/#term-7

 Commercial versions are available
 * part of the upgrade cycle
 * support the player development
 * no Flowplayer trademark

 http://flowplayer.org/pricing/
 */
package {
    import flash.media.Video;
    public class HLSStreamProvider implements StreamProvider {
        // player/video object
        private var player : Flowplayer;
        private var video : Video;

        public function HLSStreamProvider(player : Flowplayer, video : Video) {
            this.player = player;
            this.video = video;
        }

        public function load(config : Object) : void {
        }

        public function unload() : void {
        }

        public function play(url : String) : void {
        }

        public function pause() : void {
        }

        public function resume() : void {
        }

        public function seek(seconds : Number) : void {
        }

        public function volume(level : Number, fireEvent : Boolean = true) : void {
        }

        public function status() : Object {
            return null;
        }
    }
}
