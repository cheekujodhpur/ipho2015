#!/bin/bash

#add ip to the system
#to use this script run it as:
#./app_ip.sh ip
#create the upload directory for the user

#mkdir ./uploads/$1
#create entry in the database
#inp='db.users.insert({"ip":"'$1'","country_name":"'$2'","country_code":"'$3'","number_of_votes":"'$4'","type":1,"pass":"ipho2015","logged":false,"first":false})'
#echo $inp
#mongo test --eval $inp
inp='db.uploads.insert({"ip":"'$1'","country_name":"'$2'","country_code":"'$3'","T1":false,"T2":false,"T3":false,"E":false})'
echo $inp
mongo test --eval $inp
#enable downloads from the directory in server.js
#echo 'app.use("/uploads/'$1'/",express.static(__dirname + "/uploads/'$1'/"));console.log("File download enabled for /uploads/'$1'/");' >> server.js

