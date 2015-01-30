var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)

var bodyParser = require('body-parser');
app.use(bodyParser());
//tell node to send the required files when requested
app.get('/', function (req, res)
{
    var html = '<script>   var password = prompt("Enter the password","ipho2015"); </script> ';
    res.send(html);
    console.log(req.body);
});
app.post('/', function(req, res)
{    
    console.log(req.body.password);
    var html = req.body.password;
    res.send(html);
});
app.get('/index.html', function (req, res)
{
    res.sendFile(__dirname + '/index.html');
});

//server running at port 8080
app.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');
