#!/bin/bash

# Archive and delete any Online Medley docker volume for a user that
# has not logged on since a cutoff date (value of $1) specified
# in the YYYY-MM-DD format

# make sure we are running as root
if [ "$(whoami)" != "root" ]
then
  echo "$0 must be run as root"
  echo "Please try again using sudo"
  echo "Exiting"
  exit 1
fi

# define function to translate an email address into the emailish
# that is used to name docker volumes in Medley-Online
emailish() {
  if [ -n "$1" ]
  then
    echo "$1" | sed -e "s#@#.-.#g" -e "s@[!#$%&\'*+/=?^\`{|}~]@-@g"
    return 0
  else
    return 1
  fi
}

# Check if cutoff date has been provided, if not set default to 2023-01-01
if [ -z "$1" ]
then
  cutoff_date="2023-01-01"
else
  cutoff_date=$(date -d "$1" "+%Y-%m-%d")
  if [ $? -ne 0 ]
  then
    echo "Error first argument is not a valid date"
    echo "Exiting"
    exit 1
    echo
  fi
fi
echo "Cutoff date is ${cutoff_date}"

# other params
cutoff=$(date -d "${cutoff_date}" +%s)
vols_dir="/var/lib/docker/volumes"
tarfile=oio_volumes_archive_pre${cutoff_date}.tar
tardir="$(pwd)"
rm_file="/tmp/archive-$$"

# Loop thru list of regsitered users and archive & note the docker volume
# for any user who has not logged in on or after the cutoff date
ctr=0
cd ${vols_dir}
for line in $(/home/ubuntu/bin/oio users list | tail -n +3 )
do
  if [ ${ctr} -eq 2 ]
  then
    lastlog="${line}"
    if [ "${lastlog}" = "xxxx-xx-xx" ]
    then
      lastlog="1969-12-31"
    fi
  fi
  if [ ${ctr} -eq 3 ]
  then
    user_emailish="$(emailish ${line})"
  fi
  ctr=$(expr ${ctr} + 1)
  if [ ${ctr} -ge 4 ]
  then
    ctr=0
    if [ $(date -d "${lastlog}" +%s) -lt ${cutoff} ]
    then
      vol="${user_emailish}_home.v2"
      if [ -e  "${vol}" ]
      then
        echo -n "${lastlog} "
        echo $(du -m -s "${vol}")
        tar -rf "${tardir}/${tarfile}" "${vol}"
        echo "${vol}" >>"${rm_file}"
      fi
    fi
  fi
done


# if called for, then delete volumes that have been archived
if [ "$2" = "delete" ]
then
  while read -r vol
  do
    docker volume rm "${vol}"
  done < "${rm_file}"
fi

# Clean-up
rm "${rm_file}"

# exit
echo Done
exit 0

