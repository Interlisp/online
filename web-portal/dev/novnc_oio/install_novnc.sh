#!/bin/bash
cd ..
git clone https://github.com/novnc/noVNC.git novnc
cd novnc
git remote set-url origin https://github.com/novnc/noVNC.git
git pull origin master
git checkout v1.2.0
cp -p ../novnc_oio/vnc.html vnc.html

