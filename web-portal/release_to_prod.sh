#!/bin/bash
#
#   Online.interlisp.org.  Release a dev version to production.
#   Dev version is specified by commit or tag id in git repo.
#   Also completes setup.sh after git repo transfer is complete/
#
#   2021-12-09 Frank Halasz
#
OIO_PROD_DIR=/srv/oio
OIO_DEV_DIR=${HOME}/online
NEW_INSTALL_DIR=${OIO_PROD_DIR}/next
LIVE_INSTALL_DIR=${OIO_PROD_DIR}/live
OLD_INSTALL_DIR=${OIO_PROD_DIR}/previous
OIO_LOG_FILE=${OIO_PROD_DIR}/log/production.log
#
#
export COMMIT="HEAD"
if [ -n "$1" ]; then
   	COMMIT=$1
fi
#
#
if [ -e ${NEW_INSTALL_DIR} ]; then
    rm -rf ${NEW_INSTALL_DIR}
fi
mkdir -p ${NEW_INSTALL_DIR}
#
#
pushd ${OIO_DEV_DIR} 2>/dev/null
git archive --format=tar ${COMMIT} web-portal/dev | tar --strip-components=2 -C ${NEW_INSTALL_DIR} -x
echo ${COMMIT} > ${NEW_INSTALL_DIR}/VERSION.txt
git rev-parse ${COMMIT} >> ${NEW_INSTALL_DIR}/VERSION.txt
echo >> ${NEW_INSTALL_DIR}/VERSION.txt
./oio_finish_setup.sh ${NEW_INSTALL_DIR}
#
#
#
#rm -rf ${OLD_INSTALL_DIR}
#mv ${LIVE_INSTALL_DIR} ${OLD_INSTALL_DIR}
#mv ${NEW_INSTALL_DIR} ${LIVE_INSTALL_DIR}
#sudo systemctl stop oio.service
#echo "vvvvvvvvvvvvvvvvvvvvvvv NEW VERSION vvvvvvvvvvvvvvvvvvvvvvv" >> ${OIO_LOG_FILE}
#cat ${LIVE_INSTALL_DIR}/VERSION.txt >> ${OIO_LOG_FILE}
#cat "^^^^^^^^^^^^^^^^^^^^^^^^ NEW VERSION ^^^^^^^^^^^^^^^^^^^^^^^^"
#sudo systemctl start oio.service
