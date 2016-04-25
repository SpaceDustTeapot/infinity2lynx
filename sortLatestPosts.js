//============================= FINE ===========================
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var assert = require('assert');
var mysql      = require('mysql');
var crypto = require('crypto');
var async = require('async');
 //Grid = mongo.Grid;
// CONFIG
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'spacedust',
  password : 'niceone',
  database : 'vichan2'
});
var url = 'mongodb://localhost:27017/lynxchan';

//Write your login user name of who owns the instance of lynxchan
var lynxModName = "spacedust";
//var board[];


// setup
var mondb=null;

var BoName =[];
var BoThread =[];
var aCount =0;


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
    console.log('connected to mysql server');
   
    connection.query('SELECT * from boards', function(err, boards) {
	 async.eachSeries(boards, function(item, callback){
	//console.log("Console", item);	 
	for(var i in boards) {
	//console.log("i is:", i);
        var board=boards[i];
	gloBoards=boards;
	//setBoardMods(board.uri);

		connection.query('SELECT * from posts_'+board.uri+' where thread is null' , function(err, threads) {
		
		thread = threads.length;
	console.log(err);
	//console.log("in Query");	
	//console.log("threads",thread);
	//console.log(threads);
	//console.log(board.uri);

	 for(var k in threads)
	{
	console.log(board.uri,"inloop");
	var thrd = threads[k];
	//console.log("REEEEEEEEEEEEEEEEEEEE",thrd);
	console.log("thrd.id",thrd.id);
	//console.log("console Thumb",thrd.files["thumb_path"]);
	var rBoard = getBoard(thrd.files);
	 BoName.push(rBoard);
         BoThread.push(thrd.id);

	connection.query('SELECT * from posts_'+rBoard+' Where thread='+thrd.id, function(err, thred){
	 async.eachSeries(thred, function(item, callback){
	if(!thred)
	{
		console.log("threads is ",threads);
	}

		console.log("error?",err);
		//console.log("Thred",thred);
		console.log("BOName",BoName);
		console.log("BoThread",BoThread);
		console.log("thred len",thred.length);
		console.log("array count", aCount);
		var flag = false;
		var Bo = "";
		for(var m in thred)
		{
		    var ret = getPostBoard(thred[m].files);
		    console.log(thred[m].files);
		    if(ret == null && flag == false)
		    {
				
		    }
		    else
		    {
			flag = true;
			Bo = ret;
		    }
		
		}
		

		if( flag == false)
		{
			Bo = null;
		}

		if(Bo == null)
		{
			console.log("Board NOT FOUND");
			console.log("using Body instead");
			var postcount = thred.length;
			var Lastposts = [];
//			var lastFive = thred[k] - 5;
			//for(var k=0;k<thred.length;k++)
			//{
				
			//}
			if(postcount > 5)
			{
			  var lastFive = postcount - 5;
			  for(var lel = lastFive;lel<postcount;lel++)
			  {
				Lastposts.push(thred[lel].id);
			  }
			}
			else
			{
				for(var lel =0;lel<postcount;lel++)
				{
				 Lastposts.push(thred[lel].id);
				}
			}

		

		var thredObj = {
			postCount:postcount,
			latestPosts:Lastposts
		};
			var setObj = {
				threadId:thred[0].thread,
				boardUri:thred[0].email
			};
		console.log("Objs");
		console.log("Thread");
		console.log(thredObj);
		console.log(setObj);

		 lynxUpdate("threads",setObj,thredObj, function(){
		});

				
		}
		else
		{
			var postcount = thred.length;
			var Lastposts = [];
//			var lastFive = thred[k] - 5;
			//for(var k=0;k<thred.length;k++)
			//{
				
			//}
			if(postcount > 5)
			{
			  var lastFive = postcount - 5;
			  for(var lel = lastFive;lel<postcount;lel++)
			  {
				Lastposts.push(thred[lel].id);
			  }
			}
			else
			{
				for(var lel =0;lel<postcount;lel++)
				{
				 Lastposts.push(thred[lel].id);
				}
			}

		

		var thredObj = {
			postCount:postcount,
			latestPosts:Lastposts
		};
			
			var setObj = {
				threadId:thred[0].thread,
				boardUri:Bo
				
			};
		console.log("Objs");
		console.log("Thread");
		console.log(thredObj);
		console.log(setObj);

		 lynxUpdate("threads",setObj,thredObj, function(){
		});
		}


		//Function 
           // lynxCreate('boards', obj, function() {
              //boardToLynx(board.uri);
              
	    //  console.log(" board should be created. :^( ", board.uri);
           // });
//	   boardToLynx(board.uri);
//	   console.log("outside boardToLynx");
	
//	console.log("Calling SortPostCount");
//	sortPostCount(boards,null,null,board.uri);

	Count = aCount + 1;
			        });
		});
	}
	});
      }

    });
  });
 });

});


function sortPostCount(board,ID,currthread,currBoard)
{
	//console.log("ID",ID);
	//console.log("sortPost Count");
	console.log("cur", currBoard);
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
	
	 async.eachSeries(threads, function(item, callback){
	if(threads == null)
	{
		console.log("threads is ",threads);
	}


	console.log(err);
	console.log("inside ID",ID);
	console.log("in Query");	
	console.log("threads",item.length);
	console.log("boards",currBoard);
	console.log(item);

	  if(!threads)
	   {
		//do nothing :^(
	  }
	  else
	  {
	   
	   console.log("threads");
		//sorting post
	    for(var lel = 0; lel < board.length;lel++)
	   {
		sortingPost(threads[lel].thread,currBoard);
	   }
	}
	});
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


function getBoard(file)
{
	console.log(file);
	 var infFiles=JSON.parse(file);
//	 console.log(infFiles[0].thumb_path);
	 var fi = infFiles[0].thumb_path;	
	 for(var i=0;i<fi.length;i++)
	{
		var temp = fi.substr(i,1);
	//	console.log("TEMP!",temp);
		if(temp == "/")
		{
			var returned_val = fi.substr(0,i);
			console.log("fi IS",returned_val);
			return returned_val;
		}
	}
}

function getPostBoard(file)
{
	if(file == null)
	{
		return null;
	}

		 var infFiles=JSON.parse(file);
//	 console.log(infFiles[0].thumb_path);
	 var fi = infFiles[0].thumb_path;	
	 for(var i=0;i<fi.length;i++)
	{
		var temp = fi.substr(i,1);
	//	console.log("TEMP!",temp);
		if(temp == "/")
		{
			var returned_val = fi.substr(0,i);
			console.log("fi IS",returned_val);
			return returned_val;
		}
	}
	

}
