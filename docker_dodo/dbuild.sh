#!/bin/bash
#
#   Build docker image for running Dodo online on online.interlisp.org
#       one arg:  name to be given to image (-t arg to docker build)  default: oio-dev
#
#   2023-11-25 FGH
#
# --no-cache 
export BUILD_DATE=$(date --iso-8601=minutes)
docker build -t dodo_online:latest --build-arg BUILD_DATE=${BUILD_DATE} -f ./Dockerfile_dodo .


