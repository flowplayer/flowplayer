
# flash compile
MXMLC_VERSION := $(shell mxmlc --version 2>/dev/null)

ifdef MXMLC_VERSION
	FLASH = $(shell which mxmlc)
else
	FLASH="/opt/flowplayer/flex3sdk/bin/mxmlc"
endif
FLASH_COMPILE=$(FLASH) -static-link-runtime-shared-libraries=true -library-path=.

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
	@ cat deps/branding.min.js >> $(JS)

# the raw / non-working player without branding
raw:
	# raw player
	@ mkdir	-p $(DIST)
	@ cat LICENSE.js | $(SET_VERSION) | $(SET_DATE) > $(JS)
	@ echo	"!function($$) { " >> $(JS)

	@ cat	deps/jquery.browser.js\
			lib/flowplayer.js\
			lib/ext/support.js\
			lib/engine/*.js\
			lib/ext/resolve.js\
			lib/ext/slider.js\
			lib/ext/ui.js\
			lib/ext/keyboard.js\
			lib/ext/fullscreen.js\
			lib/ext/playlist.js\
			lib/ext/cuepoint.js\
			lib/ext/subtitle.js\
			lib/ext/analytics.js\
			lib/ext/mobile.js\
			lib/ext/embed.js | $(SET_VERSION) | sed "s/@EMBED/$(EMBED)/" | sed "s/@CDN/$(CDN)/" | sed "s/@CDN_PATH/$(CDN_PATH)/" >> $(JS)

	@ echo "}(jQuery);" >> $(JS)


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
	@ cp lib/as/Connection.as $(DIST)
	@ cd $(DIST) && $(FLASH_COMPILE) -output flowplayer.swf Flowplayer.as -source-path ./ && rm *.as logo.*


zip: min concat skins flash
	@ cp index.html $(DIST)
	@ cp LICENSE.md $(DIST)
	@ cp deps/embed.min.js $(DIST)
	@ rm -f $(DIST)/flowplayer.zip
	cd $(DIST) && zip -r flowplayer-$(VERSION).zip * -x \*DS_Store

clean:
	# cleaning
	@ rm -rf $(DIST)

all: clean zip

# shortcuts
as: flash
js: concat


.PHONY: dist skin
