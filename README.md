
# Flowplayer

[website](https://flowplayer.com) | [demos](https://flowplayer.com/demos/) | [docs](https://flowplayer.com/docs/)

## For the impatient

1. [Download Flowplayer](https://flowplayer.com/download/)
2. Unzip
3. Drop the folder under your server


## Minimal setup

```html
<!DOCTYPE html>

<head>
   <!-- flowplayer depends on jQuery 1.7.1+ (for now) -->
   <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>

   <!-- flowplayer.js -->
   <script type="text/javascript" src="flowplayer.min.js"></script>

   <!-- player styling -->
   <link rel="stylesheet" type="text/css" href="flowplayer/minimalist.css">

</head>

<body>

   <!-- player 1 -->
   <div class="flowplayer">
      <video src="my-video.mp4"></video>
   </div>

   <!-- player 2 -->
   <div class="flowplayer">
      <video>
         <source type="video/webm" src="my-video2.webm">
         <source type="video/mp4" src="my-video2.mp4">
      </video>
   </div>

</body>

```

## API Samples

```js
// listen to events on second player
flowplayer(1).bind("load", function (e, api, video) {

}).bind("pause", function (e, api) {

});

// work with jQuery
$(".flowplayer").bind("unload", function (e, api) {

});
```

## Compiling Flash

- Download [Open Source Flex SDK, v4.5.1](http://opensource.adobe.com/wiki/display/flexsdk/Download+Flex+4.5)

```
export mxmlc=<PATH_TO>/flex_sdk_4.5.1.21328_mpl/bin/mxmlc
cd ./flowplayer # this repository
make flash
```

## Reporting bugs

Please read the [contributing guidelines](CONTRIBUTING.md) before reporting issues or submitting patches.

## Running tests

Our automated test suite is sponsored by [BrowserStack](http://browserstack.com). Thanks you!

### Running locally

Tests are run on [BrowserStack](http://browserstack.com)

 * Install dependencies: `bundle install`
 * Setup broserstack tunnel: `java -jar features/support/BrowserStackTunnel.jar -f <your tunnel api key> /path/to/flowplayer/repo`
 * Run cucumber features: `rake username=<browserstack username> key=<broserstack automate api key> base_url=http://<something>.browserstack.com`

## License

[GPL v3 with an ADDITIONAL TERM per GPL Section 7](LICENSE.md)

Copyright (c) 2012 Flowplayer Ltd
