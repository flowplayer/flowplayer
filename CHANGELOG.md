Version 5.4.1
=============

Enhancements
------------

 * When embedding, make embed script, flowplayer library, flowplayer swf and skin configurable

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