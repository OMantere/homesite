#!/bin/bash
cd /home/web/app &&
git fetch --all &&
git reset --hard origin/master &&
mkdir sessions &&
chown -R web /home/web &&
systemctl restart appserver.service 
