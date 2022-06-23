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
apt-get update
#
#     Install docker engine from docker repo.
#
apt-get install -y ca-certificates curl wget gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |\
  gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg]\
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |\
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io
usermod -aG docker ubuntu
systemctl enable docker.service
systemctl enable containerd.service
#
#     Create oio directories
#
for sub in development production;
  do
    mkdir -p /srv/oio
    chown ubuntu:ubuntu /srv/oio
    mkdir -p /srv/oio/${sub}
    chown ubuntu:ubuntu /srv/oio/${sub}
    mkdir -p /srv/oio/${sub}/log
    chown ubuntu:ubuntu /srv/oio/${sub}/log
    mkdir -p /srv/oio/${sub}/mongodb
    chown ubuntu:ubuntu /srv/oio/${sub}/mongodb
    mkdir -p /srv/oio/${sub}/mongodb/log
    chown ubuntu:ubuntu /srv/oio/${sub}/mongodb/log
    mkdir -p /srv/oio/${sub}/mongodb/db
    chown ubuntu:ubuntu /srv/oio/${sub}/mongodb/db
  done
#
#  
#
if [ ! -e "/etc/letsencrypt" ]; then mkdir -p /etc/letsencrypt; fi
#
#  Install scripts in ~/bin
#

