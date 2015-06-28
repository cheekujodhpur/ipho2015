#!/bin/bash

#add ip to the system
#to use this script run it as:
#./app_ip.sh ip
#create the upload directory for the user

mkdir ./uploads/$1
#create entry in the database
inp='db.users.insert({"ip":"'$1'","country_name":"'$2'","country_code":"'$3'","number_of_votes":"'$4'","number_of_students":"'$5'","type":1,"pass":"ipho2015","logged":false,"first":false})'
echo $inp
mongo test --eval $inp
inp='db.uploads.insert({"ip":"'$1'","logged":false,"country_name":"'$2'","country_code":"'$3'","number_of_votes":"'$4'","number_of_students":"'$5'","T1":false,"T2":false,"T3":false,"E1":false,"E2":false,"T1_alert":false,"T2_alert":false,"T3_alert":false,"E1_alert":false,"E2_alert":false,"T1_printed":false,"T2_printed":false,"T3_printed":false,"E1_printed":false,"E2_printed":false,"T1_packed":false,"T2_packed":false,"T3_packed":false,"E1_packed":false,"E2_packed":false})'
echo $inp
mongo test --eval $inp
#enable downloads from the directory in server.js
echo 'app.use("/uploads/'$1'/",express.static(__dirname + "/uploads/'$1'/"));console.log("File download enabled for /uploads/'$1'/");' >> server.js

