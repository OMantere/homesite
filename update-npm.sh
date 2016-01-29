#!/bin/bash
cd /home/web/app &&
git fetch --all &&
git reset --hard origin/master &&
npm install &&
cd scrape-oodi &&
npm install &&
cd ../ &&
mkdir -p sessions &&
chown -R web /home/web &&
systemctl restart appserver.service 
