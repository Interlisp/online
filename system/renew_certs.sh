#!/bin/bash
#
#  Script to be called from crontab to renew Let's Encrypt certificates
#  for online.interlisp.org, notecards.online and files.interlisp.org
#
#  Must be called from root.
#
#
#  Frank Halasz 2025-02-28
#
#
/usr/bin/systemctl stop oio.service
/usr/bin/systemctl stop oio-dev.service
/usr/bin/certbot renew
/usr/bin/systemctl start oio.service
/usr/bin/systemctl start oio-dev.service

