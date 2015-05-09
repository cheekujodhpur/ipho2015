#!/bin/bash

#create the directories
rm -r ./uploads
rm -r ./downloads
mkdir ./uploads
mkdir ./downloads

#drop the old databases
inp1='db.users.drop()'
echo $inp1
mongo test --eval $inp1

inp2='db.uploads.drop()'
echo $inp2
mongo test --eval $inp2
#all the ip
while read -r LINE;do ./add_ip.sh $LINE;done < country_code_ip.txt 

