#!/bin/bash
#
# Delete oio v1 volumes
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
  docker volume rm ${emailish}_il
  docker volume rm ${emailish}_home
done
