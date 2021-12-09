#!/bin/bash
#
#   Build docker image for runninguse by the online.interlisp.org web-portal
#       one arg:  name to be given to image (-t arg to docker build)  default: oio-dev
#
#   2021-11-11 FGH
#
export FROM_TAG=$(docker images | grep medley | grep -v latest | head -1 |awk '{print $2}')
if [ -z ${FROM_TAG} ]; then
	echo "Can't find medley docker image"
	exit 1
fi
export BUILD_DATE=$(date --iso-8601=minutes)
if [ ${DEV_OR_PROD} == "prod" ]; then
    NAME=oio-prod
    CACHE=--no-cache
else
    NAME=oio-dev
    CACHE=""
fi

docker build ${CACHE} -t ${NAME} --build-arg FROM_TAG=${FROM_TAG} --build-arg BUILD_DATE=${BUILD_DATE} -f ./Dockerfile .


