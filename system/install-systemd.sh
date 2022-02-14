#!/bin/bash
if [ $# -lt 2 ]; then echo "docker registry and docker_namespace arguments required"; exit 1; fi
#sudo (sed  s-:::DOCKER_REGISTRY:::-$1/- <./oio.service | sed s-^^^DOCKER_NAMESPACE^^^-$2- >/lib/systemd/system/oio.service)
sudo (sed  s-:::DOCKER_REGISTRY:::-$1/- <./oio-dev.service | sed s-^^^DOCKER_NAMESPACE^^^-$2- >/lib/systemd/system/oio-dev.service)
sudo systemctl daemon-reload
#sudo systemctl enable oio.service
