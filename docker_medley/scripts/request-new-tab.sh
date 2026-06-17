#!/bin/bash
#
#    Request (modified) noVNC to open a new tab in its containing browser and load the URL
#    given as the only argment to this script.
#
#    Uses vncconfig and the desktop name setting as the out-of-band channel to get the message from
#    the online server to the client browser running the noVNC modified to process these ot-of-band
#    messages.
#
#    Intended for use by the HELPSYS LispUsers package to open Common Lisp Hyperspec documentation for
#    online.interlisp.org.
#
#    2022-10-11 Frank Halasz
#
#
if [ $(echo $1 | grep -q "online.interlisp.org:3" | echo $?) -eq 0 ]; then nowarn=1; else nowarn=0; fi
URL="5d4f26d9d86696b${nowarn}$1"
OLD_NAME=$(/usr/bin/vncconfig -display ${DISPLAY} -get desktop)
/usr/bin/vncconfig -display ${DISPLAY} -set desktop="${URL}"
/usr/bin/vncconfig -display ${DISPLAY} -set desktop="${OLD_NAME}"


