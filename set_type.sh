#set type of the client for an ip
inp='db.users.update({"ip":"'$1'"},{$set:{"type":$2}})';
echo $inp
mongo test --eval $inp
