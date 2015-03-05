#counts number of connections on mongodb
mongostat | awk -F ' *' '$19 ~ /^[0-9]+$/ { print "Number of connections: "$19 }'
