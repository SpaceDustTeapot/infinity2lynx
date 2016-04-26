'use strict';

var mongo = require('mongodb');
var connection = require('./mysqlDb').connection;
var crypto = require('crypto');
var mondb = require('./mongoDb').conn();
var boardPath;
var lynxModName;

var gloBoards;

var state = {
  board : null,
  postid : 0,
  threadid : 0
};

var bor = [ null ];
var postidi = [ null ];
var threadidi = [ null ];
var threadcount = [ null ];

var fileBor = [ null ];
var fileThreadid = [ null ];
var fileCountNum = [ null ];

var modboards = [ null ];

var trackThreadCount = [ null ];
var trackPostCount = [ null ];
var trackBoard = [ null ];
var discarded = [];

var logArray = [];

function setMod(Bo) {
  var astFlag = false;
  var astCount = 0;

  connection.query('SELECT * from mods', function(err, mods) {
    for ( var i in mods) {
      var modz = mods[i];
      if (!modz) {
        lynxCreate('users', mod);
      } else {

        // Infinitys mod table is different
        var mod = {
          login : modz.username,
          password : modz.password,
          passwordSalt : modz.salt,
          passwordMethod : 'vichan',
          ownedBoards : null,
          globalRole : 1,
          volunteeredBoards : null

        };

        if (modz.type === 30) {
          mod.globalRole = 1;
        } else if (modz.type === 20) {
          mod.globalRole = 2;
        } else if (modz.type === 10) {
          mod.globalRole = 3;
        }

        if (modz.boards === '*') {
          var owned = [];

          if (astFlag === false) {
            for ( var l in mods) {
              if (mods[l].boards === '*') {
                if (mods[l].type === 30) {
                  astFlag = true;
                  astCount = astCount + 1;
                }
              }
            }
          }

          for ( var k in Bo) {
            var Boards = Bo[k];
            owned.push(Boards.uri);
          }
          if (astCount > 1) {
            if (mod.login === lynxModName) {
              mod.ownedBoards = owned;
            } else {
              mod.volunteeredBoards = owned;
            }
          } else {
            mod.ownedBoards = owned;
          }

        } else {

          var boards = modz.boards;
          var len = boards.length;
          var lastLocComma = 9000;
          owned = [];
          var lastLocEntry = 0;
          var found = false;

          for (k = len - 1; 0 <= k; k--) {

            if (boards.substr(k, 1) === ',' && found === false) {
              found = true;
              lastLocEntry = k;

            }

          }

          for (l = 0; l < len; l++) {
            if (lastLocEntry === l) {
              var ttemp = len - 1;
              var start = lastLocEntry + 1;

              owned.push(boards.substr(start, ttemp));
            }
            if (boards.substr(l, 1) === ',') {

              if (lastLocComma === 9000) {
                owned.push(boards.substr(0, l));

                lastLocComma = l;
              } else {

                lastLocComma = lastLocComma + 1; // move lastloc comma onto a
                // actually number instead
                var temp = l - lastLocComma;

                owned.push(boards.substr(lastLocComma, temp));
              }

            }

          }
        }

        if (modz.boards !== '*') {
          mod.volunteeredBoards = owned;
        }

        lynxCreate('users', mod);
      }
    }
  });
}

function setBoardMods(board) {
  // Depricated

  if (modboards[0] === null) {
    modboards[0] = board;
  } else {
    modboards.push(board);
  }

  var modd = {
    login : lynxModName
  };
  var obj = {
    ownedBoards : modboards
  };

}

function getBanList() {

  connection.query('SELECT * from bans', function(err, bans) {
    for ( var i in bans) {
      var ban = bans[i];
      if (!ban) {

      } else {

        if (ban.expires === null) {
          var expdate = null;
        } else {
          expdate = new Date(ban.expires * 1000);
        }

        var banObj = {
          appliedBy : lynxModName,
          boardUri : ban.board,
          reason : ban.reason,
          denied : ban.seen,
          ip : ban.ipstart
        };

        var blob = parseInt(banObj.ip[0]);
        var ipArray = [];

        // create IP array
        for (i = 0; i < 4; i++) {
          ipArray.push(banObj.ip[i]);
        }

        banObj.ip = ipArray;

        lynxCreate('bans', banObj);
      }
    }

  });
}

function moveStaffLog() {

  connection.query('SELECT * from modlogs', function(err, logs) {
    for ( var i in logs) {
      var len = logs.length;
      var logz = logs[i];
      if (!logz) {

      } else {
        var logObj = {
          user : 'admin',
          type : 'boardTransfer',
          time : new Date(logz.time * 1000),
          boardUri : logz.board,
          description : logz.text,
          global : 0
        };

        if (logz.board === null) {
          logObj.global = 1;
        }

        lynxCreate('staffLogs', logObj);

      }
    }

  });

}

function getLastFivePosts(board, post, threadid) {

  // Five because its default
  var trackThreadCount = [ null ];
  var trackPostCount = [ null ];

  if (trackThreadCount[0] === null) {
    trackThreadCount[0] = threadid;
    trackPostCount[0] = post;
    trackBoard[0] = board;
  } else {
    trackThreadCount.push(threadid);
    trackPostCount.push(post);
    trackBoard.push(board);
    for (var l = 0; l < trackBoard.length; l++) {
      for (var weeb = 0; weeb < discarded.length; weeb++) {

        if (trackBoard[l] !== discarded[weeb]) {
          discarded.push(trackBoard[l]);
        }

      }
    }

  }

  var currentB = '';
  var currentThread = '';
  var properThread = 1911;

  var position = [];
  // sort it
  for (var i = 0; i < trackBoard.length; i++) {
    if (currentB === trackBoard[i]) {
      if (properThread === 1911) {
        properThread = trackBoard[i];
      }

      currentThread = trackThreadCount[i];
      for (var k = 0; k < trackThreadCount.length; k++) {
        if (currentThread === trackThreadCount[k]
            && properThread === currentThread) {
          position.push(k);
        }

      }
      // get length of array
      if (position.length > 5) {
        var start = position.length - 5;
        var realArray = [];
        for (var p = start; p < position.length; p++) {
          realArray.push(trackPostCount[position[p]]);
        }
      } else {
        realArray = [];
        for (p = 0; p < position.length; p++) {
          realArray.push(trackPostCount[position[p]]);
        }
      }
    }

  }
  var obj = {
    latestPosts : realArray
  };
  threadid = {
    threadId : currentThread
  };
  lynxUpdate('threads', threadid, obj, function() {

  });
  for (var q = 0; position.length; q++) {
    trackBoard.splice(position[q], 1);
    trackThreadCount.splice(position[q], 1);
    trackPostCount.splice(position[q], 1);
  }

}

function arraySortAlgo(boards, array) {
  var currentB = boards;
  var currentThread = '';
  var properThread = 1911;

  var position = [];

  for (var i = 0; i < trackBoard.length; i++) {
    if (currentB === trackBoard[i]) {
      if (properThread === 1911) {
        properThread = trackBoard[i];
      }

      currentThread = trackThreadCount[i];
      for (var k = 0; k < trackThreadCount.length; k++) {
        if (currentThread === trackThreadCount[k]
            && properThread === currentThread) {
          position.push(k);
        }

      }

      if (position.length > 5) {

        var start = position.length - 5;
        var realArray = [];
        for (var p = start; p < position.length; p++) {
          realArray.push(trackPostCount[position[p]]);
        }

      } else {

        realArray = [];

        for (p = 0; p < position.length; p++) {
          realArray.push(trackPostCount[position[p]]);
        }
      }
    }

  }
  var obj = {
    latestPosts : realArray
  };
  var threadid = {
    threadId : currentThread
  };
  lynxUpdate('threads', threadid, obj, function() {

  });
  for (var q = 0; position.length; q++) {
    trackBoard.splice(position[q], 1);
    trackThreadCount.splice(position[q], 1);
    trackPostCount.splice(position[q], 1);
  }
}

function boardCheck(board, post, mode) {

  if (bor[0] === null) {
    bor[0] = board;
    if (mode === 1) {
      threadidi[0] = post;
      threadcount[0] = 1;

    } else {
      postidi[0] = post;
    }
  } else {
    var len = bor.length;
    var foundBoard = false;
    for (var i = 0; i < len; i++) {
      if (board === bor[i]) {
        var foundi = i;
        foundBoard = true;
      }

      if (foundBoard === true) {
        if (mode === 1) {

          threadidi[i] = post;
          threadcount[i] = threadcount[i] + 1;

        } else {

          postidi[i] = post;
        }
      }
    }

    if (foundBoard === false) {
      bor.push(board);
      threadidi.push(1911);
      threadcount.push(0);
      postidi.push(777);
      len = bor.length;

      foundBoard = false;

      for (i = 0; i < len; i++) {
        if (board === bor[i]) {
          foundi = i;
          foundBoard = true;
        }

        if (foundBoard === true) {
          if (mode === 1) {

            threadidi[i] = post;
            threadcount[i] = threadcount[i] + 1;
          } else {

            postidi[i] = post;
          }
        }
      }
    }

  }

  if (postidi[len - 1] === postidi[len - 2]) {
    postidi[len - 1] = '777';
  }

  var checkarry = [];

  for (var k = 0; k < len; k++) {
    if (k === 0) {
    } else {

      if (postidi[k] === postidi[k - 1]) {
        checkarry.push(k);
      }
    }

  }

  for (var l = 0; l < checkarry.length; l++) {
    postidi[checkarry[l]] = '777';
  }

  for (var p = 0; p < len; p++) {
    var bo = {
      boardUri : bor[p]
    };
    if (threadidi[p] > postidi[p]) {
      var obj = {
        lastPostId : threadidi[p],
        threadCount : threadcount[p]
      };
    } else if (postidi[p] === '777') {
      obj = {
        lastPostId : threadidi[p],
        threadCount : threadcount[p]
      };
    } else {
      obj = {
        lastPostId : postidi[p],
        threadCount : threadcount[p]
      };
    }

    lynxUpdate('boards', bo, obj, function() {

    });
  }

}

function getFileCount(uri, ThreadID, FileLength) {

  if (FileLength === 1) {
    if (fileBor[0] === null) {
      fileBor[0] = uri;
      fileThreadid[0] = ThreadID;
      fileCountNum[0] = 1;
    } else {
      var foundFlag = false;
      for (var i = 0; i < fileBor.length; i++) {
        if (fileBor[i] === uri) {
          if (fileThreadid[i] === ThreadID) {
            foundFlag = true;
            fileCountNum[i] = fileCountNum[i] + 1;
          }
        }
      }
      if (foundFlag === false) {
        fileBor.push(uri);
        fileThreadid.push(ThreadID);
        fileCountNum.push(1);
      }

    }
  }

  for (var p = 0; p < fileBor.length; p++) {
    var bo = {
      boardUri : fileBor[p],
      threadId : fileThreadid[p]
    };

    var obj = {
      fileCount : fileCountNum[p]
    };

    lynxUpdate('threads', bo, obj, function() {

    });
  }

}

function buildFiles(thread, threadid) {
  // build files

  if (threadid === undefined) {
    threadid = null;
  }
  var files = [];
  if (thread.files) {
    try {
      var infFiles = JSON.parse(thread.files);

      for (var j = 0; j < infFiles.length; j++) {
        var infFile = infFiles[j];
        var mimeType = getMime(infFile.file_path);
        if (mimeType === 'ERROR') {
          mimeType = 'INVALID!';
        }
        var tempo = fixImageUrl(infFile.file_path);
        var rthumb = fixThumb(infFile.thumb_path);

        buildGridMeta(infFile, thread, threadid, mimeType, tempo, rthumb,
            infFile.thumb_path);
        infFile.thumb_path = fixThumb(infFile.thumb_path);
        infFile.file_path = fixImageUrl(infFile.file_path);
        files.push({
          originalName : infFile.name,
          path : infFile.file_path,
          mime : mimeType,
          thumb : infFile.thumb_path,
          name : infFile.file,
          size : infFile.size,
          md5 : infFile.hash,
          width : infFile.width,
          height : infFile.height
        });
      }
    } catch (e) {
      console.log(e);

    }
  }
  return files;
}

function buildGridMeta(file, thread, reply, mimes, fixedfile, realthumb, thumb) {

  var isThread = true;

  if (reply === null) {

  } else {

    isThread = false;
  }

  if (isThread === true) {
    var obj = {
      boardUri : thread.uri,

      threadId : thread.id,

      type : 'media',

    };
  } else {

    var obj = {
      boardUri : thread.uri,
      threadId : thread.id,
      postId : reply,
      type : 'media'
    };
  }

  writeFile(file.file_path, fixedfile, mimes, obj);
  writeFile(thumb, realthumb, mimes, obj);

}

function repliesToLynx(uri, thread, callback) {
  // get a list of all threads' posts
  connection.query('SELECT * from posts_' + uri + ' where thread=' + thread.id,
      function(err, replies) {
        if (err) {
          console.error('boardToLynx - mysql.replies', err);
        } else {
          if (!replies) {
            return; // no replies, no work
          }

          for (var k = 0; k < replies.length; k++) {

            findPostcount(uri, replies.length, thread.id);
            var reply = replies[k];

            var reply_salt = crypto.createHash('sha256').update(
                'gunshot gunshot Cash registernoise' + Math.random()
                    + new Date()).digest('hex');
            // stipe message of tabs and stuff
            var replymessage = reply.body_nomarkup.toLowerCase().replace(
                /[ \n\t]/g, '');
            var objreplymessage = crypto.createHash('md5').update(replymessage)
                .digest('base64');
            var obj = {
              boardUri : uri,
              threadId : thread.id,
              postId : reply.id,
              creation : new Date(reply.time * 1000),
              ip : reply.ip.split(/\./),
              message : reply.body_nomarkup,
              hash : objreplymessage, // stuff used for R9K
              salt : reply_salt, // ID generation
              name : reply.name,
              subject : reply.subject, // empty subject is null in lynx too
              markdown : reply.body,
            };

            if (reply.password) {
              obj.password = reply.password;
            }
            if (reply.email) {

              obj.email = thread.email;
            }
            var files = buildFiles(reply, thread.id);
            if (files.length) {
              obj.files = files;
            }

            getFileCount(uri, thread.id, files.length);
            boardCheck(uri, reply.id, 0);

            lynxCreate('posts', obj);

          }
        }
      });
}

function findPostcount(uri, reply, threadid) {
  var id = {
    boardUri : uri,
    threadId : threadid
  };

  if (reply === 0) {

  } else {
    if (reply > 5) {
      reply = 5;
    }
    var emptyArray = [ 0 ];

    var postcount = {
      postCount : reply,
      latestPosts : emptyArray
    };

    lynxUpdate('threads', id, postcount, function() {

    });
  }
}

function boardToLynx(uri) {
  // get a list of threads
  connection.query('SELECT * from posts_' + uri + ' where thread IS NULL',
      function(err, threads) {

        // does this thread exist in LynxChan?
        for (var i = 0; i < threads.length; i++) {
          var thread = threads[i];

          var scopeLoop = function(thread) {

            var thread_salt = crypto.createHash('sha256').update(
                'gunshot gunshot Cash registernoise' + Math.random()
                    + new Date()).digest('hex');

            var threadmessage = thread.body_nomarkup.toLowerCase().replace(
                /[ \n\t]/g, '');
            var objthreadmessage = crypto.createHash('md5').update(
                threadmessage).digest('base64');

            var obj = {
              boardUri : uri,
              threadId : thread.id,
              creation : new Date(thread.time * 1000),
              lastBump : new Date(thread.bump * 1000),
              id : null,
              email : null,
              ip : thread.ip.split(/\./),
              fileCount : 0,
              page : 1,
              message : thread.body_nomarkup,
              hash : objthreadmessage,// used for r9k
              salt : thread_salt,
              name : thread.name,
              pinned : thread.sticky ? true : false,
              locked : thread.locked ? true : false,
              subject : thread.subject, // empty subject is null in lynx too
              password : thread.password,
              markdown : thread.body,
            };

            if (thread.email) {
              obj.email = thread.email;
            }

            var files = buildFiles(thread);

            if (files.length) {
              obj.files = files;

            }
            boardCheck(uri, thread.id, 1);

            lynxCreate('threads', obj);

            repliesToLynx(uri, thread, function() {
            });

          }(thread);
        }
      });
}

function fixThumb(th) {

  var len = th.length;
  var Act = th;
  var firstSlash = false;
  var secondSlash = false;
  var foundSlash = '';
  var foundSecondSlash = '';
  for (var i = 0; i < len; i++) {
    var temp = Act.substr(i, 1);

    if ('/' === temp && firstSlash === false) {
      firstSlash = true;
      // 
      foundSlash = Act.substr(0, i);

    } else if ('/' === temp && firstSlash === true && secondSlash === false) {
      secondSlash = true;

      foundSecondSlash = Act.substr(i + 1, Act.length - i);

    }
  }

  return '/' + foundSlash + '/thumb/t_' + foundSecondSlash;

}

function getMime(img) {
  var len = img.length

  var foundDot = false;
  var mimeType = '';
  for (var i = 0; i < len; i++) {

    var temp = img.substr(i, 1);

    if (temp === '.' && foundDot === false) {
      foundDot = true;
      mimeType = img.substr(i + 1, img.length - i);

    }

  }

  if (foundDot === true) {
    if (mimeType === 'png') {
      mimeType = 'image/png';
    } else if (mimeType === 'jpg' || mimeType === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (mimeType === 'gif') {
      mimeType = 'image/gif';
    } else if (mimeType === 'bmp') {
      mimeType = 'image/bmp';
    } else if (mimeType === 'webm') {
      mimeType = 'video/webm';
      // Also accepts Audio webums
    } else if (mimeType === 'mpeg') {
      mimeType = 'audio/mpeg';
    } else if (mimeType === 'mp4') {
      mimeType = 'video/mp4';
    } else if (mimeType === 'ogg') {
      mimeType = 'video/ogg';
    } else {
      console.log('ERROR: Invalid video format?');
      return 'ERROR';
    }
    return mimeType;

  }
}

function fixImageUrl(img) {
  var len = img.length;
  var Act = img;

  var firstSlash = false;
  var secondSlash = false;
  var foundSlash = '';
  var foundSecondSlash = '';
  for (var i = 0; i < len; i++) {
    var temp = Act.substr(i, 1);

    if ('/' === temp && firstSlash === false) {
      firstSlash = true;

      foundSlash = Act.substr(0, i);

    } else if ('/' === temp && firstSlash === true && secondSlash === false) {
      secondSlash = true;

      foundSecondSlash = Act.substr(i + 1, Act.length - i);

    }
  }

  return '/' + foundSlash + '/media/' + foundSecondSlash;

}

function lynxCreate(table, obj, callback) {
  mondb.collection(table, function(err, col) {
    col.insert(obj, function() {
      // console.log('inserting into DB');
      if (callback) {
        callback();
      }
    });
  });
}

function lynxUpdate(table, threadid, obj, callback) {
  mondb.collection(table, function(err, col) {
    col.update(threadid, {
      $set : obj
    }, function() {
      // updating
      if (callback) {
        callback();
      }
    });
  });

}

exports.init = function(modName, path) {

  lynxModName = modName;
  boardPath = path;

  connection.query('SELECT * from boards', function(err, boards) {

    for ( var i in boards) {

      var board = boards[i];
      gloBoards = boards;
      setBoardMods(board.uri);

      var board_salt = crypto.createHash('sha256').update(
          'gunshot gunshot Cash registernoise' + Math.random() + new Date())
          .digest('hex');

      var obj = {
        boardUri : board.uri,
        boardName : board.title,
        boardDescription : board.subtitle,
        settings : [ 'disableIds', 'requireThreadFile' ],
        owner : lynxModName,
        tags : [],
        salt : board_salt,
      };

      lynxCreate('boards', obj);

      boardToLynx(board.uri);

    }

    setMod(boards);

  });

  getBanList();

  moveStaffLog();
};

function sortPostCount(board, ID, currthread, currBoard) {

  var len = board.length;
  if (currBoard === null) {
    currBoard = board[0].uri;
  } else {

    for ( var i in board) {
      if (currBoard === board[i].uri) {

      } else {
        return;
      }
    }
  }

  connection.query('SELECT * from posts_' + currBoard + 'where thread is null',
      function(err, threads) {

        console.log('in Query');

        if (!threads) {
          console.log('No Thread', currBoard);
          var flag = false;
          for ( var lel in board) {
            if (board[lel] === currBoard) {
              var kek = 0;
              kek = lel + 1;
              if (kek < board.length && flag === false) {
                currBoard = board[kek].uri;
                flag = true;
              } else {
                return;
              }

              console.log(board.length);
            }
          }

          sortPostCount(board, 1, 0, currBoard);

        } else {

          for ( var k in threads) {
            sortingPost(threads[k].thread, currBoard);
          }

          var flag = false;

          //
          for ( var lel in board) {
            if (board[lel] === currBoard) {
              var kek = 0;
              kek = lel + 1;
              if (kek < board.length && flag === false) {
                currBoard = board[kek].uri;
                flag = true;
              } else {
                return;
              }
            }
          }

          sortPostCount(board, 0, 0, currBoard);
        }

      });

}

function sortingPost(Thread, board) {

  connection.query('SELECT * from posts_' + board + 'Where thread=' + Thread,
      function(err, thred) {

        if (!thred) {
          var postcount = 0;
          var Lastposts = [];
        } else {
          var postcount = thred.length;
          var Lastposts = [];
          var lastFive = thred[k] - 5;
          for (var k = 0; k < thred.length; k++) {
            if (thred[k] > 5) {

              if (k > 5 && k >= lastFive) {
                Lastposts.push(thred[k].id);

              }
            } else {
              Lastposts.push(thred[k].id);
            }

          }

        }

        var thredObj = {
          postCount : postcount,
          latestPosts : Lastposts
        };
        var setObj = {
          threadId : Thread
        };

        lynxUpdate('threads', setObj, thredObj, function() {
        });

      });
}

function writeFile(path, dest, mime, meta) {

  path = boardPath + path;

  meta.lastModified = new Date();

  var gs = mongo.GridStore(mondb, dest, 'w', {
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
      if (error) {
        console.log(error || closeError);
      }

    });
    // style exception, too simple

  });
};