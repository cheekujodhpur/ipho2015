#!/usr/bin/env nodejs
/*
server.js file of the Server system for IPhO-2015 India

To run the server,
nodejs server.js

Copyright (c) 2015 Kumar Ayush, Sandesh Kalantre, Sharad Mirani

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use
, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//load the required modules
var express = require('express')
  , app = express()
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , server = http.createServer(app)
  , multer  = require('multer')
  , serve_index = require('serve-index')
  , path = require("path")
  , fs = require("fs-extra")
  , log_timestamp = require('log-timestamp')(function() { return '[ ' + (new Date).toLocaleString() + ' ] %s'});
var io = require('socket.io').listen(server);

//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

//TODO:Is bodyParser used somewhere?
//var bodyParser = require('body-parser');
//app.use(bodyParser());

//file upload
//done stores whether a file has been uploaded to the /tmp folder
var done = false;
var file_size_ex = false;
//uploads the file to /tmp and appends the Date.now() to the file name
app.use(multer(
{ 
    dest: __dirname + '/tmp/',
    limits:
    {
	fileSize:518144,
    },
    rename: function (fieldname, filename) 
    {
        return filename;
    },
    onFileUploadStart: function (file) 
    {
        console.log(file.originalname + ' is sarting to upload.')
    },
    onFileUploadComplete: function (file) 
    {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done = true;
    },
    onFileSizeLimit: function (file) 
	{
        file_size_ex = true;
  		console.log('File size limit exceeded: ', file.originalname)
  		fs.unlink('./' + file.path) // delete the partially written file
    }
}));

//copies the uploaded file from /tmp to the user's home folder
app.post('/uploaded',function(req,res)
{
	if(file_size_ex == true)
	{
		file_size_ex = false;
        done = false;
		res.sendFile(__dirname + '/u/index.html');
        return;
	}
    if(done==true)
 	{
		//the /tmp path of the file
        var temp_path = req.files.user_file.path;
        //the name of the uploaded file with the timestamp
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip
        var new_location = __dirname + '/uploads/'+ req.ip + '/' + file_name;
 

 		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                    console.log(err);
                    return 0;
            }
            var ip = req.ip;
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                                return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + req.ip.toString() + "/");
                        });

                        //redirect the client to his homepage
                        res.sendFile(__dirname + '/u/index.html')
                        done = false;
                    }
                    else
                    {
                        //change to location for uploads for the convener to /downloads
                        new_location = __dirname + '/downloads/' + file_name;
        
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                                return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /downloads/");
                        });

                        //redirect the client to his homepage
                        res.sendFile(__dirname + '/su/index.html')
                        done = false;
                    }
                }
            });
        });
    }
});

//tell node to send the required files when requested
//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
app.get('/static/css/simple-sidebar.css', function(req,res){res.sendFile(__dirname+'/static/css/simple-sidebar.css');});
app.get('/static/css/main.css', function(req,res){res.sendFile(__dirname+'/static/css/main.css');});
app.get('/static/js/jquery.min.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.min.js');});
app.get('/static/js/bootstrap.min.js', function(req,res){res.sendFile(__dirname+'/static/js/bootstrap.min.js');});
app.get('/static/js/Chart.min.js', function(req,res){res.sendFile(__dirname+'/static/js/Chart.min.js');});
app.get('/media/ipho-logo1.png', function(req,res){res.sendFile(__dirname+'/media/ipho-logo1.png');});
app.get('/media/tifr-logo-s.png', function(req,res){res.sendFile(__dirname+'/media/tifr-logo-s.png');});
app.get('/static/fonts/glyphicons-halflings-regular.woff2', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff2');});
app.get('/static/fonts/glyphicons-halflings-regular.woff', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff');});

//authentication page
app.get('/auth.html',function(req,res)
{
	res.sendFile(__dirname + '/auth.html');
});

//change password page
app.get('/chpass.html',function(req,res)
{
	res.sendFile(__dirname + '/chpass.html');
});

//homepage
app.get('/', function (req, res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        var ip = req.ip;
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var collection = db.collection('users');
        collection.find({"ip":ip}).toArray(function(err,items)
        {
            if(items.length == 0)
            {
                return;
            }
            if(items[0].logged)
            {
                if(!items[0].first)
                {
                    res.redirect('/chpass.html');
                }
                var type = items[0].type;
                if(type)
                {
                    //redirect the user to his homepage
                    res.sendFile(__dirname + '/u/index.html');				
                }
                else
                {
                    res.sendFile(__dirname + '/su/index.html');
                }
            }
            else
            res.sendFile(__dirname + '/auth.html');
            db.close();
        });
	});
});


//io
/*
The io between the server and the client is managed by socket.io signals
Signals used in the program:
-------------------------------------------------------------------------------
*syn*

SIGNAL CAUSE:
    'syn' signal is sent when the client is synchronised with the server and the 
user submits a password in auth.html.
TODO:Encrypt this password which currently is being sent as simply text

SIGNAL ACTION:
    On receiving this signal,the server connect to the MongoDB server
and retrieves the 'users' collection.The user's ip sent with is signal 
is first checked of its precense in the database.If the ip is not present NO
RESPONSE is sent.
    If the ip is present,the true-pass(password) is checked with the pass sent
by the user.If the password is correct,then the logged property of the user is set
to true and a 'fin' signal is sent to signify that the syncing is complete.If the 
password is incorrect a 'syn-err' error signal is emmited.
--------------------------------------------------------------------------------

*syn-err*

SIGNAL CAUSE:
    This signal is sent when the user's ip is present in the database but the password
submitted by the user is incorrect.
    
SIGNAL ACTION
    On receiving this signal,auth.html adds to the password input box,the class "has-error".
-------------------------------------------------------------------------------

*fin*

SIGNAL CAUSE:
    This signal is sent when the user's ip is prenset in the database and the password
entered by the user is correct.

SIGNAL ACTION
    On reciving this signal,auth.html redirects the browser to the '/' page.
-------------------------------------------------------------------------------

*end*

SIGNAL CAUSE:
    This signal is sent when the logout button on the index.html page is clicked.

SIGNAL ACTION:
    On receiving the signal,the server connects to the MongoDB server and retrieves
the 'users' collection.The server upadates the logged property of the ip of the user
to false.In the end the server emits a 'end-ack' signal.
-------------------------------------------------------------------------------

*end-ack*
This signal denotes that the end was acknowleged by the server.
SIGNAL CAUSE:
    This signal is sent when an 'end' signal is received by the server.

SIGNAL ACTION:
    On receiving this signal,the index.html page redirects the user to the
'/auth.html' page.
-------------------------------------------------------------------------------

*setvote*

SIGNAL CAUSE:
    This signal is sent by the su's index.html page.Along with the signal,
the body of the question,the options and time are sent as well.

SIGNAL ACTION:
    On reciving this signal,the server generates a random 5 alphanumeric id 
of the question on which the question is stored in the database.The server then
connects to the MongoDB server and retrieves the 'voteq' collection.It inserts the 
body and options of the question in the collection.The server then broadcasts a 
'govote' signal along which it sends the id,body,options and time of the question.
-------------------------------------------------------------------------------

*govote*

SIGNAL CAUSE:
    This signal is BROADCASTED by the server after storing the question in 'voteq'
collection on receiving the 'setvote' signal.

SIGNAL ACTION:
    On receiving this signal,the index.html of the user runs a timer for the time recieved
with the signal.On end of the counter,the 'logvote' signal is emitted along with the id of
the question and the options selected(1 for selected and 0 for not selected).
-------------------------------------------------------------------------------

*logvote*

SIGNAL CAUSE:
    This signal is sent by the index.html of user when the timer for a question has expired.

SIGNAL ACTION:
    On receiving this signal,the server connects to the MongoDB server and retieves the 'voteq'
collection.It updates the corresponding options in the collection according to the users' 
responses.
-------------------------------------------------------------------------------
*voteresults*

SIGNAL CAUSE:
    This signal is sent from the server after a delay of 5000ms after the time of the question
has expired.It signifies that the results must be now displayed.Along with the signal,the number of
votes received and the options themselves are also sent.

SIGNAL ACTION:
    This signal causes the respective index.html pages of both users and super-users to display
the results in the form of a histogram using chartjs.    
*/

var voted = [];	//a global variable which maintains the ip of people who have voted once

io.on('connection',function(socket)
{
    var ip = socket.handshake.address;
    console.log("'message-submit' signal received from " + ip.toString());
    
    var message_table = [];
    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var messages = db.collection('messages');
      
        messages.find({}).toArray(function(err,items)
        {   
            message_table = items;
            io.sockets.emit('message-sent',message_table); 
            console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
            db.close();
        });
    });

    //messages
    socket.on('message-submit',function(message)
    {
        var ip = socket.handshake.address;
        console.log("'message-submit' signal received from" + ip.toString());

        var message_table = [];
        // Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            var messages_archive = db.collection('messages_archive');
         
            //the five letter long alphanumeric id of a question is generated randomly
		    var id = Math.random().toString(36).substr(2,5);
            messages.insert({"id":id,"message":message},function(err,result){});
            messages_archive.insert({"id":id,"time":(new Date).toLocaleString(),"message":message},function(err,result){});
                      

            messages.find({}).toArray(function(err,items)
            {   
                message_table = items;
                io.sockets.emit('message-sent',message_table); 
                console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
                db.close();
            });
       });
       
    });

    socket.on('message-delete',function(id)
    {
        var ip = socket.handshake.address;
        console.log("'message-delete' signal received from " + ip.toString());
        var message_table = [];
		// Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            messages.remove({"id":id},function(err,result){});
            console.log("Message with id: " + id.toString() + " deleted from the database");
            
            messages.find({}).toArray(function(err,items)
            {    
                message_table = items;
                io.sockets.emit('message-sent',message_table);
                console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
                db.close();
            });
       });
    });

    socket.on('message-refresh',function()
    {
        var ip = socket.handshake.address;
        console.log("'message-refresh' signal received from " + ip.toString());
        var message_table = [];
		// Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            messages.remove({},function(err,result){db.close();});
            console.log("All messages deleted from the database in response to " + ip.toString());
             
       });
       io.sockets.emit("message-sent",message_table);
       console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
    });

    //directory listing
    socket.on('list-dir',function(directory_path)
    {
        var ip = socket.handshake.address;
        console.log("'list-dir' signal received from " + ip.toString());
        if(directory_path == "/uploads")
        {
            directory_path = __dirname + "/uploads/" + ip.toString() + "/";
        }
        else
        {
            directory_path = __dirname + "/downloads";
        }
        fs.readdir(directory_path, function(err,files)
        {
            if(err)
            {
                throw err;
            }
        files.map(function(file)
        {
            return path.join(directory_path,file);
        }).filter(function(file)
        {
            return fs.statSync(file).isFile();
        });
        if(directory_path == __dirname + "/downloads")
        {
            id = "download";
            directory_path = "/downloads/";
            socket.emit('listed-dir',id,directory_path,files);
        }
        else
        {
            id = "upload";
            directory_path = "/uploads/" + ip.toString() + "/";
            socket.emit('listed-dir',id,directory_path,files);
        }
        console.log("'listed-dir' signal emmited from server in response to " + ip.toString());
        });
	});
    
    //login
	socket.on('syn',function(pass)
    {
        var ip = socket.handshake.address;
		console.log("'syn' signal received from " + ip.toString());
		// Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
		    collection.find({"ip":ip}).toArray(function(err,items)
		    {
			    var truePass = items[0].pass;
			    if(truePass == pass)
			    {
			
					collection.update({"ip":ip},{$set:{"logged":true}},function(err,result){});
				    socket.emit('fin');
		            console.log("'fin' signal emitted from server in response to " + ip.toString());
			    }
			    else
			    {
				    socket.emit('syn-err');
		            console.log("'syn-err' signal emitted from server in response to " + ip.toString());
			    }
			db.close();
		    });
		});
	});
	
    //logout
	socket.on('end',function()
    {
		var ip = socket.handshake.address;
		console.log("'end' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
            /*
            The ip of the user need not be checked of its existence in the database
            as the user could only have logged in when he was in the database.

            For security purposes,it seems however practical to ensure this redundancy.
            */
		    collection.find({"ip":ip}).toArray(function(err,items)
		    {
		        collection.update({"ip":ip},{$set:{"logged":false}},function(err,result){db.close();});
		    });
            //send the end acknowleged signal
            socket.emit('end-ack');
		    console.log("'end-ack' signal emitted from server in response to " + ip.toString());
		});
	});

	//set vote question
	socket.on('setvote',function(body,options,time)
    {
		var ip = socket.handshake.address;
		console.log("'setvote' signal received from " + ip.toString());
        //the five letter long alphanumeric id of a question is generated randomly
		var id = Math.random().toString(36).substr(2,5);
		//TODO: check for valid id
		
        //Add option 'Abstain'
        options.push('Abstain');

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var question_db = db.collection('voteq');
			var count_db = db.collection('votec');
		    question_db.insert({"id":id,"body":body},function(err,result){});
			count_db.insert({"id":id},function(err,result){});
            
            for(var i = 1;i<=options.length;i++)
            {
			    var query = {};
			    query['opt'+i] = options[i-1];
			    question_db.update({"id":id},{$set:query},function(err,result){});
				query['opt'+i] = 0;
				if(i!=options.length)
			    	count_db.update({"id":id},{$set:query},function(err,result){});
			    else
					count_db.update({"id":id},{$set:query},function(err,result){db.close();});
		    }
		});
		voted = [];
		io.sockets.emit('govote',id,body,options,time);
        console.log("'govote' signal broadcasted from the server in response to " + ip.toString());
		
		//show results
		setTimeout(function(){
			MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    	    {
			    if(err)
			    {
			  		console.log(err);
				    return 0;
			    }
            	console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
				var count_db = db.collection('votec');
				count_db.find({"id":id}).toArray(function(err,items){
						io.sockets.emit('voteresults',items[0],body,options);
						console.log("'voteresults' signal broadcasted from the server for question id: "+id);
				db.close();
				});
			});
        //a 5000ms delay is added to ensure that logvote from all users has been received
		},parseInt(time)*1000+3000);
	});
	
	//receive vote inputs
	socket.on('logvote',function(id,option,option2)
    {
		var ip = socket.handshake.address;
		if(!ip)return;
		if(voted.indexOf(ip)>=0)return; //already voted
		voted.push(ip);
		console.log("'logvote' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('votec');
		    var query = {};
            if(undefined!=option)
            {
                //vote from both users is same
		    	if(option==option2)
		        	query[option] = 2;
			    else{
                    //vote from second user
			    	query[option]=1;
			    	if(undefined!=option2)	//single window votes
			    		query[option2]=1;
			    }
		        collection.update({"id":id},{$inc:query},function(err,result){db.close();});
            }
            else if(undefined!=option2)
            {
                query[option2] = 1;
                collection.update({"id":id},{$inc:query},function(err,result){db.close();});
            }
		});
	});

	socket.on('chpass',function(oldpass,newpass)
    {
		var ip = socket.handshake.address;
		console.log("'chpass' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
			collection.find({"ip":ip}).toArray(function(err,items){
				if(oldpass!=items[0].pass)	//entered the same password
				{
					socket.emit('chpass-err');
        			console.log("'chpass-err' signal broadcasted from the server in response to " + ip.toString());
					db.close();
				}
				else
				{
					var query = {};
					query['pass'] = newpass;
					query['first'] = true;
					collection.update({"ip":ip},{$set:query},function(err,result){db.close();});
					socket.emit('chpass-fin');
        			console.log("'chpass-fin' signal broadcasted from the server in response to " + ip.toString());
				}
			});
		});

	});
	
	socket.on('refresh',function(){
		var ip = socket.handshake.address;
		if(!ip)return;
		console.log("'refresh' signal received from " + ip.toString());
		io.sockets.emit('refreshAll');
	});
});

app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");
app.use("/uploads/192.168.200.155/",express.static(__dirname + "/uploads/192.168.200.155/"));console.log("File download enabled for /uploads/192.168.200.155/");
app.use("/uploads/192.168.200.156/",express.static(__dirname + "/uploads/192.168.200.156/"));console.log("File download enabled for /uploads/192.168.200.156/");
app.use("/uploads/192.168.200.157/",express.static(__dirname + "/uploads/192.168.200.157/"));console.log("File download enabled for /uploads/192.168.200.157/");
app.use("/uploads/192.168.200.158/",express.static(__dirname + "/uploads/192.168.200.158/"));console.log("File download enabled for /uploads/192.168.200.158/");
app.use("/uploads/192.168.200.159/",express.static(__dirname + "/uploads/192.168.200.159/"));console.log("File download enabled for /uploads/192.168.200.159/");
app.use("/uploads/192.168.200.160/",express.static(__dirname + "/uploads/192.168.200.160/"));console.log("File download enabled for /uploads/192.168.200.160/");
app.use("/uploads/192.168.200.161/",express.static(__dirname + "/uploads/192.168.200.161/"));console.log("File download enabled for /uploads/192.168.200.161/");
app.use("/uploads/192.168.200.162/",express.static(__dirname + "/uploads/192.168.200.162/"));console.log("File download enabled for /uploads/192.168.200.162/");
app.use("/uploads/192.168.200.163/",express.static(__dirname + "/uploads/192.168.200.163/"));console.log("File download enabled for /uploads/192.168.200.163/");
app.use("/uploads/192.168.200.164/",express.static(__dirname + "/uploads/192.168.200.164/"));console.log("File download enabled for /uploads/192.168.200.164/");
app.use("/uploads/192.168.200.165/",express.static(__dirname + "/uploads/192.168.200.165/"));console.log("File download enabled for /uploads/192.168.200.165/");
app.use("/uploads/192.168.200.166/",express.static(__dirname + "/uploads/192.168.200.166/"));console.log("File download enabled for /uploads/192.168.200.166/");
app.use("/uploads/192.168.200.167/",express.static(__dirname + "/uploads/192.168.200.167/"));console.log("File download enabled for /uploads/192.168.200.167/");
app.use("/uploads/192.168.200.168/",express.static(__dirname + "/uploads/192.168.200.168/"));console.log("File download enabled for /uploads/192.168.200.168/");
app.use("/uploads/192.168.200.169/",express.static(__dirname + "/uploads/192.168.200.169/"));console.log("File download enabled for /uploads/192.168.200.169/");
app.use("/uploads/192.168.200.170/",express.static(__dirname + "/uploads/192.168.200.170/"));console.log("File download enabled for /uploads/192.168.200.170/");
app.use("/uploads/192.168.200.171/",express.static(__dirname + "/uploads/192.168.200.171/"));console.log("File download enabled for /uploads/192.168.200.171/");
app.use("/uploads/192.168.200.172/",express.static(__dirname + "/uploads/192.168.200.172/"));console.log("File download enabled for /uploads/192.168.200.172/");
app.use("/uploads/192.168.200.173/",express.static(__dirname + "/uploads/192.168.200.173/"));console.log("File download enabled for /uploads/192.168.200.173/");
app.use("/uploads/192.168.200.174/",express.static(__dirname + "/uploads/192.168.200.174/"));console.log("File download enabled for /uploads/192.168.200.174/");
app.use("/uploads/192.168.200.175/",express.static(__dirname + "/uploads/192.168.200.175/"));console.log("File download enabled for /uploads/192.168.200.175/");
app.use("/uploads/192.168.200.176/",express.static(__dirname + "/uploads/192.168.200.176/"));console.log("File download enabled for /uploads/192.168.200.176/");
app.use("/uploads/192.168.200.177/",express.static(__dirname + "/uploads/192.168.200.177/"));console.log("File download enabled for /uploads/192.168.200.177/");
app.use("/uploads/192.168.200.178/",express.static(__dirname + "/uploads/192.168.200.178/"));console.log("File download enabled for /uploads/192.168.200.178/");
app.use("/uploads/192.168.200.179/",express.static(__dirname + "/uploads/192.168.200.179/"));console.log("File download enabled for /uploads/192.168.200.179/");
app.use("/uploads/192.168.200.180/",express.static(__dirname + "/uploads/192.168.200.180/"));console.log("File download enabled for /uploads/192.168.200.180/");
app.use("/uploads/192.168.200.181/",express.static(__dirname + "/uploads/192.168.200.181/"));console.log("File download enabled for /uploads/192.168.200.181/");
app.use("/uploads/192.168.200.182/",express.static(__dirname + "/uploads/192.168.200.182/"));console.log("File download enabled for /uploads/192.168.200.182/");
app.use("/uploads/192.168.200.183/",express.static(__dirname + "/uploads/192.168.200.183/"));console.log("File download enabled for /uploads/192.168.200.183/");
app.use("/uploads/192.168.200.184/",express.static(__dirname + "/uploads/192.168.200.184/"));console.log("File download enabled for /uploads/192.168.200.184/");
app.use("/uploads/192.168.200.185/",express.static(__dirname + "/uploads/192.168.200.185/"));console.log("File download enabled for /uploads/192.168.200.185/");
app.use("/uploads/192.168.200.186/",express.static(__dirname + "/uploads/192.168.200.186/"));console.log("File download enabled for /uploads/192.168.200.186/");
app.use("/uploads/192.168.200.187/",express.static(__dirname + "/uploads/192.168.200.187/"));console.log("File download enabled for /uploads/192.168.200.187/");
app.use("/uploads/192.168.200.188/",express.static(__dirname + "/uploads/192.168.200.188/"));console.log("File download enabled for /uploads/192.168.200.188/");
app.use("/uploads/192.168.200.189/",express.static(__dirname + "/uploads/192.168.200.189/"));console.log("File download enabled for /uploads/192.168.200.189/");
app.use("/uploads/192.168.200.190/",express.static(__dirname + "/uploads/192.168.200.190/"));console.log("File download enabled for /uploads/192.168.200.190/");
app.use("/uploads/192.168.200.191/",express.static(__dirname + "/uploads/192.168.200.191/"));console.log("File download enabled for /uploads/192.168.200.191/");
app.use("/uploads/192.168.200.192/",express.static(__dirname + "/uploads/192.168.200.192/"));console.log("File download enabled for /uploads/192.168.200.192/");
app.use("/uploads/192.168.200.193/",express.static(__dirname + "/uploads/192.168.200.193/"));console.log("File download enabled for /uploads/192.168.200.193/");
app.use("/uploads/192.168.200.194/",express.static(__dirname + "/uploads/192.168.200.194/"));console.log("File download enabled for /uploads/192.168.200.194/");
app.use("/uploads/192.168.200.195/",express.static(__dirname + "/uploads/192.168.200.195/"));console.log("File download enabled for /uploads/192.168.200.195/");
app.use("/uploads/192.168.200.196/",express.static(__dirname + "/uploads/192.168.200.196/"));console.log("File download enabled for /uploads/192.168.200.196/");
app.use("/uploads/192.168.200.197/",express.static(__dirname + "/uploads/192.168.200.197/"));console.log("File download enabled for /uploads/192.168.200.197/");
app.use("/uploads/192.168.200.198/",express.static(__dirname + "/uploads/192.168.200.198/"));console.log("File download enabled for /uploads/192.168.200.198/");
app.use("/uploads/192.168.200.199/",express.static(__dirname + "/uploads/192.168.200.199/"));console.log("File download enabled for /uploads/192.168.200.199/");
app.use("/uploads/192.168.200.200/",express.static(__dirname + "/uploads/192.168.200.200/"));console.log("File download enabled for /uploads/192.168.200.200/");
app.use("/uploads/192.168.200.201/",express.static(__dirname + "/uploads/192.168.200.201/"));console.log("File download enabled for /uploads/192.168.200.201/");
app.use("/uploads/192.168.200.202/",express.static(__dirname + "/uploads/192.168.200.202/"));console.log("File download enabled for /uploads/192.168.200.202/");
app.use("/uploads/192.168.200.203/",express.static(__dirname + "/uploads/192.168.200.203/"));console.log("File download enabled for /uploads/192.168.200.203/");
app.use("/uploads/192.168.200.204/",express.static(__dirname + "/uploads/192.168.200.204/"));console.log("File download enabled for /uploads/192.168.200.204/");
app.use("/uploads/192.168.200.205/",express.static(__dirname + "/uploads/192.168.200.205/"));console.log("File download enabled for /uploads/192.168.200.205/");
app.use("/uploads/192.168.200.206/",express.static(__dirname + "/uploads/192.168.200.206/"));console.log("File download enabled for /uploads/192.168.200.206/");
app.use("/uploads/192.168.200.207/",express.static(__dirname + "/uploads/192.168.200.207/"));console.log("File download enabled for /uploads/192.168.200.207/");
app.use("/uploads/192.168.200.208/",express.static(__dirname + "/uploads/192.168.200.208/"));console.log("File download enabled for /uploads/192.168.200.208/");
app.use("/uploads/192.168.200.209/",express.static(__dirname + "/uploads/192.168.200.209/"));console.log("File download enabled for /uploads/192.168.200.209/");
app.use("/uploads/192.168.200.210/",express.static(__dirname + "/uploads/192.168.200.210/"));console.log("File download enabled for /uploads/192.168.200.210/");
app.use("/uploads/192.168.200.211/",express.static(__dirname + "/uploads/192.168.200.211/"));console.log("File download enabled for /uploads/192.168.200.211/");
app.use("/uploads/192.168.200.212/",express.static(__dirname + "/uploads/192.168.200.212/"));console.log("File download enabled for /uploads/192.168.200.212/");
app.use("/uploads/192.168.200.213/",express.static(__dirname + "/uploads/192.168.200.213/"));console.log("File download enabled for /uploads/192.168.200.213/");
app.use("/uploads/192.168.200.214/",express.static(__dirname + "/uploads/192.168.200.214/"));console.log("File download enabled for /uploads/192.168.200.214/");
app.use("/uploads/192.168.200.215/",express.static(__dirname + "/uploads/192.168.200.215/"));console.log("File download enabled for /uploads/192.168.200.215/");
app.use("/uploads/192.168.200.216/",express.static(__dirname + "/uploads/192.168.200.216/"));console.log("File download enabled for /uploads/192.168.200.216/");
app.use("/uploads/192.168.200.217/",express.static(__dirname + "/uploads/192.168.200.217/"));console.log("File download enabled for /uploads/192.168.200.217/");
app.use("/uploads/192.168.200.218/",express.static(__dirname + "/uploads/192.168.200.218/"));console.log("File download enabled for /uploads/192.168.200.218/");
app.use("/uploads/192.168.200.219/",express.static(__dirname + "/uploads/192.168.200.219/"));console.log("File download enabled for /uploads/192.168.200.219/");
app.use("/uploads/192.168.200.220/",express.static(__dirname + "/uploads/192.168.200.220/"));console.log("File download enabled for /uploads/192.168.200.220/");
app.use("/uploads/192.168.200.221/",express.static(__dirname + "/uploads/192.168.200.221/"));console.log("File download enabled for /uploads/192.168.200.221/");
app.use("/uploads/192.168.200.222/",express.static(__dirname + "/uploads/192.168.200.222/"));console.log("File download enabled for /uploads/192.168.200.222/");
app.use("/uploads/192.168.200.223/",express.static(__dirname + "/uploads/192.168.200.223/"));console.log("File download enabled for /uploads/192.168.200.223/");
app.use("/uploads/192.168.200.224/",express.static(__dirname + "/uploads/192.168.200.224/"));console.log("File download enabled for /uploads/192.168.200.224/");
app.use("/uploads/192.168.200.225/",express.static(__dirname + "/uploads/192.168.200.225/"));console.log("File download enabled for /uploads/192.168.200.225/");
app.use("/uploads/192.168.200.226/",express.static(__dirname + "/uploads/192.168.200.226/"));console.log("File download enabled for /uploads/192.168.200.226/");
app.use("/uploads/192.168.200.227/",express.static(__dirname + "/uploads/192.168.200.227/"));console.log("File download enabled for /uploads/192.168.200.227/");
app.use("/uploads/192.168.200.228/",express.static(__dirname + "/uploads/192.168.200.228/"));console.log("File download enabled for /uploads/192.168.200.228/");
app.use("/uploads/192.168.200.229/",express.static(__dirname + "/uploads/192.168.200.229/"));console.log("File download enabled for /uploads/192.168.200.229/");
app.use("/uploads/192.168.200.230/",express.static(__dirname + "/uploads/192.168.200.230/"));console.log("File download enabled for /uploads/192.168.200.230/");
app.use("/uploads/192.168.200.231/",express.static(__dirname + "/uploads/192.168.200.231/"));console.log("File download enabled for /uploads/192.168.200.231/");
app.use("/uploads/192.168.200.232/",express.static(__dirname + "/uploads/192.168.200.232/"));console.log("File download enabled for /uploads/192.168.200.232/");
app.use("/uploads/192.168.200.233/",express.static(__dirname + "/uploads/192.168.200.233/"));console.log("File download enabled for /uploads/192.168.200.233/");
app.use("/uploads/192.168.200.234/",express.static(__dirname + "/uploads/192.168.200.234/"));console.log("File download enabled for /uploads/192.168.200.234/");
app.use("/uploads/192.168.200.235/",express.static(__dirname + "/uploads/192.168.200.235/"));console.log("File download enabled for /uploads/192.168.200.235/");
app.use("/uploads/192.168.200.236/",express.static(__dirname + "/uploads/192.168.200.236/"));console.log("File download enabled for /uploads/192.168.200.236/");
app.use("/uploads/192.168.200.237/",express.static(__dirname + "/uploads/192.168.200.237/"));console.log("File download enabled for /uploads/192.168.200.237/");
app.use("/uploads/192.168.200.238/",express.static(__dirname + "/uploads/192.168.200.238/"));console.log("File download enabled for /uploads/192.168.200.238/");
app.use("/uploads/192.168.200.239/",express.static(__dirname + "/uploads/192.168.200.239/"));console.log("File download enabled for /uploads/192.168.200.239/");
app.use("/uploads/192.168.200.240/",express.static(__dirname + "/uploads/192.168.200.240/"));console.log("File download enabled for /uploads/192.168.200.240/");
app.use("/uploads/192.168.200.241/",express.static(__dirname + "/uploads/192.168.200.241/"));console.log("File download enabled for /uploads/192.168.200.241/");
app.use("/uploads/192.168.200.242/",express.static(__dirname + "/uploads/192.168.200.242/"));console.log("File download enabled for /uploads/192.168.200.242/");
app.use("/uploads/192.168.200.243/",express.static(__dirname + "/uploads/192.168.200.243/"));console.log("File download enabled for /uploads/192.168.200.243/");
app.use("/uploads/192.168.200.244/",express.static(__dirname + "/uploads/192.168.200.244/"));console.log("File download enabled for /uploads/192.168.200.244/");
app.use("/uploads/192.168.200.245/",express.static(__dirname + "/uploads/192.168.200.245/"));console.log("File download enabled for /uploads/192.168.200.245/");
app.use("/uploads/192.168.200.246/",express.static(__dirname + "/uploads/192.168.200.246/"));console.log("File download enabled for /uploads/192.168.200.246/");
app.use("/uploads/192.168.200.247/",express.static(__dirname + "/uploads/192.168.200.247/"));console.log("File download enabled for /uploads/192.168.200.247/");
app.use("/uploads/192.168.200.248/",express.static(__dirname + "/uploads/192.168.200.248/"));console.log("File download enabled for /uploads/192.168.200.248/");
app.use("/uploads/192.168.200.249/",express.static(__dirname + "/uploads/192.168.200.249/"));console.log("File download enabled for /uploads/192.168.200.249/");
app.use("/uploads/192.168.200.250/",express.static(__dirname + "/uploads/192.168.200.250/"));console.log("File download enabled for /uploads/192.168.200.250/");
app.use("/uploads/192.168.200.251/",express.static(__dirname + "/uploads/192.168.200.251/"));console.log("File download enabled for /uploads/192.168.200.251/");
app.use("/uploads/192.168.200.252/",express.static(__dirname + "/uploads/192.168.200.252/"));console.log("File download enabled for /uploads/192.168.200.252/");
app.use("/uploads/192.168.200.253/",express.static(__dirname + "/uploads/192.168.200.253/"));console.log("File download enabled for /uploads/192.168.200.253/");
app.use("/uploads/192.168.200.254/",express.static(__dirname + "/uploads/192.168.200.254/"));console.log("File download enabled for /uploads/192.168.200.254/");
app.use("/uploads/192.168.200.255/",express.static(__dirname + "/uploads/192.168.200.255/"));console.log("File download enabled for /uploads/192.168.200.255/");
app.use("/uploads/awk {print/",express.static(__dirname + "/uploads/awk {print/"));console.log("File download enabled for /uploads/awk {print/");
app.use("/uploads/awk {print/",express.static(__dirname + "/uploads/awk {print/"));console.log("File download enabled for /uploads/awk {print/");
app.use("/uploads/awk '{print }' country_code_ip.txt/",express.static(__dirname + "/uploads/awk '{print }' country_code_ip.txt/"));console.log("File download enabled for /uploads/awk '{print }' country_code_ip.txt/");
app.use("/uploads/192.168.100.100/",express.static(__dirname + "/uploads/192.168.100.100/"));console.log("File download enabled for /uploads/192.168.100.100/");
