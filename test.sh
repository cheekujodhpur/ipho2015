#!/bin/bash
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        echo "$LINE";
    fi    
done < country_code_ip.txt 
