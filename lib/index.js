/* eslint-disable no-unused-vars */

//Flowplayer with extensions

require('es5-shim');

var flowplayer = module.exports = require('./flowplayer');
//

//Support needed before engines
require('./ext/support');

//Engines
require('./engine/embed');
require('./engine/html5');
require('./engine/flash');

//Extensions
//require('./ext/slider'); //TODO enable
require('./ext/ui');
require('./ext/keyboard');
require('./ext/playlist');
require('./ext/cuepoint');
require('./ext/subtitle');
require('./ext/analytics');
require('./ext/embed');
require('./ext/airplay');
//Have to add fullscreen last
require('./ext/fullscreen');

require('./ext/mobile');
//BRANDING
