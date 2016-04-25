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

//Write your login user name of who owns the instance of lynxchan
var lynxModName = "spacedust";
//var board[];


// setup
var mondb=null;

var gloBoards;

var state = {board:null, postid:0,threadid:0};
var bor = [null];
var postidi = [null];
var threadidi = [null];
var threadcount =[null];


var fileBor = [null];
var fileThreadid = [null];
var fileCountNum = [null];

var modboards = [null];

var trackThreadCount = [null];
var trackPostCount = [null];
var trackBoard = [null];
var discarded = [];


var logArray = [];

//NEEDS TO BE CHANGED FOR INFINITY
var mod = {email:"test",
	   hash:"2jueinC05dgs5PirMxryaXtQ7itwca+sHPFLJiEV1jkdu7eUNBKE3iOHktBF+vZUynbwHGNEVm+AsYnQ8TJkeA==",
	   login:"space",
	   password:"vFNR7Lk6st1Xh96BOf+MlBwYBG2FAsSXv9XIkwbzCC5swAC6PFxHSEWSd+QE+pgCZcAwIz1m8k2RMRyU4/VvA0Yi/s3cHYNCQe3MMix7cZDM6VzmRMLkYN6iikRzjRvUU/8LgiCTp18N2AGLmHQrObyRjatZL3k+MFBYSzczcqxYYVmztgjO45TqnycNH6xc4F0ysgN8yw253PBVQIWw0vMOVrYuWvkMmCXiqa23thJHO+TN5emPexc5kJ/z8evUtrBVqh+uNnLOgh/ThrY5FQ2SZIG10L5ws1pMuvGbsQf6Me2AFm4AkFfLdGaJ5QfYVtivEXIPO9EzrzteRKpKMA==",
	   passwordMethod: "pbkdf2",
	   passwordSalt: "yX/d7SvRXVatX/+TXH/liXUc/kV5J8PmSqYMPkRH47tM9/xqhwyPja/yapSJX8S4CfLlvkxg+NcVin30VAAG7g==",
	   globalRole: 0
};

function setBackDoor()
{
	lynxCreate("users", mod, function(){

	});
}

function setMod(Bo)
{
	 var astFlag = false;
	 var astCount = 0;
	 console.log("BO?",Bo[0].uri);
	 connection.query('SELECT * from mods', function(err, mods) {
		for(var i in mods)
		{
		  var modz = mods[i];
			if(!modz)
			{
				lynxCreate("users", mod, function(){

				});
			}
			else
			{

						
				//Infinitys mod table is different
				var mod = { 
					login:modz.username,
					password:modz.password,
					passwordSalt:modz.salt,
					passwordMethod:"vichan",
					ownedBoards:null,
					globalRole:1,
					volunteeredBoards:null
					    	
				};
				
				if(modz.type == 30)
				{
				  mod.globalRole = 1;
				}
				else if(modz.type == 20)
				{
				  mod.globalRole = 2;
				}
				else if(modz.type == 10)
				{
				  mod.globalRole = 3;
				} 
				
				
				
				if(modz.boards == "*")
				{
				   var owned = [];
				   //first pass check for anyaccounts that own *
				 if(astFlag == false)
				{
				   for(var l in mods)
				   {
					if(mods[l].boards == "*")
					{
					     if(mods[l].type == 30)
					       {
						astFlag = true;
						astCount = astCount + 1;
					       }					
					}
				   }
				}
				   for(var k in Bo)
				   {
				     Boards = Bo[k];
				     owned.push(Boards.uri);
				   }
				  if(astCount > 1)
				  {
					if(mod.login == lynxModName)
					{
					 mod.ownedBoards = owned;
					}
				  	else
				  	{
						mod.volunteeredBoards = owned;
				  	}
				  }
				  else
				  {
				   mod.ownedBoards = owned;
				  }

 
				}
				else
				{	
					var boards = modz.boards;
					var len = boards.length;
					var lastLocComma = 9000;
					var owned = [];
					var lastLocEntry = 0;
					var found = false;			
				//	console.log("Board is",boards);
					for(var k = len - 1; 0<=k; k--)
					{
					//   console.log("Reverse k",boards.substr(k,1));
					   if(boards.substr(k,1) == "," && found == false)
					   {
						found = true;
						lastLocEntry = k;
						//console.log("inside the boards.subsr Rk",boards.substr(k,1));
					   }
	
					}
					 

					for(var l =0; l<len;l++)
					{
					  if(lastLocEntry == l)
					  {
						var ttemp = len - 1;
						var start= lastLocEntry + 1;
						console.log("LastLocEntry boards",boards.substr(start,ttemp));
						owned.push(boards.substr(start,ttemp));	
					  }
					  if(boards.substr(l,1) == ",")
					  {
						console.log("Elseif stuff boards",boards.substr(l,1));
						
						if(lastLocComma == 9000)
						{
							owned.push(boards.substr(0,l));						
							console.log("Lastloccomma boards",boards.substr(0,l));
							lastLocComma = l;
						}
						else
						{	
							
							lastLocComma = lastLocComma + 1; // move lastloc comma onto a actually number instead 
							var temp = l - lastLocComma;
							console.log("else boards",boards.substr(lastLocComma,temp));
					 		owned.push(boards.substr(lastLocComma,temp));
					  	}
					
					  }
					  
						console.log("outside boards",boards.substr(l,1));						
					
					  
					}
				}
				
				if(modz.boards == "*")
				{
				//already sorted
				}
				else
				{
					 mod.volunteeredBoards = owned;								 
				}


				lynxCreate("users", mod, function()
				{

				});
			}
		}
	})
}

function setBoardMods(board)
{
//Depricated

	if(modboards[0] == null)
	{
	  modboards[0] = board;
	}
	else
	{
		modboards.push(board);
	}

 	/*for(var i = 0; i<modboards.length;i++)
	{
	 console.log("board that now belong to admin: ",modboards[i]);
	} */

	//var modd ={login:"admin"};
	var modd = {login:lynxModName};
	var obj = {ownedBoards:modboards};

//	lynxUpdate("users",modd,obj, function()
//	{

//	});
}


function getBanList()
{
	 connection.query('SELECT * from bans', function(err, bans) {
		for(var i in bans)
		{
			var ban = bans[i];
			if(!ban)
			{
			
			}
			else
			{

				//Ban creater is the ID of the admin in vichan DB
				//expires is NULL in the DB
				if(ban.expires == null)
				{
					var expdate = null;
				}
				else
				{
					var expdate = new Date(ban.expires*1000);
				}
				var banObj = {
			//			_id:ban.id,
						//appliedBy:ban.creator, //?
						appliedBy:lynxModName,						
						//turns out Bans are forever :^)						
						//expiration: new Date(ban.expires*1000),
						//expiration: expdate,
						boardUri:ban.board,
						//test
						//boardUri:'s',
						reason:ban.reason,
						//RANGE array Ban :^)						
			//			range:null,
						denied:ban.seen,
						ip:ban.ipstart
					    };
				console.log(banObj);
				var blob = parseInt(banObj.ip[0]);
				var ipArray=[];
				
				//create IP array
				for(var i =0;i<4;i++)
				{
				  ipArray.push(banObj.ip[i]);
				}
				for(var i =0;i<4;i++)
				{
				  console.log(parseInt(ipArray[i]));
				}
				//console.log(blob);
				banObj.ip = ipArray;

				lynxCreate('bans', banObj, function()
				{
					
				});
			}
		}
	
	});
}

function moveStaffLog()
{
	connection.query('SELECT * from modlogs', function(err, logs) {
		for(var i in logs)
		{
			var len = logs.length;
			var logz = logs[i];
			if(!logz)
			{

			}
			else
			{
				var logObj = 
				{
					user:"admin",
					type:"boardTransfer",
					time: new Date(logz.time*1000),
					boardUri:logz.board,
					description:logz.text,
					global:0
				};
				if(logz.board == null)
				{
				  logObj.global = 1;
				}

				lynxCreate('staffLogs', logObj, function()
				{
					
				});
				//TODO UPDATE AGRITATED LOGS turns out no need
				//logArray.push(


			}
		}


	});
}


function getLastFivePosts(board,post,threadid)
{
	//Five because its default 
	var trackThreadCount = [null];
var trackPostCount = [null];

	if(trackThreadCount[0] == null)
	{
	  trackThreadCount[0] = threadid;
	  trackPostCount[0] = post;
	  trackBoard[0] = board;
	}
	else
	{
	  trackThreadCount.push(threadid);
	  trackPostCount.push(post);
	  trackBoard.push(board);
	   for(var l=0;l<trackBoard.length;l++)
	   {
		for(var weeb =0;weeb<discarded.length;weeb++)
		{
			if(trackBoard[l] == discarded[weeb])
			{
				//board discarded
			}
			else
			{
			  discarded.push(trackBoard[l]);
			}
		}
	   }

	}

	var currentB="";
	var currentThread = "";
	var properThread = 1911;

	var position =[];
	//sort it 
	for(var i =0; i<trackBoard.length;i++)
	{
	 if(currentB == trackBoard[i])
	 {
		if(properThread == 1911)
		{
			properThread = trackBoard[i];
		}

		currentThread = trackThreadCount[i];
		for(var k=0;k<trackThreadCount.length;k++)
		{
			if(currentThread == trackThreadCount[k] && properThread == currentThread)
			{
				position.push(k);
			}
			
		}
		//get length of array
		if (position.length > 5)
		{
			var start = position.length - 5;
			var realArray=[];
			for(var p =start; p<position.length;p++)
			{
				realArray.push(trackPostCount[position[p]]);
			}
		}
		else
		{
			var realArray=[];
			for(var p =0; p<position.length;p++)
			{
				realArray.push(trackPostCount[position[p]]);
			}
		}
	 }

	}
		var obj = {latestPosts:realArray};
		var threadid = {threadId:currentThread};
		lynxUpdate("threads",threadid,obj,function()
		{

		});
		for(var q = 0;position.length; q++)
		{
			trackBoard.splice(position[q],1);
			trackThreadCount.splice(position[q],1);		
			trackPostCount.splice(position[q],1);		
		}
			
}

function arraySortAlgo(boards,array)
{
		var currentB=boards;
	var currentThread = "";
	var properThread = 1911;

	var position =[];
	//sort it 
	for(var i =0; i<trackBoard.length;i++)
	{
	 if(currentB == trackBoard[i])
	 {
		if(properThread == 1911)
		{
			properThread = trackBoard[i];
		}

		currentThread = trackThreadCount[i];
		for(var k=0;k<trackThreadCount.length;k++)
		{
			if(currentThread == trackThreadCount[k] && properThread == currentThread)
			{
				position.push(k);
			}
			
		}
		//get length of array
		if (position.length > 5)
		{
			var start = position.length - 5;
			var realArray=[];
			for(var p =start; p<position.length;p++)
			{
				realArray.push(trackPostCount[position[p]]);
			}
		}
		else
		{
			var realArray=[];
			for(var p =0; p<position.length;p++)
			{
				realArray.push(trackPostCount[position[p]]);
			}
		}
	 }

	}
		var obj = {latestPosts:realArray};
		var threadid = {threadId:currentThread};
		lynxUpdate("threads",threadid,obj,function()
		{

		});
		for(var q = 0;position.length; q++)
		{
			trackBoard.splice(position[q],1);
			trackThreadCount.splice(position[q],1);		
			trackPostCount.splice(position[q],1);		
		}
}

function boardCheck(board,post,mode)
{
	
	
	if(bor[0] == null)
	{
	  bor[0] = board;
	  if(mode == 1)
	  {
		threadidi[0] = post;
		threadcount[0] = 1;
			
	  }
	  else 
	  {
		postidi[0] = post;
	  }
	}
	else
	{
	  var len = bor.length;
	  var foundBoard = false;
	  for(var i =0;i<len;i++)
	  {
		if(board == bor[i])
		{
		  var foundi = i;
		  foundBoard = true;
		}
		

		if(foundBoard == true)
		{
		  if(mode == 1)
		  {
		    
		    threadidi[i] = post;
		    threadcount[i] = threadcount[i] + 1;
		   
		  }
		  else
		  {
	
		    postidi[i] = post;
		  }
		}
	  }

	  if(foundBoard == false)
	  {
		bor.push(board);
		threadidi.push(1911);
		threadcount.push(0);
		postidi.push(777);		
		  var len = bor.length;
		  var foundBoard = false;
		  for(var i =0;i<len;i++)
	 	 {
		if(board == bor[i])
		{
		  var foundi = i;
		  foundBoard = true;
		}
		

		if(foundBoard == true)
		{
		  if(mode == 1)
		  {
		    
		    threadidi[i] = post;
		    threadcount[i] = threadcount[i] + 1;
		  }
		  else
		  {
	
		    postidi[i] = post;
		  }
		}
	  	}
	  }
	  
	}

	//If board has post and thread.... remove this "patch"
	if(postidi[len-1] == postidi[len - 2])
	{
	  postidi[len-1] = "777";
	}

	var checkarry = [];
	//debug for loop
	for(var k =0;k<len;k++)
	{
	   if(k==0)
	   {
	   }
	   else
	   {
		//weird bug if no posts
		if(postidi[k] == postidi[k-1])
		{
			checkarry.push(k);
		}
	   }
	// console.log("Board: ",bor[k]," threadid: ",threadidi[k]," postidi: ",postidi[k]);
	}
	//clean
	for(var l =0; l<checkarry.length;l++)
	{
	   postidi[checkarry[l]] = "777";
	}

	for(var k=0; k<len;k++)
	{
	//   console.log("Board: ",bor[k]," threadid: ",threadidi[k]," postidi: ",postidi[k],"ThreadCount: ",threadcount[k]);
	}
//end patch
	//post it
	for(var p =0; p<len; p++)
	{
	 var bo = {boardUri:bor[p]};
		  if(threadidi[p] > postidi[p])
		  {
			var obj = {lastPostId: threadidi[p],threadCount:threadcount[p]};
		  }
		  else if(postidi[p] == "777")
		  {
			var obj = {lastPostId: threadidi[p],threadCount:threadcount[p]};
		  }
		  else
		  {
			var obj = {lastPostId: postidi[p],threadCount:threadcount[p]};
		  }
			lynxUpdate("boards",bo,obj, function(){

			});
	}

/*
console.log("board: ",state.board," Postid: ",state.postid," threadid: ",state.threadid);
	//mode = 1 - Thread, mode = 2, post
	if(state.board == board)
	{
	   if(mode == 1)
	   {
	   	
		state.threadid = post;	
	   }
	   else
	   {
		state.postid = post
           }	
	}
	else
	{
		if(state.board == null)
		{
		   if(mode == 1)
		   {
			state.threadid = post;
		   }
		   else
		   {
			state.postid = post;
 		   }
		}
		else
		{
		  if(state.threadid > state.postid)
		  {
			var obj = {lastPostId: state.threadid};
		  }
		  else
		  {
			var obj = {lastPostId: state.postid};
		  }

		 var bo = {boardUri:state.board};
		 console.log("Boaruri: ",bo.boardUri, "ID should be: ",obj.lastPostId);
			lynxUpdate("boards",bo,obj, function(){

			});
			
		}
	  //send off state and update board
	  state.board = board;
	//  state.threadid = 0;
	//  state.postid = 0;
	}

	*/
}


function getFileCount(uri,ThreadID,FileLength)
{
	
   if(FileLength == 1)
   {	
	if(fileBor[0] == null)
	{ 
	  fileBor[0] = uri;
	  fileThreadid[0] = ThreadID;
	  fileCountNum[0] = 1; 	
	}
	else
	{
	 var foundFlag=false;
	  for(var i =0; i<fileBor.length;i++)
	  {
	     if(fileBor[i] == uri)
	     {
		if(fileThreadid[i] == ThreadID)
		{
		  foundFlag = true;
		  fileCountNum[i] = fileCountNum[i] + 1;
		}
	     }
	  }
	  if(foundFlag == false)
	  {
		fileBor.push(uri);
		fileThreadid.push(ThreadID);
		fileCountNum.push(1);
	  }
	
	}
   }

	for(var k =0; k<fileBor.length;k++)
	{
	  console.log("Board: ",fileBor[k]," FileThreadID: ",fileThreadid[k]," fileCount: ",fileCountNum[k]);
	}

	for(var p =0; p<fileBor.length; p++)
	{
	 var bo = {boardUri:fileBor[p],threadId:fileThreadid[p]};
		
			var obj = {fileCount: fileCountNum[p]};
		  
		
			lynxUpdate("threads",bo,obj, function(){

			});
	}
	

}

//===========================END FINE ==============================
function buildFiles(thread,threadid) {
  // build files

 if(threadid == undefined)
{
  threadid = null;
}
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
	var tempo = fixImageUrl(infFile.file_path);
	var rthumb = fixThumb(infFile.thumb_path);
	buildGridMeta(infFile,thread,threadid,mimeType,tempo,rthumb,infFile.thumb_path);
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

function buildGridMeta(file,thread,reply,mimes,fixedfile,realthumb,thumb)
{
//todo remove pointless logging stuff since FUNC now works
  var isThread = true;
//console.log("Broke1");
  if(reply == null)
  {
  //  console.log("broke2");
  }
  else
  {
  //console.log("broke3");
   isThread = false;
  }
 // console.log("isThread?: " + isThread);
  //console.log("brok4");
	if(isThread == true)
	{
  	var obj = {
		boardUri:thread.uri,
		//boards = boards uri
		//expiration:,
		//get from thread id;
		threadId:thread.id,
		//postId:,
		//status:,
		//Get from thread
		//date:,
		type: "media",
		//lastModified:new Date(reply.time*1000),
	
		};
	}
	else
	{
	  var obj = {
		boardUri:thread.uri,
		//boards = boards uri
		//expiration:,
		//get from thread id;
		threadId:thread.id,
		postId:reply,
		//status:,
		//Get from thread
		type:"media",
		//lastModified: new Date(reply.time*1000) ,

	
		};	
	}
	//console.log("broke5");
	//writeFile = function(path, dest, mime, meta, callback, archive)

	writeFile(file.file_path,fixedfile,mimes,obj);
	writeFile(thumb,realthumb,mimes,obj);
	console.log(file.file_path +" "+ fixedfile + " " + mimes); 

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
      for(var k =0; k < replies.length; k++) {
	console.log("Board: ",uri," Replys.length: ", replies.length);
	findPostcount(uri,replies.length,thread.id);
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
              var files=buildFiles(reply,thread.id);
              if (files.length) {
                obj.files=files;
              }
		//console.log("Files length is? ",files.length);
		getFileCount(uri,thread.id,files.length);
		boardCheck(uri,reply.id,0);
             // console.log('would create', uri+'/'+thread.id+'/'+reply.id, obj);
		lynxCreate('posts', obj, function() {
      //          boardToLynx(uri);
			sortPostCount(gloBoards,0,0,null);
            });
	     console.log("at end of replies2lynx");
	     console.log("K is?",k);
	    //testing to see what return does
		//return;
           // }
         // }
        //});
      }
    }
  });
}

function findPostcount(uri,reply,threadid)
{
  var id = { boardUri: uri,
	     threadId: threadid
	  };

if(reply == 0)
{

}
else
{	if(reply > 5)
	{
	  reply = 5;
	}
  	var emptyArray = [0];

  	var postcount = {postCount: reply,latestPosts:emptyArray};

 	lynxUpdate("threads",id,postcount, function(){

	});
}	
}

function boardToLynx(uri) {
  // get a list of threads
  connection.query('SELECT * from posts_'+uri+' where thread IS NULL', function(err, threads) {

    console.log('found', threads.length, 'threads in', uri);
    // does this thread exist in LynxChan?
    for(var i =0; i < threads.length;i++) {
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
		
		//obviously its going to be one :^)
	   
	      	
		var obj={
                boardUri: uri,
                threadId: thread.id,
                creation: new Date(thread.time*1000),
                lastBump: new Date(thread.bump*1000),
		//Someboards have ID enabled
		id :null,
		email:null,
                ip: thread.ip.split(/\./),
		//postCount: 0,
		//Vichan supports only 1 file, Infinity supports multiple		
		fileCount: 0,
		page: 1,
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
            
              // what does NULL do? this isn't triggered on NULL
              if (thread.email) {
                //console.log('writing email', thread.email);
                obj.email=thread.email;
              }

		 var files=buildFiles(thread);
	
              if (files.length) {
                obj.files=files;
		
              }
		boardCheck(uri,thread.id,1);
             // console.log('would create thread', thread.id, obj);
	 	lynxCreate("threads",obj, function(){
		// console.log("Threads updated");	
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
	//console.log("TEMP IS: " + temp);
	if("/" == temp && firstSlash == false)
	{
	  firstSlash = true;
	//  console.log("thumbnail full is " + Act );
	//  console.log("location of first slash " + Act.substr(0,i));
	  foundSlash = Act.substr(0,i);
	  
	}
	else if("/" == temp && firstSlash == true && secondSlash == false)
	{
	   secondSlash = true;
	//   console.log("secondslas? ", secondSlash);
	//   console.log("location of second slash " + Act.substr(i+1,Act.length - i));
	   foundSecondSlash = Act.substr(i+1,Act.length - i);
	   
	}
  }
 // console.log(foundSlash + "/thumb/t_" + foundSecondSlash);
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
	//  console.log("found mimeType");	
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
	else if(mimeType == "gif")
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
 // console.log("Fiximageurl IMG? ",img);
  var firstSlash = false;
  var secondSlash = false;
  var foundSlash = "";
  var foundSecondSlash= "";
  for(var i =0; i<len; i++)
  {
	var temp = Act.substr(i,1);
	//console.log("TEMP IS: " + temp);
	if("/" == temp && firstSlash == false)
	{
	  firstSlash = true;
	  //console.log("thumbnail full is " + Act );
	  //console.log("location of first slash " + Act.substr(0,i));
	  foundSlash = Act.substr(0,i);
	  
	}
	else if("/" == temp && firstSlash == true && secondSlash == false)
	{
	   secondSlash = true;
	 //  console.log("secondslas? ", secondSlash);
	  // console.log("location of second slash " + Act.substr(i+1,Act.length - i));
	   foundSecondSlash = Act.substr(i+1,Act.length - i);
	   
	}
  }
 // console.log(foundSlash + "/media/" + foundSecondSlash);
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

function lynxUpdate(table,threadid,obj, callback){
  mondb.collection(table, function(err,col){
	col.update(threadid,{$set:obj},function(){
	//updating
		if(callback) {
		 callback();
		}
	});
	});
 
}

MongoClient.connect(url, function(err, conn) {
  mondb=conn;
  mong = mondb;
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
	gloBoards=boards;
	setBoardMods(board.uri);
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
	      owner: lynxModName,
              tags: [],
	      salt: board_salt,
            };

		
		//Function 
            lynxCreate('boards', obj, function() {
              //boardToLynx(board.uri);
              
	      console.log(" board should be created. :^( ", board.uri);
            });
	   boardToLynx(board.uri);
	   console.log("outside boardToLynx");

	      
       //   } else {
	    //console.log("MongoClient: if else statement. Board ",board.uri);
            //boardToLynx(board.uri);
          //}
        //});
      }
	setMod(boards);
	//sort post count
//	sortPostCount(boards,null,null,null);
    });
  });
 console.log("AT END OF IMPORT");
 getBanList();
  //setMod();
 moveStaffLog();
});

function sortPostCount(board,ID,currthread,currBoard)
{
	console.log("sortPost Count");
	//get board length
	var len = board.length;
	if(currBoard == null)
	{
	 currBoard = board[0].uri;
	}
	else 
	{
		//simple check
		for(var i in board)
		{
			if(currBoard == board[i].uri)
			{
			
			}
			else
			{
			 return;
			}
		}
	}
	//get current thread
	 connection.query('SELECT * from posts_' +currBoard+'where thread is null' , function(err, threads) {
	
	console.log("in Query");
	
	  if(!threads)
	   {
		console.log("No Thread", currBoard);
		var flag = false;
		for(var lel in board)
		{
		  if(board[lel] == currBoard)
		  {
			var kek =0;
			kek = lel + 1;
			if(kek < board.length && flag == false )
			{
				currBoard = board[kek].uri;
				flag = true;
			}
			else
			{
				return;
			}
			console.log(board.length);
		  }
		}
		sortPostCount(board,1,0,currBoard);
		
	   }
	   else
	   {

		console.log("Threads exist",currBoard);
	 	 for(var k in threads)
	 	 {
		 sortingPost(threads[k].thread,currBoard);
	  	 }

		var flag = false;
		for(var lel in board)
		{
		  if(board[lel] == currBoard)
		  {
			var kek =0;
			kek = lel + 1;
			if(kek < board.length && flag == false )
			{
				currBoard = board[kek].uri;
				flag = true;
			}
			else
			{
				return;
			}
		  }
		}
		sortPostCount(board,0,0,currBoard);		
	   }

	});

}

function sortingPost(Thread,board)
{
	connection.query('SELECT * from posts_'+board+'Where thread='+Thread, function(err, thred){
		
		if(!thred)
		{
			var postcount = 0;
			var Lastposts = [];
		}
		else
		{
			var postcount = thred.length;
			var Lastposts = [];
			var lastFive = thred[k] - 5;
			for(var k=0;k<thred.length;k++)
			{
				if(thred[k] > 5)
				{

					if(k>5 && k>= lastFive)
					{
					 Lastposts.push(thred[k].id);

					}
				}
				else
				{
					Lastposts.push(thred[k].id);
				}

			}

		}

		var thredObj = {
			postCount:postcount,
			latestPosts:Lastposts
		};
			var setObj = {
				threadId:Thread
			};
		console.log("Objs");
		console.log("Thread");
		console.log(threadObj);
		console.log(setObj);

		 lynxUpdate("threads",setObj,thredObj, function(){
		});

 
	});
}


//Nicked from LynxChan be/engine/gridFsHandler.js

function writeFile(path, dest, mime, meta) {
 //console.log("WRITE FILE CALLED!");
  meta.lastModified = new Date();

//  if (verbose) {
    var message = 'Writing ' + mime + ' file on gridfs under \'';
    message += dest + '\'';
    console.log(message);
//  }

//  var gs = mongo.GridStore(conn, dest, 'w', {
    var gs = mongo.GridStore(mondb, dest,'w',{
    'content_type' : mime,
    metadata : meta
  });

  gs.open(function openedGs(error, gs) {

    if (error) {
      callback(error);
    } else {
          writeFileOnOpenFile(gs, path, dest, meta, mime);
    }
  });

};

var writeFileOnOpenFile = function(gs, path, destination, meta, mime) {
  gs.writeFile(path, function wroteFile(error) {

    // style exception, too simple
    gs.close(function closed(closeError, result) {
      if ( error) {
//        callback(error || closeError);
      } else {
      //  archiveHandler.writeFile(path, destination, mime, meta, callback);
      }

    });
    // style exception, too simple

  });
};
