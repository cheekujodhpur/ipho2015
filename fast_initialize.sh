#USE ONLY IN DEVELOPMENT
#copies server_editable.js to server.js
#copy the contents of server_editable.js to server.js
chmod 777 server.js
cp server_editable.js server.js
echo "server.js modified from server_editable.js"
chmod 555 server.js
