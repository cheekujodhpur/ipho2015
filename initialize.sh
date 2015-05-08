#!/bin/bash

while read -r LINE;do ./add_ip.sh $LINE;done < country_code_ip.txt 

