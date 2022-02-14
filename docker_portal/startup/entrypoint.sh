#!/bin/bash
#
#  Startup for online.interlisp.org web-portal docker container
#
#  Frank Halasz 2022-01-31
#
#  Copyright: 2021-2022 by Interlisp.org 
#
mkdir -p /srv/oio/log
mkdir -p /srv/oio/mongodb
mkdir -p /srv/oio/mongodb/log
mkdir -p /srv/oio/mongodb/db
#
sudo su -m oio <<EOF
export MONGODB_URL="mongodb://%2Fsrv%2Foio-nomount%2Fmongodb%2Fmongodb-27017.sock"
/usr/bin/mongod --config /opt/oio/mongodb/mongodb.conf --fork
EOF
#
cd /opt/oio/web-portal
/usr/bin/node js/server.js
