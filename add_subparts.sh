#!/bin/bash
read -r TYPE;
STR="[";
STR2="[";
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        set $LINE 
        STR+="'"$1"'"','; 
        STR2+="'"$2"'"','; 
    fi  
done 
STR=$STR"]";
STR2=$STR2"]";
echo $STR
echo $STR2
inp='db.subparts.insert({"type":"'$TYPE'","subparts":'$STR',"maxMarks":'$STR2'})'
echo $inp
mongo test --eval $inp
