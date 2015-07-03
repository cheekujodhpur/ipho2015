#!/bin/bash

awk '{if ($3 != "NULL") {print $2}}' country_code_ip.txt | sed 's/$/\.png/' | sort > country_names.txt
ls ./media/flags/ > country_flags.txt

if diff country_names.txt country_flags.txt > /dev/null; then
    echo "Flag validation successful."
else
    diff -y country_names.txt country_flags.txt
    echo "Flag validation failed."
fi
rm country_names.txt
rm country_flags.txt

