#!/bin/bash

watch -n 1 -d 'echo "Users logged in the system";mongo --verbose < users.js | grep -w "ip\|country_name\|country_code\|^\n"'
