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
