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

//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
app.get('/static/css/main.css', function(req,res){res.sendFile(__dirname+'/static/css/main.css');});
app.get('/static/js/jquery.min.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.min.js');});
app.get('/static/js/bootstrap.min.js', function(req,res){res.sendFile(__dirname+'/static/js/bootstrap.min.js');});
app.get('/media/ipho-logo1.png', function(req,res){res.sendFile(__dirname+'/media/ipho-logo1.png');});
app.get('/media/tifr-logo-s.png', function(req,res){res.sendFile(__dirname+'/media/tifr-logo-s.png');});
app.get('/static/fonts/glyphicons-halflings-regular.woff2', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff2');});
app.get('/static/fonts/glyphicons-halflings-regular.woff', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff');});

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
			if(items.length==0)return;
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

//io
io.on('connection',function(socket){
	//login
	socket.on('syn',function(pass){
		var ip = socket.request.connection.remoteAddress;
		// Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('users');
		collection.find({"ip":ip}).toArray(function(err,items)
		{
			var truePass = items[0].pass;
			if(truePass == pass)
			{
				collection.update({"ip":ip},{$set:{"logged":true}},function(err,result){});
				socket.emit('fin');
			}
			else
			{
				socket.emit('syn-err');
			}
		});
		});

	});
	
	//logout
	socket.on('end',function(){
		var ip = socket.request.connection.remoteAddress;
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('users');
		collection.update({"ip":ip},{$set:{"logged":false}},function(err,result){});
		socket.emit('end-ack');
		});
	});

	//set vote question
	socket.on('setvote',function(body,options,time){
		var id = Math.random().toString(36).substr(2,5);
		//TODO: check for valid id
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('voteq');
		collection.insert({"id":id,"body":body},function(err,result){});
		for(var i = 1;i<=options.length;i++){
			var query = {};
			query['opt'+i] = 0;
			collection.update({"id":id},{$set:query},function(err,result){});
		}
		});
		socket.broadcast.emit('govote',id,body,options,time);
	});
	
	//receive vote inputs
	socket.on('logvote',function(id,option){
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db){
		if(err)
		{
			console.log(err);
			return 0;
		}
		var collection = db.collection('voteq');
		var query = {};
		query[option] = 1;
		collection.update({"id":id},{$inc:query},function(err,result){});
		});
	});
});
