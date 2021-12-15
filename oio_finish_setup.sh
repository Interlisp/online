#!/bin/bash
#
#    Script to finish setting up the online.interllisp.org repo after cloning it from githiub.
#    -- Decrypts all the files that are stored encrypted on githib.
#    -- Restores the node_modules using npm ci
#    -- clones the novnc repo, checks out chosen tag/commit, and then overwrites oio-modified files
#
#    2021-12-09 Frank Halasz
#
OIO_PROD_DIR=/opt/oio
OIO_DEV_DIR=${HOME}/online
#
#   Check the args
#
if [ "X$1X" == "XX" ]; then
	echo "Usage: $0 <directory to be set up>"
	exit 1
fi
DIR_2BSETUP=$1
if [ ! -e "${DIR_2BSETUP}" ]; then
	echo "Directory '${DIR_2BSETUP}' does not exist.  Exiting."
	exit 1
fi
if [ ! -d "${DIR_2BSETUP}" ]; then
	echo "'${DIR_2BSETUP}' exists but is not a directory.  Exiting."
	exit 1
fi
if [ ! -f "${DIR_2BSETUP}/oio_finish_setup.sh" ]; then
	echo "'${DIR_2BSETUP}' does not appear to be an OIO directory since oio_finish_setup.sh does not exist.  Exiting."
	exit 1
fi
#
#   Get the decryption password
#
read -p "Enter ccrypt passphrase: " -s PSWD
echo
#
#   setup novnc
#
cat ${DIR_2BSETUP}/js/keys.js.cpt | ccdecrypt -E PSWD > ${DIR_2BSETUP}/js/key.js
pushd ${DIR_2BSETUP}/novnc_oio 2>/dev/null
./install_novnc.sh
popd  2>/dev/null
#
#   setup node_modules
#
pushd ${DIR_2BSETUP}  2>/dev/null
npm ci
popd  2>/dev/null
#
#   If in the dev environment - finish docker setup
#
function do_docker {
	cat docker/sftp/sftp_keys.tar.cpt | ccdecrypt -E PSWD > docker/sftp/sftp_keys.tar
	tar xf docker/sftp/sftp_keys.tar
}
if [[ -d "${DIR_2BSETUP}/../docker" && -d "${DIR_2BSETUP}/../docker/sftp" ]]; then
	pushd "${DIR_2BSETUP}/../" 2>/dev/null
	do_docker
	popd  2>/dev/null
elif [[ -d "${DIR_2BSETUP}/../../docker" && -d "${DIR_2BSETUP}/../../docker/sftp" ]]; then
	pushd "${DIR_2BSETUP}/../../" 2>/dev/null
	do_docker
	popd  2>/dev/null
fi
#
#  Make sure log dir exists
#
if [! -e "${DIR_2BSETUP}/../log" ]; then
	mkdir ${DIR_2BSETUP}/../log
fi
#
#
#
echo "Setup complete."
