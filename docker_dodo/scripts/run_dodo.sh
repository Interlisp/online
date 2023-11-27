#!/bin/bash
#  Run dodo online
#  2023-11-23 Frank Halasz
#
#  Copyright 2023 - www.Interlisp.org
#
export HOMEDIR="/dodo"
#
/bin/sed "s#\${HOMEDIR}#${HOMEDIR}#g"                 \
    < ${HOMEDIR}/config/dodo.properties.template      \
    > ${HOMEDIR}/config/dodo.properties
#
ps lax | grep -v grep | grep dev.hawala.hub.NetHub
if [ $? -eq 1 ]; then
    java -cp ${HOMEDIR}/bin/dodoserver-and-nethub.jar \
         dev.hawala.hub.NetHub                        \
         >> ${HOMEDIR}/logs/nethub.log                \
         2>> ${HOMEDIR}/logs/nethub.err               \
         &
fi
#
java -cp ${HOMEDIR}/bin/dodoserver-and-nethub.jar     \
         dev.hawala.xns.DodoServer                    \
         ${HOMEDIR}/config/dodo.properties            \
         -machinecfg:${HOMEDIR}/config/machines.cfg  \
         >> ${HOMEDIR}/logs/dodoserver.log            \
         2>> ${HOMEDIR}/logs/dodoserver.err
#

