#/bin/sh
#

rsync -av --exclude 'tokens' --exclude 'emblems.config' --exclude '*.sh' --exclude 'rsync.sh' --exclude 'cache' --exclude 'content' --exclude 'client' --exclude '*~' --exclude '*tmp*' --exclude 'junk' --exclude 'attic' --exclude '*backup*' --exclude 'ww' --exclude '.*' * ~/codes/github/cranach-carousel/

rsync -av --exclude 'tokens' --exclude 'emblems.config' --exclude '*.sh' --exclude 'rsync.sh' --exclude 'cache' --exclude 'content' --exclude 'client' --exclude '*~' --exclude '*tmp*' --exclude 'junk' --exclude 'attic' --exclude '*backup*' --exclude 'ww' --exclude '.*' * ~/codes/wb2cranach/

cat ~/codes/github/cranach_local/nodeweaver-dev.1 ./weaver_core.js ~/codes/github/cranach_local/nodeweaver-dev.3 > ~/codes/github/cranach_local/nodeweaver-dev.js
