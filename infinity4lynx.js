//============================= FINE ===========================
var MongoClient = require('mongodb').MongoClient;
//var mongodb = require('mongodb');
var assert = require('assert');
var mysql      = require('mysql');
 Grid = mongo.Grid;

// CONFIG
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'spacedust',
  password : 'nicetry',
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
      for(var j in infFiles) {
        var infFile=infFiles[j];
        files.push({
          originalName: infFile.name,
          // b/src/1455X.gif => /biz/media/1.png
          path: infFile.file_path,
          //mime:
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
      for(var k in replies) {
        var reply=replies[k];
//	console.log("var Replys?",reply);
        // does reply exist in mongo?
//        mondb.collection('posts').findOne({ boardUri: uri, threadId: thread.id, postId: reply.id }, function(err, lPost) {
  //        if (err) {
            console.error('boardToLynx - mongo.replies', err);
    //      } else {
            // if doesn't exist
           // if (!lPost) {
              // create post
              // id?
              // signedRole
              var obj={
                boardUri: uri,
                threadId: thread.id,
                postId: reply.id,
                creation: new Date(reply.time*1000),
                ip: reply.ip.split(/\./),
                message: reply.body_nomarkup,
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
    for(var i in threads) {
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
              var obj={
                boardUri: uri,
                threadId: thread.id,
                creation: new Date(thread.time*1000),
                lastBump: new Date(thread.bump*1000),
                ip: thread.ip.split(/\./),
                message: thread.body_nomarkup,
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
  for(var i =0; i<len; i++)
  {
	
  }
}

function fixImageUrl()
{

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
      console.log('checking', boards.length, 'board');
//Loops through boards      

//This code broke
	//for(var i = 0; i<boards.length; i++)
	 for(var i in boards) {
	console.log("i is:", i);
        var board=boards[i];
	console.log("BOARD IS?",board.uri);
        // does board exit
      //  mondb.collection('boards').findOne({ boardUri: board.uri }, function(err, lboard) {
	  console.log("Uri? ", board.uri);
	  console.log("what is I inside mondb ", i);
	// console.log("Lboard?", lboard);
        //  if (!lboard) {
            // TODO: query mods for owner
            // TODO: query board_tags for tags
            console.log('board', board.uri, 'DNE in lynx, need to create.');
            var obj={
              boardUri: board.uri,
              boardName: board.title,
              boardDescription: board.subtitle,
              settings: ["disableIds", "requireThreadFile"],
              tags: [],
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
});
//=============================END FINE============================
