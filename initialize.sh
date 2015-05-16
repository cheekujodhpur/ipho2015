#!/bin/bash

#create the directories
rm -r ./uploads
rm -r ./downloads
mkdir ./uploads
mkdir ./downloads
#copy the contents of server_editable.js to server.js
chmod 777 server.js
cp server_editable.js server.js


#drop the old databases
inp='db.users.drop()'
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

#all the ip
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        ./add_ip.sh $LINE;
    fi    
done < country_code_ip.txt 

echo 'app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");' >> server.js
#make server.js read and executable
chmod 555 server.js
