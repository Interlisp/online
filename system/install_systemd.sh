#!/bin/bash
if [ $# -lt 2 ];
then
    DR=ghcr.io
    DN=interlisp
    echo "docker registry and docker_namespace arguments required";
    echo "Defaulting docker registry to 'ghcr.io' and docker namespace to 'interlisp'"
else
    DR="$1"
    DN="$2"
fi
sed  s-:::DOCKER_REGISTRY:::-${DR}/- <./oio.service | sed s-===DOCKER_NAMESPACE===-${DN}- >/tmp/oio.service
sudo cp -p /tmp/oio.service /lib/systemd/system/oio.service
sed  s-:::DOCKER_REGISTRY:::-${DR}/- <./oio-dev.service | sed s-===DOCKER_NAMESPACE===-${DN}- >/tmp/oio-dev.service
sudo cp -p /tmp/oio-dev.service /lib/systemd/system/oio-dev.service
sudo systemctl daemon-reload
#sudo systemctl enable oio.service
