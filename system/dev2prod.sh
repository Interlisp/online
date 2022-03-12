#!/bin/bash
lastlast1=$(docker images -q ghcr.io/interlisp/online-medley:lastlastproduction)
docker tag ghcr.io/interlisp/online-medley:lastproduction ghcr.io/interlisp/online-medley:lastlastproduction
docker tag ghcr.io/interlisp/online-medley:production ghcr.io/interlisp/online-medley:lastproduction
docker tag ghcr.io/interlisp/online-medley:development ghcr.io/interlisp/online-medley:production
if [ ! -z "${lastlast1}" ]; then docker image rm ${lastlast1}; echo 1 ${lastlast1}; fi

#
lastlast2=$(docker images -q ghcr.io/interlisp/online-production:lastlast)
docker tag ghcr.io/interlisp/online-production:last ghcr.io/interlisp/online-production:lastlast
docker tag ghcr.io/interlisp/online-production:latest ghcr.io/interlisp/online-production:last
docker pull ghcr.io/interlisp/online-production:latest 
if [ ! -z "${lastlast2}" ]; then docker image rm ${lastlast2}; echo 2 ${lastlast2}; fi


