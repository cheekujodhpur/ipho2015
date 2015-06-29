if [[ $1 == "vote" ]];
then cp u/index_vote.html u/index.html
cp cr/index_vote.html cr/index.html
echo "Changed to mode vote";
fi
if [[ $1 == "marks" ]];
then cp u/index_marks.html u/index.html
cp cr/index_marks.html cr/index.html
echo "Changed to mode marks";
fi
