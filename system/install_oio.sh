#!/bin/bash
cp -p ~/online/system/oio.sh ~/bin/oio.sh
chmod ugo+x ~/bin/oio.sh
if [ ! -e ~/bin/oio ]; then ln -s ~/bin/oio.sh ~/bin/oio; fi
if [ ! -e ~/bin/oio-dev ]; then ln -s ~/bin/oio.sh ~/bin/oio-dev; fi

