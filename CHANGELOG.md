
Version 7.0
===========

Enhancements
------------

  * Complete UI rewrite
  * Built-in UI for Quality selection (#1080)
  * Airplay controls (#1059)
  * Chromecast support (#1061)
  * iPhone inline playback support (#1048)
  * HLS DVR support (#950)
  * HLS ID3 metadata support (#830)
  * Make iframe embed code responsive (#804)
  * `no-buffer` modifier class (#805)
  * `aspectRatio` option (#1029)


Fixes
-----

 * Fix #1036 - time format glitches
 * Fix #1056 - Flowplayer zoom issue
 * Fix #1050 - looping hls does not work on iOS
 * Fix #1024 - subtitle sticky when seeking out of initial first frame state
 * Fix #1027 - Flash: narrow down scope of issue 922 hack
 * Fix #1007 - off/unbind: splice inside forEach will prevent entire cycle
 * Fix #1065 - iPad: webkit-media-controls may persist
 * Fix #1077 - resume after seek on playlist finish starts first clip
 * Fix #1073 - mute() may have no effect from within ready event
 * Fix #985 - rtl: branding overlaps duration
 * Fix #987 - rtl is-touch: no duration; branding on right instead of left side and overlays time
 * Fix #1063 - [Chrome] playlist: error on resume when last clip is in finished state
 * Fix #1047 - load() loses buffer
 * Fix #992 - clip rtmp option still leads to src prefix requirement.
 * Fix #1039 - first frame JS setups do not catch all errors
 * Fix #1041 - Flash (not flash hls): no events after finish
 * Fix #857 - splash setup does not unload while embed code is shown
 * Fix #989 - On mobile resume still works when flowplayer is disabled.
 * Fix #881 - Implement fullscreen events with native_fullscreen
 * Fix #858 - fullscreen disabled leads to empty widget space
 * Fix #1044 - native_fullscreen assumes non-flash engine
 * Fix #997 - iframe embed code lacks px units in style directive
 * Fix #1005 - page direction vs flowplayer direction: avoid horizontal scrollbars
 * Fix #1025 - unload in paused state: browser continues to buffer
 * Fix #1017 - disabled: volume slider not greyed out
 * Fix #1000 - seek rounding error
 * Fix #986 - rtl: tooltip time is ltr
 * Fix #996 - Flash object pausing workaround only works on splash setupsA


Version 6.0.5
=============

Enhancements
------------

 * Allow specifying a playlist index to start from (#973)


Fixes
-----

 * Fix #979 - shutdown disables fullscreen events
 * Fix #969 - addCuepoint bug when using an object to define the cue.
 * Fix #968 - flashls live: player does not change on resume state after longer pause (regression from 6.0.3)
 * Fix #967 - RTMP live doesn't observe mute setting on pause/resume
 * Fix #966 - rtmp: live:true doesn't set bufferTime:0
 * Fix #961 - minimalist: wrong mouseout transitions for volume & mute (regression from 6.0.3)
 * Fix #919 - rtl: various glitches
 * Fix #957 - generate_cuepoints: seeks to timeline postion, not cuepoint (regression from v5)

Version 6.0.4
=============

Enhancements
------------

 * #944 - poster: add new api property when poster condition is met

Fixes
-----

 * Fix #959 - Flash HLS: ready fired too early
 * Fix #958 - generate_cuepoints: seeks to timeline postion, not cuepoint (regression from v5)
 * Fix #955 - Prevented seek beyond cuepoint disables cuepoint once
 * Fix #943 - shutdown() does not remove instance data-attribute
 * Fix #942 - quality selector loses poster state with playlist
 * Fix #941 - api undefined in stop callback argument in non-splash setups
 * Fix #940 - autoplay: does not go into poster state on stop
 * Fix #936 - IE8: no player displayed for splash setups if no height: for container
 * Fix #928 - BeforeSeek Event does not working in IE11
 * Fix #926 - Do not show context menu when trying to enable flash plugin
 * Fix #924 - flash: play(index) and load(clip) load encoded url
 * Fix #923 - Controlbar mouse over problem
 * Fix #922 - Chrome: Flash object with less than 461px width does not work
 * Fix #918 - Native subtitles shown when mixed native and flowplayer subtitles on same page
 * Fix #912 - Crossorigin subtitles do not work on iPhone
 * Fix #911 - flash hls: seeking beyond end of video causes undefined player state
 * Fix #908 - ipad: tooltip appears empty, or is stuck at first position when scrubbing
 * Fix #906 - bgcolor: does not override .flowplayer.is-splash background-color
 * Fix #904 - flashdisabled message does not make sense when Flash is in fact enabled
 * Fix #901 - RTMP: src location w/o prefix considered as HTTP
 * Fix #898 - 6.0.3: live option not recognized on clip level with generic HLS

Version 6.0.3
=============

Fixes
-----

 * Fix #894 - Some elements not shown in fullscreen
 * Fix #883 - autoplay on player level not respected in html5 engine
 * Fix #882 - Flash engine reports invalid volume for zero
 * Fix #879 - flashls: make resume of live stream reliable
 * Fix #878 - ipad: duration/remaining inside timeline for videos longer than 1hr
 * Fix #877 - jQuery JS install triggers error (regression in 6.0.2)
 * Fix #876 - playlist: is-active not applied to playlists outside container
 * Fix #871 - Context-menu broken in fullscreen
 * Fix #870 - IE: load(clip) and setPlaylist() not reliable

Version 6.0.2
=============

Enhancements
------------

 * Playlist outside of container div (#443)
 * `flowplayer.set()` method for defining global configuration

Fixes
-----
 * Fix #748 - Chrome PepperFlash immediately fails over to RTMPT
 * Fix #775 - RTMP live stream autoplays and cannot be paused
 * Fix #809 - Playful close button looks inconsistent
 * Fix #811 - Muted option does not work
 * Fix #812 - HLS: stream does not work on Android 4.1
 * Fix #823 - clip options in playlists are sticky, triggering trouble with picking order
 * Fix #824 - flashls: add debug option(s)
 * Fix #827 - playlist embed: should embed _configured_ playlist
 * Fix #829 - seeking broken in IE8
 * Fix #837 - analytics: use clip.title?
 * Fix #840 - jQuery plugin init - config precedence wrong
 * Fix #847 - IE8: muted on start despite volume showing, chsanngin volume does not work
 * Fix #848 - Optionally start with subtitles present, but disabled
 * Fix #852 - analytics: use long hearbeat interval
 * Fix #821 - RTMP: breaks with special chars in URLS
 * Fix #831 - iPhone playback crashes when you exit twice
 * Fix #864 - CSS issue on touch devices
 * Fix #863 - RTMP does not play until end
 * Fix #866 - Flash: keep aspect ratio in the swf code, like swfHls does

Version 6.0.1
=============

Fixes
-----

 * Fix #808 - functional + playful fixed-controls: disappear in fullscreen
 * Fix #807 - IE11: time and timeline do not update
 * Fix #806 - iphone: does not resume after return from native fullscreen
 * Fix #802 - Simulated fullscreen - players pinned to top of window
 * Fix #801 - ipad: native_fullscreen does not work
 * Fix #803 - splash option: works only if no container background-color is given


Version 6.0
===========

Enhancements
------------

 * HLS support for Flash Engine
 * New JavaScript configuration syntax
 * No jQuery dependency
 * Video title element
 * Multilingual subtitle support
 * API for subtitles
 * Subtitle control element
 * API for cuepoints
 * is-closeable does not exclude fullscreen anymore
 * API for playlist handling
 * UMD definition (RequireJS and commonJS support)
 * Mixed engines support for playlists
 * Playlist embedding
 * iFrame based embedding
 * Refreshed skins
 * Vector icons

 
Fixes
-----

 * Fix #702 - adaptiveRatio does not work on HLS with Android Chrome
 * Fix #676 - embed code generator triggers video loading in Chrome
 * Fix #671 - Flash engine on Chrome load file twice
 * Fix #664 - playlist: api stays in finished stage after playthrough next switch
 * Fix #663 - Embed always uses sources from initial video
 * Fix #651 - embed: make player size configurable (re: hls)
 * Fix #644 - Analytics plugin doesn't send heartbeat while playing
 * Fix #639 - Add proper event listener cleanup
 * Fix #613 - Flash + WebKit + Live: cuepoints unusable because of fullscreen toggle
 * Fix #610 - Cuepoint misses on Android
 * Fix #589 - rtmp: recovery from bad url does not work
 * Fix #588 - adaptiveRatio: only has an effect on first load
 * Fix #587 - playlist: click on first item has no effect in non-splash setups
 * Fix #538 - When using Flash, no ready event in flowplayer 5.4.3 if jQuery not global
 * Fix #485 - .fp-next and .fp-prev don't work if inserted after player initialization
 * Fix #453 - error reports valid url instead of the bad one
 * Fix #452 - Flowplayer flash doesn't abort image loading
 * Fix #450 - window.onload doesn't work on iPad
 * Fix #448 - "load" and "unload.pl" event handlers bound multiple times
 * Fix #361 - play() / pause() / resume() commands don't work when player is disabled
 * Fix #352 - api: stop() issues
 * Fix #284 - ready event and load callback not caught
 * Fix 257 - load() doesn't reset video.time
 * Fix #244 - load/play restrictions
 * Fix #162 - flash mode can't handle utf-8 media locations
 * Fix #100 - issue with seeking on cuepoints and changing rate


Version 5.5.2
=============

Enhancements
------------

 * Add ability to configure wmode for flash engine

Fixes
-----

 * Fix #729 - 5.5.1 flash regression: playlists do not advance
 * Fix #727 - Android (Chrome) reports currentTime as zero in live setups
 * Fix #721 - Video not shown on Windows Phone 8.1

Version 5.5.1
=============

Enhancements
------------

* The performance of the Flash engine was improved. There's less video stuttering with Firefox.
* Improvements for HLS and live streams.

Fixes
-----

* Fix #697 - Flash with http progressive download: preload="none" breaks buffer indication
* Fix #387 - Initial volume setting was ignored with the flash engine
* Fix #462 - Add possibility to disable the rtmpt connection attempt. Can be done by setting rtmpt: false in configuration
* Fix #612 - Make looping work with non-rtmp clips
* Fix #655 - Add support for complete rtmp urls
* Fix #697 - Fix the buffer bar to work when preload="none" is set
* Fix #701 - Make autoplay work on live RTMP streams
* Fix #577 - Force native subtitles for certain devices
* Fix #717 - Insert subtitle track in ready event
* Fix #577 - Enable subtitles explicitly
* Fix #479 - Background handling for HLS videos/streams
* Fix #705 - Don't allow seeking in live setups
* Fix #699 - Correctly check for video type


Version 5.5.0
=============

Enhancements
------------

 * Full support for HLS on Android (on HLS-compatible browsers)
 * Added shadow to play icon to avoid dissapearing controls on light background
 * Added `data-subscribe` option for flash engine (FCSubsribe). Needed by some CDNs.
 * `preload` can now be given by config when initializing into empty container
 * Fullscreen support for Internet Explorer 11

Fixes
-----
 
 * Fix #683 - Engine selection does not loop through all available engines
 * Fix #677 - Subtitle: are not removed at end point if timecode contains hours
 * Fix #648 - Local Storage bug with IOS private browsing
 * Fix #661 - Make all video type checks case-insensitive
 * Fix #637 - HLS: playlist or splash setup crashes desktop Safari
 * Fix #633 - HLS embedded with wrong mime-type "video/mpegurl"
 * Fix #581 - flash: autoplay setup broken
 * Fix #622 - preload="none" causes error in Internet Explorer 11
 * Fix #509 - live: always preload="none"
 * Fix #659 - speed help text outdated - show speed only if supported?
 * Fix #586 - Chrome + flash fullscreen bug - video is play from beginingA
 * Fix #645 - Flash engine should allow bufferLength of zero
 * Fix #446 - Mute-state not restored from storage in splash setups
 * Fix #570 - Live Flash: stream cannot be resumed

Changes
-------

 * On Android, source order is now respected (previously mp4 was always chosen)


Version 5.4.6
=============

Fixes
-----

 * Fix #604 - Android + iPhone - no video
 * Fix #606 - Amazon Silk - no visible video

Version 5.4.5
=============

Fixes
-----

 * Fix #575 - iOS 7: extremely long loading times with several players on page
 * Fix #569 - Live Flash WebKit: hangs on fullscreen toggle
 * Fix #559 - safari + flash: type error
 * Fix #573 - iOS fullscreen exit shows splash
 * Fix #591 - iframe + Chrome nitpicks about local storage
 * Fix #594 - API Safari 6 Flash detection
 * Fix #595 - Problems with Internet Explorer 9 on Windows 7 N-edition
 * Fix #599 - preload="none" Type Error

Version 5.4.4
=============

Enhancements
------------

 * Add UI support for live streaming
 * Add context menu for the player
 * Allow configuring NetStream.bufferTime for flash engine (#337)

Fixes
-----

 * Fix #555 - no subtitles in IE with splash setup
 * Fix #539 - Black horizontal lines in iOS 7
 * Fix #557 - rtmp js playlist: 2nd video does not start at beginning
 * Fix #486 - playlist: iOS always starts with first item
 * Fix #481 - On Chrome for Android, "ready" event is sent before having metadata, and is sent twice.
 * Fix #126 - flash: webkit always plays first clip in playlist on fullscreen toggle
 * Fix #455 - flowplayer makefile does not use variable mxmlc path
 * Fix #480 - fullscreen broken in some Chrome versions on Android
 * Fix #476 - embed: only works with absolute urls
 * Fix #389 - flash: fullscreen toggle restarts clip even in rtmp in some browsers
 * Fix #466 - Do not let key 219 trigger help
 * Fix #490 - Flash fallback doesn't work on (certain) Windows 8 / Internet Explorer 10 combinations
 * Fix #521 - flash fullscreen: screen.availHeight not reliable in WebKit
 * Fix #548 - Libs from embed.min.js included twice
 * Fix #549 - Multiple embeds on same page fail with jquery 1.10+
 * Fix #483 - Webkit rounding issue was causing buffered event to not fire
 * Fix #498 - Flash Buffered Event Firing Multiple Times
 * Fix #497 - ie9 plays both rtmp and mp4 if flash engine is preferred
 * Fix #469 - esc binding to stop() unfortunate
 * Fix subtitles with jquery.migrate.js
 * Fix javascript-playlist setup without .fp-next and .fp-prev elements

Version 5.4.3
=============

Enhancements
------------

 * Flowplayer now works inside iOS UIWebView component

Fixes
-----

 * Fix #421 - js-playlist setup does not play through in rtmp (regression)
 * Fix #419 - empty container js setup: needs 2 clicks to trigger replay
 * Fix #426 - js-setup: method "map" not supported (flash? jQuery.map?)
 * Fix #427 - js-playlist: fp-prev, fp-next no-ops
 * Fix #424 - Subtitles and seeking
 * Fix #369 - Fullscreen not working with jQuery 1.7.1

Version 5.4.2
=============

Enhancements
------------

 * Flash engine now supports [RTMP load balancing with Wowza](http://www.wowza.com/forums/showthread.php?4637-Dynamic-Load-Balancing-solution)
 * RTMPT support for Flash engine
 * beforeseek event now supports defaultPreventing

Fixes
-----

 * Fix #381 - XSS vulnerability in Flash fallback
 * Fix #375 - Error when no index passed to play() method
 * Fix #373 - native_fullscreen + playlist: duplicate controls on "done"
 * Fix #369 - jquery 1.7.1 not sufficient for JS install
 * Fix #383 - resolve() should not delete type
 * Fix #367 - no-mute modifier class broken on its own
 * Fix #387 - Volume/muting params after refreshing page
 * Fix #353 - playlist: problem with similarly named files
 * Fix #391 - finish + playlist: index, is_last video properties not available, is-last class always present
 * Fix #392 - [Internet Explorer] Play button behavior
 * Fix #356 - JavaScript playlist clip indices still depend on file naming scheme


Version 5.4.1
=============

Enhancements
------------

 * When embedding, make embed script, flowplayer library, flowplayer swf and skin configurable
 * Load all resources without protocol where possible

Fixes
-----

 * Fix mobile safari native_fullscreen configuration option
 * Fix commercial embedding with flash engine
 * Fix playlist advancing with Internet Explorer 9
 * Fix clip choosing after playing through the playlist
 * Fix for falling back to flash engine on Internet Explorer installation without media extensions
 * Fix fullscreen with Chrome on Android

Version 5.4
===========

Enhancements
------------

 * RTL (right-to-left) support
 * Playlist configuration via JavaScript
 * Support for Chrome on iPad
 * Support for Windows Phone
 * Support for Firefox on Android
 * Support [native fullscreen](http://www.w3.org/TR/fullscreen/)
 * Opt-in for Apple Airplay
 * Touch-optimized control bar for touch enabled devices

Fixes
-----

 * Only remove owned video nodes on unload()
 * Fix poster for flash engine
 * Hide error message caused by navigating away from page
 * Don't preload anything with flash engine when preload="none" specified
 * Fix fullscreen in desktop Safari
 * Fix cuepoint firing for 0.0
 * Show correct duration with desktop Safari for HLS
 * Don't start playback accidentally when scrolling over player with touch devices
 * Fallback background color for splash-setups on touch devices is now only set when Flowplayer falls back to splash config
 * For iPhone and other devices incapable of displaying videos inline - the video component is hidden to avoid UI bugs
 * data-volume -attribute is now always respected
 * Don't set incorrect aspect ratio when embedding
 * Timeline isn't accidentally enabled in ready event anymore if explicitely disabled
 * Make sure load-event can be canceled via event.preventDefault()
 * Source urls can now contain query strings (signed AWS URLS etc)
 * Cuepoints are now cleaned for playlist items
 * Relative video source urls now work also in IE7
 * Re-introduce support for Android 2.x
 * `is_last` and `index` properties are now correctly reported for playlist items
 * `finish` event isn't triggered twice anymore
 * don't set last volume to zero when muting (allow un-muting)
 * Check for correct support property when showing error of unsupported video format
