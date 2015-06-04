#!/bin/bash
#reset password of the ip
inp='db.users.update({"ip":"'$1'"},{$set:{"pass":"ipho2015"}})'
echo $inp
mongo test --eval $inp
