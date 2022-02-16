#!/bin/bash
#
#  Convert OIO volumes from V1 to V2 - script for use within the docker container
#  Used with v1-v2.sh, which call the docker container with the right mounts
#
#  Frank Halasz 2022-02-02
#
cp -rpP /tmp/home/* /tmp/newhome
if [ ! -e /tmp/newhome/il/vmem/lisp.virtualmem ]; then
    if [ -e /tmp/il/vmem/lisp.virtualmem ]; then
        cp -p /tmp/il/vmem/lisp.virtualmem /tmp/newhome/il/vmem/lisp.virtualmem
    fi
fi
diff -q -r /tmp/newhome/il /tmp/il
IS_DIFF=$?
if [ $IS_DIFF -eq 0 ];
then
    rm -rf /tmp/newhome/il
    mkdir -p /tmp/newhome/il
    cp -rpP /tmp/il/vmem /tmp/newhome/il
    cp -pP /tmp/il/INIT /tmp/newhome/il
    mkdir -p /tmp/newhome/il/sysout
else
    rm -rf /tmp/newhome/il
    cp -rpP /tmp/il /tmp/newhome/
fi
