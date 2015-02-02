var express = require('express')
  , app = express()
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , server = http.createServer(app);

var io = require('socket.io').listen(server);

//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

var bodyParser = require('body-parser');
app.use(bodyParser());

//tell node to send the required files when requested
app.get('/', function (req, res)
{
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('users');
		collection.find({"ip":req.ip}).toArray(function(err,items)
		{
			if(items[0].logged)
			{
				var type = items[0].type;
				if(type)
				{
					res.sendFile(__dirname + '/u/index.html');
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

app.post('/', function(req, res)
{
	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('users');
		collection.find({"ip":req.ip}).toArray(function(err,items)
		{
			if(items[0].logged)
			{
				var type = items[0].type;
				if(type)
				{
					res.sendFile(__dirname + '/u/index.html');
				}
				else
				{
					res.sendFile(__dirname + '/su/index.html');
				}
			}
			else
			{
				var truePass = items[0].pass;
				if(truePass == req.body.pass)
				{
					collection.update({"ip":req.ip},{$set:{"logged":true}},function(err,result){});
					if(items[0].type)
						res.sendFile(__dirname + '/u/index.html');
					else
						res.sendFile(__dirname + '/su/index.html');
				}
				else
				{
					res.sendFile(__dirname + '/auth.html');
				}
			}
		});
	});
});

//logout and redirect to auth
app.get('/logout.html',function(req,res)
{
	MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('users');
		collection.update({"ip":req.ip},{$set:{"logged":false}},function(err,result){});
		res.sendFile(__dirname + '/auth.html');
	});
});

//io
io.on('connection',function(socket){
	console.log('A connection was made');
	socket.on('setvote',function(body,opt1,opt2,opt3,opt4,time){
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('voteq');
		collection.insert({"body":body,"opt1":opt1,"opt2":opt2,"opt3":opt3,"opt4":opt4,"time":time},function(err,result){});
		io.emit('castvote',body,opt1,opt2,opt3,opt4,time);
		});
	});
});
