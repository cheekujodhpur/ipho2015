#!/bin/bash

#create the directories
rm -r ./uploads
rm -r ./downloads
rm -r ./common
rm mk/*1.html
rm mk/*2.html
mkdir ./uploads
mkdir ./downloads
mkdir ./common
mkdir ./common/T1
mkdir ./common/T2
mkdir ./common/T3
mkdir ./common/E1
mkdir ./common/E2
mkdir ./common/E1a
mkdir ./common/E2a
mkdir ./common/C1
mkdir ./common/C2
#copy the contents of server_editable.js to server.js
chmod 777 server.js
cp server_editable.js server.js

#drop the old databases
inp='db.users.drop()'
echo $inp
mongo test --eval $inp

inp='db.subparts.drop()'
echo $inp
mongo test --eval $inp

inp='db.uploads.drop()'
echo $inp
mongo test --eval $inp

inp='db.votec.drop()'
echo $inp
mongo test --eval $inp

inp='db.voteq.drop()'
echo $inp
mongo test --eval $inp

inp='db.messages.drop()'
echo $inp
mongo test --eval $inp

inp='db.messages_archive.drop()'
echo $inp
mongo test --eval $inp

inp='db.fbs.drop()'
echo $inp
mongo test --eval $inp

inp='db.flags.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_T1.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_T2.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_T3.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_E1.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_E2.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_T1.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_T2.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_T3.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_E1.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_E2.drop()'
echo $inp
mongo test --eval $inp

#all the ip
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        ./add_ip.sh $LINE;
    fi    
done < country_code_ip.txt 

./add_subparts.sh <data/t1_subparts.txt
./add_subparts.sh <data/t2_subparts.txt
./add_subparts.sh <data/t3_subparts.txt
./add_subparts.sh <data/e1_subparts.txt
./add_subparts.sh <data/e2_subparts.txt

echo 'app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");' >> server.js
#make server.js read and executable
chmod 555 server.js

#Flag validation
echo "----FLAG VALIDATION----"
./validate_flags.sh
echo "-----------------------"
#data validation
echo "----DATA VALIDATION----"
./validate_data.sh
echo "-----------------------"
