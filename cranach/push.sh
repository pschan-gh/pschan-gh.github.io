#/bin/sh
#

rsync -av --exclude 'tokens' --exclude 'emblems.config' --exclude '*.sh' --exclude 'rsync.sh' --exclude 'cache' --exclude 'content' --exclude 'client' --exclude '*~' --exclude '*tmp*' --exclude 'junk' --exclude 'attic' --exclude '*backup*' --exclude 'ww' * ~/codes/github/cranach-dev/

rsync -av --exclude 'tokens' --exclude 'emblems.config' --exclude '*.sh' --exclude 'rsync.sh' --exclude 'cache' --exclude 'content' --exclude 'client' --exclude '*~' --exclude '*tmp*' --exclude 'junk' --exclude 'attic' --exclude '*backup*' --exclude 'ww' * ~/codes/wb2cranach/

cat ~/codes/js/nodeweaver-dev.1 ./weaver_core.js ~/codes/js/nodeweaver-dev.3 > ~/codes/js/nodeweaver-dev.js
