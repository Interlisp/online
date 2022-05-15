#!/bin/bash
lastlast2=$(docker images -q ghcr.io/interlisp/online-production:lastlast)
docker tag ghcr.io/interlisp/online-production:last ghcr.io/interlisp/online-production:lastlast
docker tag ghcr.io/interlisp/online-production:latest ghcr.io/interlisp/online-production:last
docker pull ghcr.io/interlisp/online-production:latest
if [ ! -z "${lastlast2}" ]; then docker image rm ${lastlast2}; echo 2 ${lastlast2}; fi


