#!/bin/bash 
sudo cp ./oio.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable oio.service
