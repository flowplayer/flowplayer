export PATH := ./node_modules/.bin/:$(PATH)
# flash compile
MXMLC_VERSION := $(shell mxmlc --version 2>/dev/null)

ifdef MXMLC_VERSION
	FLASH = $(shell which mxmlc)
else
	FLASH="/opt/flowplayer/flex3sdk/bin/mxmlc"
endif
FLASH_COMPILE=$(FLASH) -default-frame-rate=50 -static-link-runtime-shared-libraries=true -library-path=.

# version and date
VERSION=$(shell cat VERSION)
SET_VERSION=sed "s/@VERSION/${VERSION}/g"

DATE=$(shell git log -1 --pretty=format:%ad --date=short)
SET_DATE=sed "s/@DATE/${DATE}/"

# paths
DIST=./dist
JS=$(DIST)/flowplayer.js
SKIN=$(DIST)/skin

CDN=releases.flowplayer.org
EMBED=embed.flowplayer.org
CDN_PATH=""

# http://flowplayer.org/license
concat: raw
	# flowplayer.js
	@ node -e "var fs = require('fs'), js=fs.readFileSync('$(JS)', 'utf8'); process.stdout.write(js.replace('//BRANDING', fs.readFileSync('deps/branding.min.js', 'utf8')));" > $(JS).tmp
	@ mv $(JS).tmp $(JS)

# the raw / non-working player without branding
raw:
	# raw player
	@ mkdir	-p $(DIST)
	@ cat LICENSE.js | $(SET_VERSION) | $(SET_DATE) > $(JS)
	@ cat node_modules/ie8/build/ie8.js >> $(JS)
	@ echo >> $(JS)
	@ uglifyjs lib/ext/support/embedcode.js --compress >> lib/ext/support/embedcode.min.js
	@ browserify -p browserify-derequire -s flowplayer -t brfs lib/index.js | $(SET_VERSION) | sed "s|@EMBED|$(EMBED)|" | sed "s/@CDN/$(CDN)/" | sed "s/@CDN_PATH/$(CDN_PATH)/" >> $(JS)
	@ rm lib/ext/support/embedcode.min.js


min: concat
	# flowplayer.min.js
	@ uglifyjs $(JS) --comments '/flowplayer.org\/license/' --mangle -c >> $(DIST)/flowplayer.min.js

# make all skins
skin:
	# skins
	@ mkdir -p $(SKIN)
	@ node-sass skin/sass/skin.sass > $(SKIN)/skin.css
	@ cp -r skin/icons $(SKIN)

flash:
	# compile flash
	@ $(SET_VERSION) lib/as/Flowplayer.as > $(DIST)/Flowplayer.as
	@ cp lib/logo/logo.swc $(DIST)
	@ cp lib/as/*.as $(DIST)
	@ cd $(DIST) && $(FLASH_COMPILE) -define=CONFIG::HLS,false -output flowplayer.swf Flowplayer.as -source-path ./
	@ cp deps/flashls.swc $(DIST)
	@ cd $(DIST) && $(FLASH_COMPILE) -define=CONFIG::HLS,true -output flowplayerhls.swf Flowplayer.as -source-path ./ 
	@ cd $(DIST) && rm *.as *.swc


zip: min concat skin flash
	@ cp index.html $(DIST)
	@ cp LICENSE.md $(DIST)
	@ cp deps/embed.min.js $(DIST)
	@ rm -f $(DIST)/flowplayer.zip
	cd $(DIST) && zip -r flowplayer-$(VERSION).zip * -x \*DS_Store

clean:
	# cleaning
	@ rm -rf $(DIST)

deps:
	@ npm install

all: clean zip

# shortcuts
as: flash
js: concat


.PHONY: dist skin deps
