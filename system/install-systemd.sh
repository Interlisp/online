#!/bin/bash
if [ $# -lt 2 ]; then echo "docker registry and docker_namespace arguments required"; exit 1; fi
sed  s-:::DOCKER_REGISTRY:::-$1/- <./oio.service | sed s-===DOCKER_NAMESPACE===-$2- >/tmp/oio.service
sudo cp -p /tmp/oio.service /lib/systemd/system/oio.service
sed  s-:::DOCKER_REGISTRY:::-$1/- <./oio-dev.service | sed s-===DOCKER_NAMESPACE===-$2- >/tmp/oio-dev.service
sudo cp -p /tmp/oio-dev.service /lib/systemd/system/oio-dev.service
sudo systemctl daemon-reload
#sudo systemctl enable oio.service
