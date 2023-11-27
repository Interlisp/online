#!/bin/bash
docker run -it -p 3333:3333 -p 3333:3333/udp --entrypoint bin/run_dodo.sh dodo_online &

