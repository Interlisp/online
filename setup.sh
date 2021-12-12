#!/bin/bash
#
#    Script to finish setting up the online.interllisp.org repo after cloning it from githiub.
#    -- Decrypts all the files that are stored encrypted on githib.
#    -- Restores the node_modules using npm ci
#    -- clones the novnc repo, checks out chosen tag/commit, and then overwrites oio-modified files
#
#    2021-12-09 Frank Halasz
#
cd $HOME/online
if [ "X$1X" == "XX" ]; then
	export LOC=dev
else
	export LOC=$1
fi
read -p "Enter ccrypt passphrase: " -s PSWD
echo
cat web-portal/${LOC}/js/keys.js.cpt | ccdecrypt -E PSWD >web-portal/${LOC}/js/key.js
if [ ${LOC} == "dev" ]; then
	cat docker/sftp/sftp_keys.tar.cpt | ccdecrypt -E PSWD > docker/sftp/sftp_keys.tar
	tar xf docker/sftp/sftp_keys.tar
fi
pushd web-portal/${LOC}/novnc_oio 2>/dev/null
./install_novnc.sh
popd  2>/dev/null
pushd web-portal/dev${LOC}  2>/dev/null
npm ci
popd  2>/dev/null
