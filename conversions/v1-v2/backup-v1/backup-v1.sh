#!/bin/bash
#
# Backup oio v1 volumes
#
# 2022-02-02 Frank Halasz
#
if [ $# -ne 1 ];
then
   echo "Requires 1 arg: either 'all' or an emailish"
   exit 1
fi
if [ "$1" = "all" ]; 
then
   dolist=$(docker volume ls | grep _il | awk '{ print $2 }' | sed s/_il$// )
else
    dolist=$1
fi
for emailish in $dolist; do
  echo $emailish
  docker run --rm -d \
    --env "EMAILISH=${emailish}" \
    --mount type=volume,source=${emailish}_home,target=/tmp/bazzle/home \
    --mount type=volume,source=${emailish}_il,target=/tmp/bazzle/il \
    --mount type=bind,source=/home/ubuntu/backups,target=/tmp/backups \
    backup-v1:latest
done
