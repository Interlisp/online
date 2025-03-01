!#/bin/bash
#
#  Install the crontab entry to renew lets encrypt certs
#
#  Frank Halasz 2025-02-28
#
#
if [ ! ${USER} == "root" ]; then
        echo "This script must be run 'sudo'."
        echo "Exiting."
        exit 1
fi
(crontab -l 2>/dev/null; echo "11 13 28 * * /home/ubuntu/online/system/renew_certs.sh") | crontab -

