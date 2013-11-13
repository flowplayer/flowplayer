#!/bin/bash
SUPPORT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
java -jar "$SUPPORT_DIR/BrowserStackTunnel.jar" -f $key $(dirname "$SUPPORT_DIR/../../../") | egrep "http|Error"
