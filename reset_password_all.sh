#!/bin/bash
#reset password of all ip

while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        ./reset_password.sh $LINE;
    fi    
done < country_code_ip.txt 
