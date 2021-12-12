#!/bin/bash
export TAG=v1.2.0
cd ..
git clone https://github.com/novnc/noVNC.git novnc
cd novnc
git remote set-url origin https://github.com/novnc/noVNC.git
git pull origin master
git checkout ${TAG}
cp -p ../novnc_oio/vnc.html vnc.html
cp -p ../novnc_oio/ui.js app/ui.js
cp -p ../novnc_oio/rfb.js core/rfb.js
cp -p ../novnc_oio/Interlisp-FavIcon-* app/images/icons

