#!/bin/bash

awk '{if ($3 != "NULL"){print $2,$4,$5}}' country_code_ip.txt | sort > country_data_temp.txt
if diff country_data_temp.txt final_data.txt > /dev/null; then
    echo "Data validation successful."
else
    echo "country_data_temp.txt final_data.txt"
    diff -y country_data_temp.txt final_data.txt
    echo "Data validation failed."
fi
rm country_data_temp.txt
