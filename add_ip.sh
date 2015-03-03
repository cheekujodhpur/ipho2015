#!/bin/bash

#add ip to the system
#to use this script run it as:
#./app_ip.sh ip

#create the upload directory for the user
mkdir ./uploads/$1
#create entry in the database
mongo test --eval 'db.users.insert({"ip":"$1","type":0,"pass":"shire","logged":true,"first":true})'
#enable downloads from the directory in server.js
echo "app.use("/uploads/$1/",express.static(__dirname + '/uploads/$1/'));console.log("File download enabled for /uploads/$1/");" >> server.js

