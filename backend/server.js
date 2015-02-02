var express = require('express')
  , app = express()
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , server = http.createServer(app)

var bodyParser = require('body-parser');
app.use(bodyParser());


//tell node to send the required files when requested
app.get('/', function (req, res)
{
    res.sendFile(__dirname + '/auth.html');
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
			var truePass = items[0].pass;
			if(truePass == req.body.pass)
				res.sendFile(__dirname + '/index.html');
			else
				res.sendFile(__dirname + '/auth.html');

		});
	});
});
app.get('/index.html', function (req, res)
{
    res.sendFile(__dirname + '/index.html');
});

//server running at port 8080
app.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');
