#!/bin/bash 
sudo cp ./oio-dev.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable oio-dev.service
