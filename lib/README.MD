
## Player lifecycle

1. boot     before anything
2. unload   enter splash screen, optional
3. load     new video is loaded
4. ready    video is ready
5. play     playback starts: root.one("progress")
.........   seek, pause, resume, progress, buffer)
6. finish   video ends

.........
5. play     video starts again (replay)
2. unload   back to splash screen