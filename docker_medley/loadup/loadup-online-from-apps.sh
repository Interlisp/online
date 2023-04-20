#!/bin/bash

#set -x

where_am_i() {

    # call this with ${BASH_SOURCE[0]:-$0} as its (only) parameter

    local SCRIPT_PATH="$1";

    pushd . > '/dev/null';

    while [ -h "$SCRIPT_PATH" ];
    do
        cd "$( dirname -- "$SCRIPT_PATH"; )";
        SCRIPT_PATH="$( readlink -f -- "$SCRIPT_PATH"; )";
    done

    cd "$( dirname -- "$SCRIPT_PATH"; )" > '/dev/null';
    SCRIPT_PATH="$( pwd; )";

    popd  > '/dev/null';

    echo "${SCRIPT_PATH}"
}

if [ -z "${MEDLEY_INSTALLDIR}" ]; then
    echo "This script requires MEDLEY_INSTALLDIR to be set.  It isn't. Exiting."
    exit 1
fi

if [ -z "${NC_INSTALLDIR}" ]; then
    echo "This script requires NC_INSTALLDIR to be set.  It isn't. Exiting."
    exit 1
fi


if [ ! -x ${MEDLEY_INSTALLDIR}/run-medley ] ; then
    echo "MEDLEY_INSTALLDIR is set but \${MEDLEY_INSTALLDIR}/run-medley doesn't exist or is not executable."
    echo "MEDLEY_INSTALLDIR is ${MEDLEY_INSTALLDIR}."
    echo "Exiting."
    exit 1
fi

cd `where_am_i "${BASH_SOURCE[0]:-$0}"`/../..
export ONLINEDIR=`pwd`
export LOADUPDIR=${ONLINEDIR}/docker_medley/loadup

export ROOMSDIR=${MEDLEY_INSTALLDIR}/rooms
export CLOSDIR=${MEDLEY_INSTALLDIR}/clos

export MEDLEYDIR="${MEDLEY_INSTALLDIR}"
export NOTECARDSDIR="${NC_INSTALLDIR}"

if [ -z "${SYSOUTDIR}" ]; then
    export SYSOUTDIR=${MEDLEY_INSTALLDIR}/tmp
fi

cd ${MEDLEY_INSTALLDIR}


scr="-sc 1024x768 -g 1042x790"

mkdir -p tmp
touch tmp/loadup.timestamp

./run-medley $scr -loadup "${LOADUPDIR}/LOADUP-ONLINE.CM" "${MEDLEY_INSTALLDIR}/loadups/apps.sysout"

if [ tmp/online.sysout -nt tmp/loadup.timestamp ]; then
    echo ---- made ----
    ls -l ${SYSOUTDIR}/online.*
    echo --------------
else
    echo XXXXX FAILURE XXXXX
    ls -l ${SYSOUTDIR}/online.*
    exit 1
fi
