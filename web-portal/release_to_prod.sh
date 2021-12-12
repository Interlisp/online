#!/bin/bash
#
#   Online.interlisp.org.  Release a dev version to production.
#   Dev version is specified by commit or tag id in git repo.
#   Also completes setup.sh after git repo transfer is complete/
#
#   2021-12-09 Frank Halasz
#
cd ${HOME}/online
export COMMIT="HEAD"
if [ ! "X$1X" == "XX" ]; then
   	COMMIT=$1
fi
mkdir web-portal/newprod
git archive --format=tar ${COMMIT} web-portal/dev | tar --strip-components=2 -C web-portal/newprod -x
echo ${COMMIT} > web-portal/newprod/VERSION.txt
git rev-parse ${COMMIT} >> web-portal/newprod/VERSION.txt
echo >> web-portal/newprod/VERSION.txt
./setup.sh newprod
#rm -rf web-portal/oldprod
#mv web-portal/prod web-portal/oldprod
#mv web-portal/newprod web-portal/prod
#sudo systemctl restart oio.service

