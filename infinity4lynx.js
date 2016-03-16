//============================= FINE ===========================
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var assert = require('assert');
var mysql      = require('mysql');
var crypto = require('crypto');
 //Grid = mongo.Grid;

// CONFIG
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'spacedust',
  password : 'niceone',
  database : 'vichan'
});
var url = 'mongodb://localhost:27017/lynxchan';

var lynxModName = "";

// setup
var mondb=null;

//===========================END FINE ==============================
function buildFiles(thread) {
  // build files
  var files=[];
  if (thread.files) {
    try {
      var infFiles=JSON.parse(thread.files);
      console.log('there are', infFiles.length, 'files');
      for(var j=0;j<infFiles.length; j++) {
        var infFile=infFiles[j];
	var mimeType = getMime(infFile.file_path);
	if(mimeType == "ERROR")
	{
	 mimeType = "INVALID!";
	}
	infFile.thumb_path = fixThumb(infFile.thumb_path);
	infFile.file_path = fixImageUrl(infFile.file_path);
        files.push({
          originalName: infFile.name,
          // b/src/1455X.gif => /biz/media/1.png
          path: infFile.file_path,
          mime: mimeType,
          // thumb path: /biz/media/t_1.jpg
          thumb: infFile.thumb_path,
          // localname.jpg (1.jpg)
          name: infFile.file,
          size: infFile.size,
          md5: infFile.hash,
          width: infFile.width,
          height: infFile.height
        });
      }
    } catch(e) {
      console.error('cant parse files json', thread.files);
    }
  }
  return files;
}

function repliesToLynx(uri, thread, callback) {
  // get a list of all threads' posts
  connection.query('SELECT * from posts_'+uri+' where thread='+thread.id, function(err, replies) {
    if (err) {
      console.error('boardToLynx - mysql.replies', err);
    } else {
      if (!replies) {
        return; // no replies, no work
      }
      console.log('repliesToLynx - looking at', replies.length, 'for', thread.id);
      for(var k =0; k <replies.length; k++) {
        var reply=replies[k];
//	console.log("var Replys?",reply);
        // does reply exist in mongo?
//        mondb.collection('posts'mo).findOne({ boardUri: uri, threadId: thread.id, postId: reply.id }, function(err, lPost) {
  //        if (err) {
            console.error('boardToLynx - mongo.replies', err);
    //      } else {
            // if doesn't exist
           // if (!lPost) {
              // create post
              // id?
              // signedRole
	      var reply_salt = crypto.createHash('sha256').update("gunshot gunshot Cash registernoise" + Math.random() + new Date()).digest('hex');
	     //stipe message of tabs and stuff
		var replymessage = reply.body_nomarkup.toLowerCase().replace(/[ \n\t]/g, '');
  		var objreplymessage = crypto.createHash('md5').update(replymessage).digest('base64');
              var obj={
                boardUri: uri,
                threadId: thread.id,
                postId: reply.id,
                creation: new Date(reply.time*1000),
                ip: reply.ip.split(/\./),
                message: reply.body_nomarkup,
		hash: objreplymessage, //stuff used for R9K
 		salt: reply_salt, //ID generation
                name: reply.name,
                subject: reply.subject, // empty subject is null in lynx too
		markdown: reply.body,
              }
              if (reply.password) {
                obj.password=reply.password;
              }
              if (reply.email) {
                //console.log('writing email', thread.email);
                obj.email=thread.email;
              }
              var files=buildFiles(reply);
              if (files.length) {
                obj.files=files;
              }
              console.log('would create', uri+'/'+thread.id+'/'+reply.id, obj);
		lynxCreate('posts', obj, function() {
      //          boardToLynx(uri);
            });
	     console.log("at end of replies2lynx");
           // }
         // }
        //});
      }
    }
  });
}

function boardToLynx(uri) {
  // get a list of threads
  connection.query('SELECT * from posts_'+uri+' where thread IS NULL', function(err, threads) {
    console.log('found', threads.length, 'threads in', uri);
    // does this thread exist in LynxChan?
    for(var i =0; i<threads.length;i++) {
      var thread=threads[i];
      var scopeLoop=function(thread) {
      //  mondb.collection('threads').findOne({ boardUri: uri, threadId: thread.id }, function(err, lThread) {
        //  if (err) {
      //      console.error('boardToLynx - mongo.threads', err);
         // } else {
           // if (!lThread) {
              // export entire thread
              // calculate hash
              // id/signedRole? <=> trip/capcode?
              // markdown version?
              // salt?
             var thread_salt = crypto.createHash('sha256').update("gunshot gunshot Cash registernoise" + Math.random() + new Date()).digest('hex');

       		var threadmessage = thread.body_nomarkup.toLowerCase().replace(/[ \n\t]/g, '');
  		var objthreadmessage = crypto.createHash('md5').update(threadmessage).digest('base64');     
		
		var obj={
                boardUri: uri,
                threadId: thread.id,
                creation: new Date(thread.time*1000),
                lastBump: new Date(thread.bump*1000),
                ip: thread.ip.split(/\./),
                message: thread.body_nomarkup,
		hash: objthreadmessage,//used for r9k
		salt: thread_salt,
                name: thread.name,
                pinned: thread.sticky?true:false,
                locked: thread.locked?true:false,
                subject: thread.subject, // empty subject is null in lynx too
                password: thread.password,
		markdown: thread.body,
              };
              var files=buildFiles(thread);
              if (files.length) {
                obj.files=files;
              }
              // what does NULL do? this isn't triggered on NULL
              if (thread.email) {
                //console.log('writing email', thread.email);
                obj.email=thread.email;
              }
             // console.log('would create thread', thread.id, obj);
	 	lynxCreate("threads",obj, function(){
		 console.log("Threads updated");	
		});
           // }
            // check for new posts
            repliesToLynx(uri, thread, function() {
        //      console.log('posts checked');
            });
         // }
        //});
      }(thread);
    }
  });
}

function mod2lynxchan()
{
  
}

function fixThumb(th)
{
  var len = th.length;
  var Act = th;
  var firstSlash = false;
  var secondSlash = false;
  var foundSlash = "";
  var foundSecondSlash= "";
  for(var i =0; i<len; i++)
  {
	var temp = Act.substr(i,1);
	console.log("TEMP IS: " + temp);
	if("/" == temp && firstSlash == false)
	{
	  firstSlash = true;
	  console.log("thumbnail full is " + Act );
	  console.log("location of first slash " + Act.substr(0,i));
	  foundSlash = Act.substr(0,i);
	  
	}
	else if("/" == temp && firstSlash == true && secondSlash == false)
	{
	   secondSlash = true;
	   console.log("secondslas? ", secondSlash);
	   console.log("location of second slash " + Act.substr(i+1,Act.length - i));
	   foundSecondSlash = Act.substr(i+1,Act.length - i);
	   
	}
  }
  console.log(foundSlash + "/thumb/t_" + foundSecondSlash);
  var ret = "/" + foundSlash + "/thumb/t_" + foundSecondSlash;
// var ret = "/thumb/t_"+ foundSecondSlash; 
 return ret;
}

function getMime(img)
{
 var len = img.length

 var foundDot=false;
 var mimeType = "";
 for(var i=0; i<len;i++)
 {
 	var temp = img.substr(i,1);
        if(temp == "." && foundDot == false)
 	{
	  foundDot = true;
	   mimeType = img.substr(i+1,img.length - i);
	  console.log("found mimeType");	
	}

 }

  if(foundDot == true)
  {
	if(mimeType == "png")
	{
	  mimeType = "image/png";
	}
	else if(mimeType == "jpg" || mimeType == "jpeg")
	{
	  mimeType = "image/jpeg";
	}
	else if(mimeType == "gif)
	{
	  mimeType = "image/gif";
	}
	else if(mimeType == "bmp")
	{
	  mimeType = "image/bmp";
	}
	else if(mimeType == "webm")
	{
	  mimeType = "video/webm";
	  //Also accepts Audio webums	
	}
	else if(mimeType == "mpeg")
	{
	  mimeType = "audio/mpeg";
	} 
	else if(mimeType == "mp4")
	{
	  mimeType = "video/mp4";
	}
	else if(mimeType == "ogg")
	{
	  mimeType = "video/ogg";
	}
	else 
	{
	  console.log("ERROR: Invalid video format?");
	  return "ERROR";
	}
	return mimeType;
	
  }
}

function fixImageUrl(img)
{
  var len = img.length;
  var Act = img;
  console.log("Fiximageurl IMG? ",img);
  var firstSlash = false;
  var secondSlash = false;
  var foundSlash = "";
  var foundSecondSlash= "";
  for(var i =0; i<len; i++)
  {
	var temp = Act.substr(i,1);
	console.log("TEMP IS: " + temp);
	if("/" == temp && firstSlash == false)
	{
	  firstSlash = true;
	  console.log("thumbnail full is " + Act );
	  console.log("location of first slash " + Act.substr(0,i));
	  foundSlash = Act.substr(0,i);
	  
	}
	else if("/" == temp && firstSlash == true && secondSlash == false)
	{
	   secondSlash = true;
	   console.log("secondslas? ", secondSlash);
	   console.log("location of second slash " + Act.substr(i+1,Act.length - i));
	   foundSecondSlash = Act.substr(i+1,Act.length - i);
	   
	}
  }
  console.log(foundSlash + "/media/" + foundSecondSlash);
  var ret = "/" + foundSlash + "/media/" + foundSecondSlash;
// var ret =  "/media/" + foundSecondSlash; 
 return ret;
}


//================FINE ===========================================

function lynxCreate(table, obj, callback) {
  mondb.collection(table, function(err, col) {
    col.insert(obj, function() {
      //console.log("inserting into DB");
      if (callback) {
        callback();
      }
    });
  });
}

MongoClient.connect(url, function(err, conn) {
  mondb=conn;
  assert.equal(null, err);
  console.log("Connected correctly to mongodb server.");
  connection.connect(function(err) {
    if (err) {
      console.error('mysql err', err);
      process.exit();
    }
//Connected
    console.log('connected to mysql server');
    // get list of boards
    connection.query('SELECT * from boards', function(err, boards) {
      // connected! (unless `err` is set)
      //console.log('checking', boards.length, 'board');
//Loops through boards      

//This code broke
	//for(var i = 0; i<boards.length; i++)
	 for(var i in boards) {
	//console.log("i is:", i);
        var board=boards[i];
	//console.log("BOARD IS?",board.uri);
        // does board exit
      //  mondb.collection('boards').findOne({ boardUri: board.uri }, function(err, lboard) {
	 // console.log("Uri? ", board.uri);
	//  console.log("what is I inside mondb ", i);
	// console.log("Lboard?", lboard);
        //  if (!lboard) {
            // TODO: query mods for owner
            // TODO: query board_tags for tags
	    var board_salt = crypto.createHash('sha256').update("gunshot gunshot Cash registernoise" + Math.random() + new Date()).digest('hex');
            console.log('board', board.uri, 'DNE in lynx, need to create.');
            var obj={
              boardUri: board.uri,
              boardName: board.title,
              boardDescription: board.subtitle,
              settings: ["disableIds", "requireThreadFile"],
              tags: [],
	      salt: board_salt,
            };
		//Function 
            lynxCreate('boards', obj, function() {
              //boardToLynx(board.uri);
              
	      console.log(" board should be created. :^( ", board.uri);
            });
	   boardToLynx(board.uri);

	      
       //   } else {
	    //console.log("MongoClient: if else statement. Board ",board.uri);
            //boardToLynx(board.uri);
          //}
        //});
      }
    });
  });
 console.log("AT END OF IMPORT");
});


//Nicked from LynxChan be/engine/gridFsHandler.js
var writeData = function(data, dest, mime, meta, callback, archive) {

  meta.lastModified = new Date();

  if (verbose) {
    console.log('Writing data on gridfs under \'' + dest + '\'');
  }

  var gs = mongo.GridStore(conn, dest, 'w', {
    'content_type' : mime,
    metadata : meta
  });

  gs.open(function openedGs(error, gs) {

    if (error) {
      callback(error);
    } else {
      writeDataOnOpenFile(gs, data, callback, archive, meta, mime, dest);
    }
  });

};

var writeDataOnOpenFile = function(gs, data, callback, archive, meta, mime,
    destination) {

  if (typeof (data) === 'string') {
    data = new Buffer(data, 'utf-8');
  }

  gs.write(data, true, function wroteData(error) {

    if (error || !archive || noDaemon) {
      callback(error);
    } else {
      //archiveHandler.archiveData(data, destination, mime, meta, callback);
    }

  });

};
//=============================END FINE============================
