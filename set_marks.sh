#set type of the client for an ip
inp='db.marks_T1.update({"ip":"'$1'"},{$set:{"subparts":["1a","1b","1c"],"maxMarks":[10,10,15],"ourMarks":[8,5,4],"leaderMarks":[]}},{upsert:true})';
echo $inp
mongo test --eval $inp
