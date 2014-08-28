//Flowplayer with extensions


var flowplayer = module.exports = require('./flowplayer');


//Support needed before engines
require('./ext/support');

//Engines
require('./engine/embed');
require('./engine/flash');
require('./engine/html5');

//Extensions
//require('./ext/slider'); //TODO enable
require('./ext/ui');
require('./ext/keyboard');
require('./ext/fullscreen');
require('./ext/playlist');
require('./ext/cuepoint');
require('./ext/subtitle');
require('./ext/analytics');
require('./ext/mobile');
require('./ext/embed');
