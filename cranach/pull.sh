#/bin/sh

rsync -av --exclude '*.config' --exclude '*.sh' --exclude 'conf' --exclude '.git' --exclude 'emblems.config' --exclude 'sync.sh' --exclude 'rsync.sh' --exclude 'cache' --exclude 'content' --exclude 'client' --exclude '*~' --exclude '*tmp*' --exclude 'junk' --exclude 'attic' --exclude '*backup*' --exclude 'ww' ~/codes/github/cranach-dev/* ./

