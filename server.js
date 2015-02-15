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
  , serve_index = require('serve-index');

var io = require('socket.io').listen(server);

//required to allow file downloads
app.use(express.static(__dirname + '/'));

//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

//TODO:Is bodyParser used somewhere?
//var bodyParser = require('body-parser');
//app.use(bodyParser());

//file upload
//done stores whether a file has been uploaded to the /tmp folder
var done = false;
var fs = require("fs-extra");

//uploads the file to /tmp and appends the Date.now() to the file name
app.use(multer(
{ 
    dest: __dirname + '/tmp/',
    rename: function (fieldname, filename) 
    {
        return filename + Date.now();
    },
    onFileUploadStart: function (file) 
    {
        console.log(file.originalname + ' is sarting to upload.')
    },
    onFileUploadComplete: function (file) 
    {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done = true;
    }
}));

//copies the uploaded file from /tmp to the user's home folder
app.post('/uploaded',function(req,res)
{
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        //the name of the uploaded file with the timestamp
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip
        var new_location = __dirname + '/home/'+ req.ip + '/' + file_name;
       
        //copy the file to the new_location from the temp_path 
        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
        {
            if (err) 
            {
                return console.error(err);
            }
            //print the uploaded file metadata on the console
            console.log(req.files.user_file);
            console.log(file_name + " successfully copied to /home/" + req.ip.toString() + "/");
        });

        //redirect the client to his homepage
        //TODO:IS IT POSSIBLE TO REDIRECT DIRECTLY TO THE UPLOAD TAB?
        res.redirect('/home/' + req.ip + "/#upload")
        done = false;
    }
});

//tell node to send the required files when requested
//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
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

//homepage
app.get('/', function (req, res)
{
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + req.ip.toString());
		var collection = db.collection('users');
		collection.find({"ip":req.ip}).toArray(function(err,items)
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
                    //redirect the user to his homepage
					res.redirect('/home/' + req.ip + "/");				
				}
				else
				{
                    res.sendFile(__dirname + '/su/index.html');
				}
			}
			else
    	    res.sendFile(__dirname + '/auth.html');
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
	//login
	socket.on('syn',function(pass)
    {
        var ip = socket.request.connection.remoteAddress;
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
		    });
		});
	});
	
    //logout
	socket.on('end',function()
    {
		var ip = socket.request.connection.remoteAddress;
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
		        collection.update({"ip":ip},{$set:{"logged":false}},function(err,result){});
		    });
            //send the end acknowleged signal
            socket.emit('end-ack');
		    console.log("'end-ack' signal emitted from server in response to " + ip.toString());
		});
	});

	//set vote question
	socket.on('setvote',function(body,options,time)
    {
		var ip = socket.request.connection.remoteAddress;
		console.log("'setvote' signal received from " + ip.toString());
        //the five letter long alphanumeric id of a question is generated randomly
		var id = Math.random().toString(36).substr(2,5);
		//TODO: check for valid id
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
			    count_db.update({"id":id},{$set:query},function(err,result){});
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
						io.sockets.emit('voteresults',items[0],options);
						console.log("'voteresults' signal broadcasted from the server for question id: "+id);
				});
			});
        //a 5000ms delay is added to ensure that logvote from all users has been received
		},parseInt(time)*1000+5000);
	});
	
	//receive vote inputs
	socket.on('logvote',function(id,option,option2)
    {
		var ip = socket.request.connection.remoteAddress;
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
			if(option==option2)
		    	query[option] = 2;
			else{
				query[option]=1;
				if(undefined!=option2)	//single window votes
					query[option2]=1;
			}
		    collection.update({"id":id},{$inc:query},function(err,result){});
		});
	});
});

//directory listing
/*
Each user has a directory located at '/home/ip'
However the index.html files are located at /u/index.html.This distinction
was done to ensure that each user has the same index file.The directory listing
is done by the serve-index package.
*/
//ADD app.use with the given syntax if we have to add another ip to the system
//ALSO the mongo database must also be simultaneously updated
app.use('/home/127.0.0.1/',serve_index(__dirname + '/home/127.0.0.1/',{'template':__dirname + '/u/index.html','icons': true,'view':'details'}));
console.log("Directory listing enabled for /home/127.0.0.1/");
for(i = 0;i < 100;i++)
{
    app.use('/home/192.168.1.' + i.toString(),serve_index(__dirname + '/home/192.168.1.' + i.toString()) );
    console.log("Directory listing enabled for /home/192.168.1." + i.toString());
} 
