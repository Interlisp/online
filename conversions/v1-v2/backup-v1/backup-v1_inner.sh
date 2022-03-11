#!/bin/bash
#
#  Backup OIO volumes from V1 (both _il and _home) - script for use within the docker container
#  Used with backup-v1.sh, which call the docker container with the right mounts
#
#  Frank Halasz 2022-02-02
#
tar -czf /tmp/backups/V1_backup_${EMAILISH}.tar.gz -C /tmp/bazzle .
