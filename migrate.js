'use strict';

var mongoHandler = require('./mongoDb');
var mongo = require('mongodb');
var connection = require('./mysqlDb').connection;
var crypto = require('crypto');
var users = mongoHandler.users();
var threads = mongoHandler.threads();
var mondb = mongoHandler.conn();
var posts = mongoHandler.posts();
var boards = mongoHandler.boards();
var boardPath;
var lynxModName;

// Mod migration {
function migrateMod(foundMod, callback) {

  console.log('Migrating mod ' + foundMod.username);

  var mod = {
    login : foundMod.username,
    password : foundMod.password,
    passwordSalt : foundMod.salt,
    passwordMethod : 'vichan',
    ownedBoards : [],
    volunteeredBoards : null

  };

  switch (foundMod.type) {
  case 30:
    mod.globalRole = 1;
    break;
  case 20:
    mod.globalRole = 2;
    break;
  default:
    mod.globalRole = 3;
  }

  users.insertOne(mod, callback);

}

function iterateMods(foundMods, callback, index) {

  index = index || 0;

  if (index >= foundMods.length) {
    callback();
    return;

  }

  migrateMod(foundMods[index], function migratedMod(error) {

    if (error && error.code !== 11000) {
      callback(error);
    } else {
      iterateMods(foundMods, callback, ++index);
    }

  });
}

function migrateMods(callback) {

  connection.query('SELECT * from mods', function(err, foundMods) {
    iterateMods(foundMods, callback);
  });

}

// } Mod migration

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

function buildFiles(uri, thread, threadid) {

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

        buildGridMeta(uri, infFile, thread, threadid, mimeType, tempo, rthumb,
            infFile.thumb_path, function migratedFiles(error) {

              // TODO
              if (error) {
                console.log(error);
              } else {

              }

            });

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
    } catch (error) {
      console.log(error);
    }
  }

  return files;
}

function buildGridMeta(uri, file, thread, reply, mimes, fixedfile, realthumb,
    thumb, callback) {

  var obj = {
    boardUri : uri,
    threadId : thread.id,
    type : 'media'
  };

  if (reply) {
    obj.postId = thread.id;
    obj.threadId = reply;
  }

  writeFile(file.file_path, fixedfile, mimes, obj, function wroteFile(error) {

    if (error) {
      callback(error);
    } else {
      writeFile(thumb, realthumb, mimes, obj, callback);
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

// Gridfs handling {
function writeFile(path, dest, mime, meta, callback) {

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
      writeFileOnOpenFile(gs, path, dest, meta, mime, callback);
    }
  });

}

function writeFileOnOpenFile(gs, path, destination, meta, mime, callback) {

  gs.writeFile(path, function wroteFile(error) {

    // style exception, too simple
    gs.close(function closed(closeError, result) {
      callback(error || closeError);
    });
    // style exception, too simple

  });
}
// } Gridfs handling

// Misc functions {
function getMessageHash(message) {

  message = message.toLowerCase().replace(/[ \n\t]/g, '');

  return crypto.createHash('md5').update(message).digest('base64');

}
// } Misc functions

// Board migration {

// Thread migration {

// Reply migration {
function migrateReply(uri, thread, reply, callback) {

  console.log('Migrating reply ' + reply.id);

  posts.insertOne({
    boardUri : uri,
    threadId : thread.id,
    postId : reply.id,
    creation : new Date(reply.time * 1000),
    ip : reply.ip.split(/\./),
    message : reply.body_nomarkup,
    hash : getMessageHash(reply.body_nomarkup),
    name : reply.name,
    subject : reply.subject,
    markdown : reply.body,
    password : reply.password,
    email : reply.email,
    files : buildFiles(uri, reply, thread.id)
  }, callback);

}

function iterateReplies(uri, thread, foundReplies, callback, index) {

  index = index || 0;

  if (index >= foundReplies.length) {
    callback();
    return;
  }

  migrateReply(uri, thread, foundReplies[index], function migratedReply(error) {

    if (error) {
      callback(error);
    } else {
      iterateReplies(uri, thread, foundReplies, callback, ++index);
    }

  });

}

function migrateReplies(uri, thread, callback) {

  connection.query('SELECT * from posts_' + uri + ' where thread=' + thread.id,
      function(error, foundReplies) {

        if (error) {
          callback(error);
        } else {
          iterateReplies(uri, thread, foundReplies, callback);
        }

      });
}
// } Reply migration

function migrateThread(uri, thread, callback) {

  console.log('Migrating thread ' + thread.id);

  var thread_salt = crypto.createHash('sha256').update(
      'gunshot gunshot Cash registernoise' + Math.random() + new Date())
      .digest('hex');

  threads.insertOne({
    boardUri : uri,
    threadId : thread.id,
    creation : new Date(thread.time * 1000),
    lastBump : new Date(thread.bump * 1000),
    id : null,
    email : null,
    ip : thread.ip.split(/\./).map(function(element) {
      return +element;
    }),
    fileCount : 0,
    page : 1,
    message : thread.body_nomarkup,
    hash : getMessageHash(thread.body_nomarkup),
    salt : thread_salt,
    name : thread.name,
    pinned : thread.sticky ? true : false,
    locked : thread.locked ? true : false,
    subject : thread.subject,
    password : thread.password,
    markdown : thread.body,
    email : thread.email,
    files : buildFiles(uri, thread)
  }, function createdThread(error) {

    if (error) {
      callback(error)
    } else {
      migrateReplies(uri, thread, callback);
    }

  });

}

function iterateThreads(uri, foundThreads, callback, index) {

  index = index || 0;

  if (index >= foundThreads.length) {
    callback();
    return;

  }

  migrateThread(uri, foundThreads[index], function migratedThread(error) {

    if (error) {
      callback(error);
    } else {
      iterateThreads(uri, foundThreads, callback, ++index);
    }

  });

}

function migrateThreads(uri, callback) {

  connection.query('SELECT * from posts_' + uri + ' where thread IS NULL',
      function(error, foundThreads) {

        if (error) {
          callback(error);
        } else {
          iterateThreads(uri, foundThreads, callback);
        }

      });
}
// } Thread migration

function migrateBoard(board, callback) {

  console.log('Migrating /' + board.uri + '/');

  var boardSalt = crypto.createHash('sha256').update(
      'gunshot gunshot Cash registernoise' + Math.random() + new Date())
      .digest('hex');

  boards.insertOne({
    boardUri : board.uri,
    boardName : board.title,
    boardDescription : board.subtitle,
    settings : [ 'disableIds', 'requireThreadFile' ],
    owner : lynxModName,
    tags : [],
    salt : boardSalt
  }, function createdBoard(error) {

    if (error) {
      callback(error);
    } else {
      migrateThreads(board.uri, callback);
    }

  });

}

function commitBoardAggregatedData(postResults, callback) {

  threads.aggregate([ {
    $group : {
      _id : '$boardUri',
      threadCount : {
        $sum : 1
      },
      maxThreadId : {
        $max : '$threadId'
      }
    }
  } ], function gotAggregatedData(error, results) {

    if (error || !results.length) {
      callback(error);
    } else {

      var operations = [];

      for (var i = 0; i < results.length; i++) {

        var result = results[i];

        if (result.maxThreadId < postResults[result._id]) {
          result.maxThreadId = postResults[result._id];
        }

        operations.push({
          updateOne : {
            filter : {
              boardUri : result._id
            },
            update : {
              $set : {
                threadCount : result.threadCount,
                lastPostId : result.maxThreadId
              }
            }
          }
        });

      }

      boards.bulkWrite(operations, callback);

    }

  });

}

function aggregateBoardsInformation(callback) {

  posts.aggregate([ {
    $group : {
      _id : '$boardUri',
      maxPostId : {
        $max : '$postId'
      }
    }
  } ], function gotPostData(error, results) {

    if (error) {
      callback(error);
    } else {

      var object = {};

      for (var i = 0; i < results.length; i++) {
        object[results[i]._id] = results[i].maxPostId;
      }

      commitBoardAggregatedData(object, callback);
    }

  });

}

function iterateBoards(foundBoards, callback, index) {

  index = index || 0;

  if (index >= foundBoards.length) {
    aggregateBoardsInformation(callback);
    return;
  }

  migrateBoard(foundBoards[index], function migratedBoard(error) {

    if (error) {
      callback(error);
    } else {
      iterateBoards(foundBoards, callback, ++index);
    }

  });

}

function migrateBoards(callback) {

  connection.query('SELECT * from boards', function(err, foundBoards) {

    var uris = [];

    for (var i = 0; i < foundBoards.length; i++) {
      uris.push(foundBoards[i].uri);
    }

    users.updateOne({
      login : lynxModName
    }, {
      $set : {
        ownedBoards : uris
      }
    }, function setOwnedBoards(error) {

      if (error) {
        callback(error);
      } else {
        iterateBoards(foundBoards, callback);
      }

    });

  });

}
// } Board migration

exports.init = function(modName, path) {

  lynxModName = modName;
  boardPath = path;

  migrateBoards(function migratedBoards(error) {

    if (error) {
      console.log(error);
    } else {
      migrateMods(function migratedMods(error) {

        if (error) {
          console.log(error);
        } else {
          // TODO
        }

      });
    }

  });

  getBanList();

  moveStaffLog();
};