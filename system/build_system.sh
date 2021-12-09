#!/bin/bash
#
#     Build-up server for online.interlisp.org fromstarting from the Ubuntu 20.04 AMI on AWS EC2. 
#
#     2021-11-14 Frank Halasz
#
#     Note: This script must be run "sudo"
#


#
#     Check we're running sudo
#
if [ ! ${USER} == "root" ]; then
	echo "This script must be run 'sudo'."
	echo "Exiting."
	exit 1
fi

#
#     The basics
#
apt update
apt-get install -y build-essential
#
#    Install ccrypt
#
apt-get install -y ccrypt
#
#     Install docker engine from docker repo.
#
apt install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |\
  gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg]\
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |\
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io
systemctl enable docker.service
systemctl enable containerd.service
#
#     Install node.js
#
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs
#
#     Install Python 2.7 (required by Cloud 9
#
apt-add-repository universe
apt update
apt install -y python2-minimal
#
#     Install Cloud9 IDE
#
curl -L https://raw.githubusercontent.com/c9/install/master/install.sh | bash
#
#     Install Mongo DB
#
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" |\
  tee /etc/apt/sources.list.d/mongodb-org-5.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod.service
systemctl start mongod.service
#
#     Install required node packages
#

