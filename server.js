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


var ObjectID = require('mongodb').ObjectID;
//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

//file upload
//done stores whether a file has been uploaded to the /tmp folder
var done = false;
//stores whether the file size limit has been exceded or not
var file_size_ex = false;
//uploads the file to /tmp  
app.use(multer(
{ 
    dest: __dirname + '/tmp/',
    limits:
    {
        //MAX FILESIZE 100MB
	    fileSize:104857600,
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

//tell node to send the required files when requested
//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
app.get('/static/css/simple-sidebar.css', function(req,res){res.sendFile(__dirname+'/static/css/simple-sidebar.css');});
app.get('/static/css/main.css', function(req,res){res.sendFile(__dirname+'/static/css/main.css');});
app.get('/static/js/jquery.min.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.min.js');});
app.get('/static/js/bootstrap.min.js', function(req,res){res.sendFile(__dirname+'/static/js/bootstrap.min.js');});
app.get('/static/js/knockout-2.2.0.js', function(req,res){res.sendFile(__dirname+'/static/js/knockout-2.2.0.js');});
app.get('/static/js/jquery.tablesorter.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.tablesorter.js');});
app.get('/static/js/Chart.min.js', function(req,res){res.sendFile(__dirname+'/static/js/Chart.min.js');});
app.get('/media/ipho-logo1.png', function(req,res){res.sendFile(__dirname+'/media/ipho-logo1.png');});
app.get('/media/favicon.ico', function(req,res){res.sendFile(__dirname+'/media/favicon.ico');});
app.get('/media/tifr-logo-s.png', function(req,res){res.sendFile(__dirname+'/media/tifr-logo-s.png');});
app.get('/static/fonts/glyphicons-halflings-regular.woff2', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff2');});
app.get('/static/fonts/glyphicons-halflings-regular.woff', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff');});

app.use("/media",express.static(__dirname + "/media"));console.log("File download enabled for /media");
app.use("/static",express.static(__dirname + "/static"));console.log("File download enabled for /static");
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
            return;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var collection = db.collection('users');
        collection.find({"ip":ip}).toArray(function(err,items)
        {
            if(items.length == 0)
            {
                return;
            }
            if(items[0].logged)
            {
                //if client is not logged in send him to chpass.html
                if(!items[0].first)
                {
                    res.redirect('/chpass.html');
                }

                //if client is logged in then determine his type and send him to the corresponding page
                var type = items[0].type;
                if(type == 0)
                {
                    res.sendFile(__dirname + '/su/index.html');				
                }
                else if(type == 1)
                {
                    res.sendFile(__dirname + '/u/index.html');
                }
                else if(type == 2)
                {
                    res.sendFile(__dirname + '/pr/index.html');
                }
                else
                {
                    res.sendFile('/chpass.html');
                    console.log("User type not recognised for the " + ip);
                }
            }
            else
            {
                res.sendFile(__dirname + '/auth.html');
            }
            db.close();
        });
        
	});
});

app.post('/save_mark_T1',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        for(var i in jsonData)
            dbData.push(parseFloat(jsonData[i]));
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var marks = db.collection('marks_T1');
            marks.update({"ip":ip},{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                res.json({"success":true});
                db.close();});
        });
    });
});
app.post('/save_mark_T2',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        for(var i in jsonData)
            dbData.push(parseFloat(jsonData[i]));
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var marks = db.collection('marks_T2');
            marks.update({"ip":ip},{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                res.json({"success":true});
                db.close();});
        });
    });
});
app.post('/save_mark_T3',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        for(var i in jsonData)
            dbData.push(parseFloat(jsonData[i]));
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var marks = db.collection('marks_T3');
            marks.update({"ip":ip},{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                res.json({"success":true});
                db.close();});
        });
    });
});
app.post('/save_mark_E',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        for(var i in jsonData)
            dbData.push(parseFloat(jsonData[i]));
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var marks = db.collection('marks_E');
            marks.update({"ip":ip},{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                res.json({"success":true});
                db.close();});
        });
    });
});

//send subparts
//app.post('/get_subparts',function(req,res)
//{
//    var jsonString = '';
//    var ip = req.ip;
//    console.log("'/get_subparts' request received from " + ip.toString());  
//
//    req.on('data',function(data)
//    {
//       jsonString += data;
//    });
//    req.on('end',function()
//    {
//       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
//       var type = jsonData['val'];
//    });
//    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
//    {
//        if(err)
//        {
//            console.log(err);
//            return 0;
//        }
//        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
//        var collection = db.collection('subparts');
//        collection.find({'type':type}).toArray(function(err,items){
//            res.json(items[0].subparts);
//            db.close();
//        });
//    });
//});
//receive list_dir request

app.post('/list_dir',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/list_dir' request received from " + ip.toString());  

    var reject = false;
    /*
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
            if(items == null)
            {
                console.log(err);
                console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                db.close();
                return;
            }
            if(items[0].logged == false)
            {
                db.close();    
                reject = true; 
                console.log("User not logged in with ip " + ip.toString() + ".Rejecting list_dir request.");
                db.close();      
                return;
            }
        });
    });
    */
    if(reject == true){return;}
    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var directory_path = jsonData['folder'];
       if(directory_path=='uploads')
       {
            directory_path = __dirname + "/uploads/" + ip.toString() + "/";
       }
       else if(directory_path=='downloads')
       {
            directory_path = __dirname + "/downloads";
       }
        fs.readdir(directory_path, function(err,files)
        {
           if(err)
            {
                console.log(err);
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
            
            //filtering of filenames to show only country specific files
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
                    if(items == null)
                    {
                        console.log(err);
                        console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                        return;
                    }
                    if(items[0].logged == true)
                    {
                        if(items[0].type == 0)
                        {
                            id = "download";
                            directory_path = "/downloads/";
                            var result = {};
                            result['id'] = id;
                            result['directory_path'] = directory_path;
                            result['files'] = files;
                            res.json(result);
                            console.log("Response to '/list_dir' sent in response to request from " + ip.toString());  
                            db.close();       
                            return;    
                        }
                        else
                        {
                            collection.find({}).toArray(function(err,items)
                            {
                                if(items == null)
                                {
                                    console.log(err);
                                    console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                                    return;
                                }
                                for (i in items)
                                {
                                    //default file name is Marks_country_code.xls
                                    var country_index = files.indexOf("Marks_" + items[i].country_code.toString() + ".xls")
                                    if(country_index > -1 && items[i].ip != ip)
                                    {
                                        //console.log("splicing");
                                        files.splice(country_index,1);
                                    }
                                }
                                id = "download";
                                directory_path = "/downloads/";
                                var result = {};
                                result['id'] = id;
                                result['directory_path'] = directory_path;
                                result['files'] = files;
                                res.json(result);
                                console.log("Response to '/list_dir' sent in response to request from " + ip.toString());  
                                db.close();           
                            });

                        }
                     }
                     else
                     {
                         console.log("Request rejected!");
                         db.close();
                     }
                    
                });
            }); 
        }
        else
        {
            MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
            {
                if(err)
                {
                    console.log(err);
                    return 0;
                }
                console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
                var uploads = db.collection('uploads');
                
                uploads.find({"ip":ip}).toArray(function(err,items){
                
                    var result = {};
                    
                    if(err)
                    {
                         console.log(err);
                    }
                    if(items[0].logged == true)
                    {
                        if(items[0].T1_printed)result['T1_printed']=true;else result['T1_printed']=false;
                        if(items[0].T2_printed)result['T2_printed']=true;else result['T2_printed']=false;
                        if(items[0].T3_printed)result['T3_printed']=true;else result['T3_printed']=false;
                        if(items[0].E_printed)result['E_printed']=true;else result['E_printed']=false;
                        if(items[0].T1_packed)result['T1_packed']=true;else result['T1_packed']=false;
                        if(items[0].T2_packed)result['T2_packed']=true;else result['T2_packed']=false;
                        if(items[0].T3_packed)result['T3_packed']=true;else result['T3_packed']=false;
                        if(items[0].E_packed)result['E_packed']=true;else result['E_packed']=false;

                        id = "upload";
                        directory_path = "/uploads/" + ip.toString() + "/";
                        result['id'] = id;
                        result['directory_path'] = directory_path;
                        result['files'] = files;
                        res.json(result);
                    }
                    db.close();
                });
            });
        }
       });  
    });
});
//receive request for fb
app.post('/request_fb',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/request_fb' request received from " + ip.toString());  

    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var current = jsonData['current'];
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:current}).toArray(function(err,feeds)
		    {
                var result = {};
                result['feeds'] = feeds;
                res.json(result);
                console.log("Response to '/request_fb' sent in response to request from " + ip.toString());  
			    db.close();
		    });
		});
    });
});

app.post('/request_fb_leader',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/request_fb' request received from " + ip.toString());  

    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var current = jsonData['current'];
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:current,"ip":ip}).toArray(function(err,feeds)
		    {
                var result = {};
                result['feeds'] = feeds;
                res.json(result);
                console.log("Response to '/request_fb' sent in response to request from " + ip.toString());  
			    db.close();
		    });
		});
    });
});
//request present table
app.get('/sheetEditableT1',function(req,res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
            return;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var subparts = db.collection('subparts');
        var marks = db.collection('marks_T1');
        var users = db.collection('users');
        
        var query = {};

        subparts.find({"type":"t1"}).toArray(function(err,items){
            var subparts = items[0].subparts;
            var maxMarks = items[0].maxMarks;
            users.find({"ip":ip}).toArray(function(err,data){
                var country_code = data[0].country_code;
                //var students = data[0].students;
                var students = ['Sirius Sharma','Rigel Armstrong','Saiph Ali Khan'];
                marks.find({"ip":ip}).toArray(function(err,items2){
                    if(items2.length>=1)
                    {
                        var leaderMarks = items2[0].leaderMarks;
                    }
                    else
                        var leaderMarks = [];
                    query['subparts'] = subparts;
                    query['leaderMarks'] = leaderMarks;
                    query['maxMarks'] = maxMarks;
                    query['students'] = students;
                    query['country_code'] = country_code;
                    res.json(query);
                    db.close();
                });
            });
        });
    });
});
app.get('/sheetEditableT2',function(req,res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
            return;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var subparts = db.collection('subparts');
        var marks = db.collection('marks_T2');
        var users = db.collection('users');
        
        var query = {};

        subparts.find({"type":"t2"}).toArray(function(err,items){
            var subparts = items[0].subparts;
            var maxMarks = items[0].maxMarks;
            users.find({"ip":ip}).toArray(function(err,data){
                var country_code = data[0].country_code;
                //var students = data[0].students;
                var students = ['Sirius Sharma','Rigel Armstrong','Saiph Ali Khan'];
                marks.find({"ip":ip}).toArray(function(err,items2){
                    if(items2.length>=1)
                    {
                        var leaderMarks = items2[0].leaderMarks;
                    }
                    else
                        var leaderMarks = [];
                    query['subparts'] = subparts;
                    query['leaderMarks'] = leaderMarks;
                    query['maxMarks'] = maxMarks;
                    query['students'] = students;
                    query['country_code'] = country_code;
                    res.json(query);
                    db.close();
                });
            });
        });
    });
});
app.get('/sheetEditableT3',function(req,res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
            return;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var subparts = db.collection('subparts');
        var marks = db.collection('marks_T3');
        var users = db.collection('users');
        
        var query = {};

        subparts.find({"type":"t3"}).toArray(function(err,items){
            var subparts = items[0].subparts;
            var maxMarks = items[0].maxMarks;
            users.find({"ip":ip}).toArray(function(err,data){
                var country_code = data[0].country_code;
                //var students = data[0].students;
                var students = ['Sirius Sharma','Rigel Armstrong','Saiph Ali Khan'];
                marks.find({"ip":ip}).toArray(function(err,items2){
                    if(items2.length>=1)
                    {
                        var leaderMarks = items2[0].leaderMarks;
                    }
                    else
                        var leaderMarks = [];
                    query['subparts'] = subparts;
                    query['leaderMarks'] = leaderMarks;
                    query['maxMarks'] = maxMarks;
                    query['students'] = students;
                    query['country_code'] = country_code;
                    res.json(query);
                    db.close();
                });
            });
        });
    });
});
app.get('/sheetEditableE',function(req,res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return 0;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
            return;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
        var subparts = db.collection('subparts');
        var marks = db.collection('marks_E');
        var users = db.collection('users');
        
        var query = {};

        subparts.find({"type":"e"}).toArray(function(err,items){
            var subparts = items[0].subparts;
            var maxMarks = items[0].maxMarks;
            users.find({"ip":ip}).toArray(function(err,data){
                var country_code = data[0].country_code;
                //var students = data[0].students;
                var students = ['Sirius Sharma','Rigel Armstrong','Saiph Ali Khan'];
                marks.find({"ip":ip}).toArray(function(err,items2){
                    if(items2.length>=1)
                    {
                        var leaderMarks = items2[0].leaderMarks;
                    }
                    else
                        var leaderMarks = [];
                    query['subparts'] = subparts;
                    query['leaderMarks'] = leaderMarks;
                    query['maxMarks'] = maxMarks;
                    query['students'] = students;
                    query['country_code'] = country_code;
                    res.json(query);
                    db.close();
                });
            });
        });
    });
});

//copies the uploaded file from /tmp to /downloads for the convener
app.post('/uploaded',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
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
                    if(type == 0)
                    {
                        //the /tmp path of the file
                        var temp_path = req.files.user_file.path;
                        //the name of the uploaded file
                        var file_name = req.files.user_file.name
                        //the new location to which the file will be copied 
                        var new_location = __dirname + '/downloads/' + file_name;
                        
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                               return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(file_name + " successfully copied to /downloads/");
                        });

                        //redirect the client to his homepage
                        res.redirect('/')
                        done = false;
                    }
                }
            });
        });
        
    }
});

//copies the uploaded file from /tmp to the user's home folder for T1
app.post('/uploadedT1',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        //file extension
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
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
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items == null | items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type == 1)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "T1_" + country_code.toString() + "." + file_extension; 
                        new_location = __dirname + '/uploads/'+ req.ip + '/' + file_name;
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
                        
                        var uploads = db.collection('uploads');
                        uploads.update({"ip":ip},{$set:{"T1":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;
                        
                    }
                }
            });
        });
    }
});

//copies the uploaded file from /tmp to the user's home folder fot T2
app.post('/uploadedT2',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
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
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
            }
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
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "T2_" + country_code.toString() + "." + file_extension; 
                        new_location = __dirname + '/uploads/'+ ip + '/' + file_name;
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

                        var uploads = db.collection('uploads');
                        uploads.update({"ip":ip},{$set:{"T2":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;
                    }
                }
            });
        });
    }
});

//copies the uploaded file from /tmp to the user's home folder for T3
app.post('/uploadedT3',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
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
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
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
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "T3_" + country_code.toString() + "." + file_extension; 
                        new_location = __dirname + '/uploads/'+ req.ip + '/' + file_name;
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

                        var uploads = db.collection('uploads');
                        uploads.update({"ip":ip},{$set:{"T3":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;
                    }
                }
            });
        });
    }
});

//copies the uploaded file from /tmp to the user's home folder for E
app.post('/uploadedE',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
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
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
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
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "E_" + country_code.toString() + "." + file_extension; 
                        new_location = __dirname + '/uploads/'+ req.ip + '/' + file_name;
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

                        var uploads = db.collection('uploads');
                        uploads.update({"ip":ip},{$set:{"E":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});
var voted = [];	//a global variable which maintains the ip of people who have voted once

io.on('connection',function(socket)
{
    if(socket.handshake.address != null)
    {
        var ip = socket.handshake.address.toString();
    }
    else
    {
        console.log("Null IP Error in io.on connection.Carry on");
        socket.disconnect();
        return;
    }
    //TODO
    //THIS DOES NOT WORK.FIND A SOLUTION.
    if(ip == null){socket.io.close();return;}
    console.log("Connection established to the socket in reponse to " + ip);
    var message_table = [];
    // Connect to the db
     
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var uploads = db.collection('uploads');
        
        uploads.find({"ip":ip}).toArray(function(err,items) 
        { 
            if(items == null) 
            { 
                db.close();
                return;
            }
            if(items[0].T1_printed)socket.emit('T1_printed');
            if(items[0].T2_printed)socket.emit('T2_printed');
            if(items[0].T3_printed)socket.emit('T3_printed');
            if(items[0].E_printed)socket.emit('E_printed');
            db.close();
        });
    }); 
    
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var users = db.collection('users');
        
        users.find({"ip":ip}).toArray(function(err,items)
        {

            if(items == null)
            {
                db.close();
                return;
            }
            var val = items[0].number_of_votes;
            socket.emit('num_of_leaders',val);
            socket.emit('country-data',items[0]);
            console.log("'numberofleaders' signal broadcasted from the server in response to " + ip.toString());
            console.log("'country-data' signal broadcasted from the server in response to " + ip.toString());
            db.close(); 
        });
    }); 
    
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var messages = db.collection('messages');
        
        messages.find({}).toArray(function(err,items)
        {   
            message_table = items;
            io.sockets.emit('message-sent',message_table); 
            console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
            db.close();
        });
    }); 
       
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var flags = db.collection('flags');
        flags.find({"name":"feedback"}).toArray(function(err,items)
        {
            if(items != '')
            {
                if(parseInt(items[0].value)==0){
                    socket.emit('fbDisable');
                    console.log("'fbDisable' signal sent from the server in response to " + ip.toString());
                    db.close();
                }
                else
                {
                    socket.emit('fbEnable',items[0].value);
                    console.log("'fbEnable' signal sent from the server in response to " + ip.toString());
                    db.close();
                }
            }
            else
            {
                    socket.emit('fbDisable');
                    console.log("'fbDisable' signal sent from the server in response to " + ip.toString());
                    db.close();
            }
        });
    });
    socket.on('fb_stat_toggle',function(fb_id)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'fb_stat_toggle' signal received from " + ip.toString());

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var fbs= db.collection('fbs');
            var _id = new ObjectID(fb_id);
            
            fbs.find({"_id":_id}).toArray(function(err,items)
            { 
                if(items[0].done == true)
                {
                    fbs.update({"_id":_id},{$set: {"done": false}},function(err){db.close();});
                }
                else
                {
                    fbs.update({"_id":_id},{$set: {"done": true}},function(err){db.close();});
                }
            });
            /*
            var doc = fbs.findOne({"_id": _id});
            console.log(doc);
            console.log(fb_id);
            fbs.update({"_id":ObjectID(fb_id)},{$set: {done: !doc.done}});
            */
            console.log("done toggled sucessfully for feedback id " + fb_id);
            return;
        });
       
    }); 
    socket.on('upload-alert',function(client_ip,id)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'upload-alert' signal received from" + ip.toString());

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var uploads = db.collection('uploads');
		    if(id == "T1")
            {
                uploads.update({"ip":client_ip},{$set:{"T1_alert":true}},function(err,result){db.close();});
            }
            else if(id == "T2")
            {
                uploads.update({"ip":client_ip},{$set:{"T2_alert":true}},function(err,result){db.close();});
            }
            else if(id == "T3")
            {
                uploads.update({"ip":client_ip},{$set:{"T3_alert":true}},function(err,result){db.close();});
            }
            else if(id == "E")
            {
                uploads.update({"ip":client_ip},{$set:{"E_alert":true}},function(err,result){db.close();});
            }
        });
    });

    //messages
    socket.on('message-submit',function(message)
    {
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
    //directory listing for the convener
    socket.on('list-all-uploads',function()
    {
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'list-all-uploads' signal received from " + ip.toString());
        var all_uploads = [];
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                    console.log(err);
                    return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var uploads = db.collection('uploads');
                       
            uploads.find({}).toArray(function(err,items)
            {
                all_uploads = items;
                socket.emit('listed-all-uploads',all_uploads);
                console.log("'listed-all-uploads' signal emmited from server in response to " + ip.toString());
                db.close();
            });
        });

    });


    //directory listing
    socket.on('list-dir',function(directory_path)
    {
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
                console.log(err);
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
            
            //filtering of filenames to show only country specific files
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
                    if(items == null)
                    {
                        console.log(err);
                        console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                        return;
                    }
                    if(items[0].type == 0)
                    {
                        id = "download";
                        directory_path = "/downloads/";
                        socket.emit('listed-dir',id,directory_path,files);
                        db.close();       
                        return;    
                    }
                    else
                    {
                        collection.find({}).toArray(function(err,items)
                        {
                            if(items == null)
                            {
                                console.log(err);
                                console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                                return;
                            }
                            for (i in items)
                            {
                                //default file name is Marks_country_code.xls
                                var country_index = files.indexOf("Marks_" + items[i].country_code.toString() + ".xls")
                                //console.log("Marks_" + items[i].country_code.toString() + ".xls");
                                //console.log(items[i].ip); 
                                //console.log(country_index); 
                                if(country_index > -1 && items[i].ip != ip)
                                {
                                    //console.log("splicing");
                                    files.splice(country_index,1);
                                }
                            }
                            id = "download";
                            directory_path = "/downloads/";
                            socket.emit('listed-dir',id,directory_path,files);
                            db.close();           
                        });

                    }
                });


            }); 
        }
        else
        {
            MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
            {
                if(err)
                {
                    console.log(err);
                    return 0;
                }
                console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
                var uploads = db.collection('uploads');
                
                uploads.find({"ip":ip}).toArray(function(err,items){

                    if(err)
                    {
                         console.log(err);
                    }
                    if(items[0].T1_printed)socket.emit('T1_printed');
                    if(items[0].T2_printed)socket.emit('T2_printed');
                    if(items[0].T3_printed)socket.emit('T3_printed');
                    if(items[0].E_printed)socket.emit('E_printed');

                    if(items[0].T1_alert)
                    {
                        uploads.update({"ip":ip},{$set:{"T1_alert":false}},function(err,result){});
                        socket.emit('T1-alert');
                    }
                    if(items[0].T2_alert)
                    {
                        uploads.update({"ip":ip},{$set:{"T2_alert":false}},function(err,result){});
                        socket.emit('T2-alert');
                    }
                    if(items[0].T3_alert)
                    {
                        uploads.update({"ip":ip},{$set:{"T3_alert":false}},function(err,result){});
                        socket.emit('T3-alert');
                    }
                    if(items[0].E_alert)
                    {
                        uploads.update({"ip":ip},{$set:{"E_alert":false}},function(err,result){});
                        socket.emit('E-alert');
                    }
                    db.close();
                });
            });
            id = "upload";
            directory_path = "/uploads/" + ip.toString() + "/";
            socket.emit('listed-dir',id,directory_path,files);
        }
        console.log("'listed-dir' signal emmited from server in response to " + ip.toString());
        });
    });
    
    socket.on('file-delete',function(id) 
    {
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'file-delete' signal received from " + ip.toString());
        var message_table = [];
	    try
	    {
	    	fs.unlink(__dirname + id);
            }
	    catch(err)
            {
                console.log("File deletion failed");
	    }
    	socket.emit('file-deleted');
	});

    //start feedback
    socket.on('fbStart',function(q){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbStart' signal for " + q +" received from " + ip.toString());

		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var flags = db.collection('flags');
			var query = {};
			query['value'] = q;
		    flags.update({"name":"feedback"},{$set:query},{upsert:true},function(err,result){db.close();});
	    });
	    io.sockets.emit('fbEnable',q);
		console.log("'fbEnable' signal emitted from server in response to " + ip.toString());
    });
    
    //end feedback
    socket.on('fbEnd',function(){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbEnd' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var flags = db.collection('flags');
			var query = {};
			query['value'] = 0;
		    flags.update({"name":"feedback"},{$set:query},function(err,result){db.close();});
	    });
	    io.sockets.emit('fbDisable');
		console.log("'fbDisable' signal emitted from server in response to " + ip.toString());
    });

    //store and send feedback
    socket.on('fbContent',function(id,current,content,time){
        
		console.log("'fbContent' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var fbs = db.collection('fbs');
            var users = db.collection('users');
            users.find({"ip":ip}).toArray(function(err,result){
                var country_code = result[0].country_code;
                var query = {};
                query['ip'] = ip;
                query['country_code'] = country_code;
                query['qid'] = id;  //question id
                query['qno'] = current;
                query['time'] = time;
                query['done'] = false;
                var query2 = {};
                query2['content'] = content;
                fbs.update(query,{$push:query2},{upsert:true},function(err,result){db.close();});
            });
	    });
    });

    socket.on('fbRequest',function(value){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbRequest' for "+value+" signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:value}).toArray(function(err,feeds)
		    {
				socket.emit('fbDisplay',feeds);
		        console.log("'fbDisplay' signal emitted from server in response to " + ip.toString());
			    db.close();
		    });
		});
    });

    //login
	socket.on('syn',function(pass)
    {
        
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
		    var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
		    {
			    var truePass = items[0].pass;
			    if(truePass == pass)
			    {
			
					collection.update({"ip":ip},{$set:{"logged":true}},function(err,result){});
					uploads.update({"ip":ip},{$set:{"logged":true}},function(err,result){});
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
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
		    var uploads = db.collection('uploads');
            /*
            The ip of the user need not be checked of its existence in the database
            as the user could only have logged in when he was in the database.

            For security purposes,it seems however practical to ensure this redundancy.
            */
		    collection.find({"ip":ip}).toArray(function(err,items)
		    {
		        collection.update({"ip":ip},{$set:{"logged":false}},function(err,result){});
			    uploads.update({"ip":ip},{$set:{"logged":false}},function(err,result){});db.close();
		    });
            //send the end acknowleged signal
            socket.emit('end-ack');
		    console.log("'end-ack' signal emitted from server in response to " + ip.toString());
		});
	});

	//set vote question
	socket.on('setvote',function(body,options,time)
    {
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'setvote' signal received from " + ip.toString());
        //the five letter long alphanumeric id of a question is generated randomly
		var id = Math.random().toString(36).substr(2,5);
		//TODO: check for valid id
		
        //Add option 'Abstain'
        options.push('Abstain');

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err) { console.log(err); return 0; }
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
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
            var users = db.collection('users');
            users.find({"ip":ip}).toArray(function(err,items)
            {
                if(items[0].logged==true)
                {
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
                }
            });
		});
	});

	socket.on('chpass',function(oldpass,newpass)
    {
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
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
	
    //packed and printed
    socket.on('flagPrint',function(val,type,ipi){
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'flagPrint' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var uploads = db.collection('uploads');
            var query = {};
            var field = type + '_printed';
            query[field] = val;
		    uploads.update({"ip":ipi},{$set:query},function(err,result){db.close();});
        });
    });
    socket.on('flagPack',function(val,type,ipi){
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'flagPack' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var uploads = db.collection('uploads');
            var query = {};
            var field = type + '_packed';
            query[field] = val;
		    uploads.update({"ip":ipi},{$set:query},function(err,result){db.close();});
        });
    });

	socket.on('refresh',function(){
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		if(!ip)return;
		console.log("'refresh' signal received from " + ip.toString());
		io.sockets.emit('refreshAll');
	});
});
app.use("/uploads/192.168.200.225/",express.static(__dirname + "/uploads/192.168.200.225/"));console.log("File download enabled for /uploads/192.168.200.225/");
app.use("/uploads/192.168.200.222/",express.static(__dirname + "/uploads/192.168.200.222/"));console.log("File download enabled for /uploads/192.168.200.222/");
app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");
app.use("/uploads/192.168.200.71/",express.static(__dirname + "/uploads/192.168.200.71/"));console.log("File download enabled for /uploads/192.168.200.71/");
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
app.use("/uploads/192.168.200.100/",express.static(__dirname + "/uploads/192.168.200.100/"));console.log("File download enabled for /uploads/192.168.200.100/");
app.use("/uploads/192.168.200.101/",express.static(__dirname + "/uploads/192.168.200.101/"));console.log("File download enabled for /uploads/192.168.200.101/");
app.use("/uploads/192.168.200.102/",express.static(__dirname + "/uploads/192.168.200.102/"));console.log("File download enabled for /uploads/192.168.200.102/");
app.use("/uploads/192.168.200.103/",express.static(__dirname + "/uploads/192.168.200.103/"));console.log("File download enabled for /uploads/192.168.200.103/");
app.use("/uploads/192.168.200.104/",express.static(__dirname + "/uploads/192.168.200.104/"));console.log("File download enabled for /uploads/192.168.200.104/");
app.use("/uploads/192.168.200.105/",express.static(__dirname + "/uploads/192.168.200.105/"));console.log("File download enabled for /uploads/192.168.200.105/");
app.use("/uploads/192.168.200.106/",express.static(__dirname + "/uploads/192.168.200.106/"));console.log("File download enabled for /uploads/192.168.200.106/");
app.use("/uploads/192.168.200.107/",express.static(__dirname + "/uploads/192.168.200.107/"));console.log("File download enabled for /uploads/192.168.200.107/");
app.use("/uploads/192.168.200.108/",express.static(__dirname + "/uploads/192.168.200.108/"));console.log("File download enabled for /uploads/192.168.200.108/");
app.use("/uploads/192.168.200.109/",express.static(__dirname + "/uploads/192.168.200.109/"));console.log("File download enabled for /uploads/192.168.200.109/");
app.use("/uploads/192.168.200.110/",express.static(__dirname + "/uploads/192.168.200.110/"));console.log("File download enabled for /uploads/192.168.200.110/");
app.use("/uploads/192.168.200.111/",express.static(__dirname + "/uploads/192.168.200.111/"));console.log("File download enabled for /uploads/192.168.200.111/");
app.use("/uploads/192.168.200.112/",express.static(__dirname + "/uploads/192.168.200.112/"));console.log("File download enabled for /uploads/192.168.200.112/");
app.use("/uploads/192.168.200.113/",express.static(__dirname + "/uploads/192.168.200.113/"));console.log("File download enabled for /uploads/192.168.200.113/");
app.use("/uploads/192.168.200.114/",express.static(__dirname + "/uploads/192.168.200.114/"));console.log("File download enabled for /uploads/192.168.200.114/");
app.use("/uploads/192.168.200.115/",express.static(__dirname + "/uploads/192.168.200.115/"));console.log("File download enabled for /uploads/192.168.200.115/");
app.use("/uploads/192.168.200.116/",express.static(__dirname + "/uploads/192.168.200.116/"));console.log("File download enabled for /uploads/192.168.200.116/");
app.use("/uploads/192.168.200.117/",express.static(__dirname + "/uploads/192.168.200.117/"));console.log("File download enabled for /uploads/192.168.200.117/");
app.use("/uploads/192.168.200.118/",express.static(__dirname + "/uploads/192.168.200.118/"));console.log("File download enabled for /uploads/192.168.200.118/");
app.use("/uploads/192.168.200.119/",express.static(__dirname + "/uploads/192.168.200.119/"));console.log("File download enabled for /uploads/192.168.200.119/");
app.use("/uploads/192.168.200.120/",express.static(__dirname + "/uploads/192.168.200.120/"));console.log("File download enabled for /uploads/192.168.200.120/");
app.use("/uploads/192.168.200.121/",express.static(__dirname + "/uploads/192.168.200.121/"));console.log("File download enabled for /uploads/192.168.200.121/");
app.use("/uploads/192.168.200.122/",express.static(__dirname + "/uploads/192.168.200.122/"));console.log("File download enabled for /uploads/192.168.200.122/");
app.use("/uploads/192.168.200.123/",express.static(__dirname + "/uploads/192.168.200.123/"));console.log("File download enabled for /uploads/192.168.200.123/");
app.use("/uploads/192.168.200.124/",express.static(__dirname + "/uploads/192.168.200.124/"));console.log("File download enabled for /uploads/192.168.200.124/");
app.use("/uploads/192.168.200.125/",express.static(__dirname + "/uploads/192.168.200.125/"));console.log("File download enabled for /uploads/192.168.200.125/");
app.use("/uploads/192.168.200.126/",express.static(__dirname + "/uploads/192.168.200.126/"));console.log("File download enabled for /uploads/192.168.200.126/");
app.use("/uploads/192.168.200.127/",express.static(__dirname + "/uploads/192.168.200.127/"));console.log("File download enabled for /uploads/192.168.200.127/");
app.use("/uploads/192.168.200.128/",express.static(__dirname + "/uploads/192.168.200.128/"));console.log("File download enabled for /uploads/192.168.200.128/");
app.use("/uploads/192.168.200.129/",express.static(__dirname + "/uploads/192.168.200.129/"));console.log("File download enabled for /uploads/192.168.200.129/");
app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");
