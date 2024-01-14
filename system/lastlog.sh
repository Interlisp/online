#!/bin/bash


emailish() {
  if [ -n "$1" ]
  then
    echo "$1" | sed -e "s#@#.-.#g" -e "s@[!#$%&\'*+/=?^\`{|}~]@-@g"
    return 0
  else
    return 1
  fi
}

cutoff=$(date -d "2023-01-01" +%s)

ctr=0
for line in $(/home/ubuntu/bin/oio users list | tail -n +3 | grep -v "xxxx-xx-xx" | grep -v "1969-12-31")
do
  if [ $ctr -eq 2 ]
  then
    lastlog="$line"
  fi
  if [ $ctr -eq 3 ]
  then
    user_emailish="$(emailish $line)"
  fi
  ctr=$(expr $ctr + 1)
  if [ $ctr -ge 4 ]
  then
    ctr=0
    if [ $(date -d "$lastlog" +%s) -lt $cutoff ]
    then
      if [ -e /var/lib/docker/volumes/${user_emailish}_home.v2 ]
      then
        echo -n $(du -m -s /var/lib/docker/volumes/${user_emailish}_home.v2)
        echo " " "$user_emailish"
      fi
    fi
  fi
done


