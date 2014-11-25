export PATH := ./node_modules/.bin/:$(PATH)
# flash compile
MXMLC_VERSION := $(shell mxmlc --version 2>/dev/null)

ifdef MXMLC_VERSION
	FLASH = $(shell which mxmlc)
else
	#FLASH = "/cygdrive/c/Users/gpontavic/workdir/github/AIR_SDK/bin/mxmlc"
	FLASH = "/cygdrive/c/Users/gpontavic/workdir/github/apache_flex_sdk/bin/mxmlc"
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
	@ browserify -s flowplayer lib/index.js | $(SET_VERSION) | sed "s/@EMBED/$(EMBED)/" | sed "s/@CDN/$(CDN)/" | sed "s/@CDN_PATH/$(CDN_PATH)/" >> $(JS)


min: raw
	# flowplayer.min.js
	@ uglifyjs $(JS) --comments '/flowplayer.org\/license/' --mangle -c >> $(DIST)/flowplayer.min.js
	@ cat deps/branding.min.js >> $(DIST)/flowplayer.min.js

# make all skins
skins:
	# skins
	@ mkdir -p $(SKIN)
	@ stylus -c -o $(SKIN) skin/styl/*.styl
	@ sed 's/\.flowplayer/\.minimalist/g' $(SKIN)/minimalist.css >  $(SKIN)/all-skins.css
	@ sed 's/\.flowplayer/\.functional/g' $(SKIN)/functional.css >> $(SKIN)/all-skins.css
	@ sed 's/\.flowplayer/\.playful/g' 	$(SKIN)/playful.css >> 	 $(SKIN)/all-skins.css
	@ cp -r skin/img $(SKIN)


# work on a single skin (watches changes and processes on the background)
skin:
	stylus -c -w -o $(SKIN) skin/styl/$(MAKECMDGOALS).styl

minimalist: skin
functional: skin
playful: skin

flash:
	# compile flash
	@ $(SET_VERSION) lib/as/Flowplayer.as > $(DIST)/Flowplayer.as
	@ cp lib/logo/logo.swc $(DIST)
	@ cp lib/as/*.as $(DIST)
	@ cd $(DIST) && $(FLASH_COMPILE) -define=CONFIG::HLS,false -output flowplayer.swf Flowplayer.as -source-path ./
	@ cp lib/hls/flashls.swc $(DIST)
	@ cd $(DIST) && $(FLASH_COMPILE) -define=CONFIG::HLS,true -output flowplayerhls.swf Flowplayer.as -source-path ./ 
	@ cd $(DIST) && rm *.as *.swc


zip: min concat skins flash
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
