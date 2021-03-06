'use strict';

var crypto = require('crypto');
var mongo = require('mongodb');

var mongoHandler = require('./mongoDb');
var vichanConnection = require('./mysqlDb').connection;

var mongoConnection = mongoHandler.conn();
var users = mongoHandler.users();
var threads = mongoHandler.threads();
var logs = mongoHandler.logs();
var bans = mongoHandler.bans();
var aggregatedLogs = mongoHandler.aggregatedLogs();
var posts = mongoHandler.posts();
var boards = mongoHandler.boards();

var boardPath;
var lynxModName;

// Mod migration {
function migrateMod(foundMod, callback) {

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
    console.log('\n\nMigrated ' + foundMods.length + ' mods.');

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

  vichanConnection.query('SELECT * from mods', function(err, foundMods) {
    iterateMods(foundMods, callback);
  });

}
// } Mod migration

// Ban migration {
function migrateBan(ban, callback) {

  var expiration;

  if (!ban.expires) {
    expiration = new Date();
    expiration.setUTCFullYear(expiration.getUTCFullYear() + 5);
  } else {
    expiration = new Date(ban.expires * 1000);
  }

  var ipArray = [];

  for (var i = 0; i < ban.ipstart.length; i++) {
    ipArray.push(ban.ipstart[i]);
  }

  var newBan = {
    appliedBy : lynxModName,
    reason : ban.reason,
    expiration : expiration,
    ip : ipArray
  };

  if (ban.board) {
    newBan.boardUri = ban.board;
  }

  bans.insertOne(newBan, callback);

}

function iterateBans(foundBans, callback, index) {

  index = index || 0;

  if (index >= foundBans.length) {
    console.log('\n\nMigrated ' + foundBans.length + ' bans.');
    callback();
    return;
  }

  migrateBan(foundBans[index], function migratedBan(error) {

    if (error) {
      callback(error);
    } else {
      iterateBans(foundBans, callback, ++index);
    }

  });

}

function migrateBans(callback) {

  vichanConnection.query('SELECT * from bans', function(error, foundBans) {

    if (error) {
      callback(error);
    } else {
      iterateBans(foundBans, callback);
    }

  });
}
// } Ban migration

// Log migration {
function iterateDays(date, callback, foundResults) {

  foundResults = foundResults || [];

  if (date >= new Date()) {
    aggregatedLogs.deleteMany({}, function clearedCollection(error) {

      if (error) {
        callback(error);
      } else {
        aggregatedLogs.insertMany(foundResults, callback);
      }

    });

    return;
  }

  var next = new Date(date);
  next.setDate(next.getDate() + 1);

  logs.aggregate([ {
    $match : {
      time : {
        $gte : date,
        $lt : next
      }
    }
  }, {
    $project : {
      time : 1
    }
  }, {
    $group : {
      _id : 0,
      ids : {
        $push : '$_id'
      }
    }
  } ], function gotLogs(error, results) {

    if (error) {
      callback();
    } else {

      if (results.length) {
        foundResults.push({
          logs : results[0].ids,
          date : date
        });
      }

      iterateDays(next, callback, foundResults);

    }

  });

}

function aggregateLogs(callback) {

  logs.aggregate([ {
    $project : {
      time : 1,
      _id : 0
    }
  }, {
    $group : {
      _id : 0,
      time : {
        $min : '$time'
      }
    }
  } ], function gotOldestLog(error, results) {

    if (error) {
      callback(error);
    } else if (!results.length) {
      callback();
    } else {
      var earliest = results[0].time;

      earliest.setHours(0);
      earliest.setMinutes(0);
      earliest.setSeconds(0);
      earliest.setMilliseconds(0);

      iterateDays(earliest, callback);
    }

  });
}

function migrateLog(log, callback) {

  logs.insertOne({
    user : lynxModName,
    type : 'boardTransfer',
    time : new Date(log.time * 1000),
    boardUri : log.board,
    description : log.text.replace(/\d+.\d+.\d+.\d+/g, '[REDACTED]'),
    global : log.board ? false : true
  }, callback);

}

function iterateLogs(foundLogs, callback, index) {

  index = index || 0;

  if (index >= foundLogs.length) {
    console.log('\n\nMigrated ' + foundLogs.length + ' logs.');
    aggregateLogs(callback);
    return;
  }

  migrateLog(foundLogs[index], function migratedLog(error) {
    if (error) {
      callback(error);
    } else {
      iterateLogs(foundLogs, callback, ++index);
    }
  });

}

function migrateLogs(callback) {

  vichanConnection.query('SELECT * from modlogs', function(err, foundLogs) {
    iterateLogs(foundLogs, callback);
  });

}
// } Log migration

// Gridfs handling {
function writeFile(path, dest, mime, meta, callback) {

  path = boardPath + path;

  meta.lastModified = new Date();

  var gs = mongo.GridStore(mongoConnection, dest, 'w', {
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

// File migration {
function fixMediaUrl(img, thumb) {

  var parts = img.split('/');

  return '/' + parts[0] + '/media/' + (thumb ? 't_' : '') + parts[2];

}

function buildGridMeta(uri, file, posting, threadId, mimes, fixedfile,
    realthumb, thumb, callback) {

  var obj = {
    boardUri : uri,
    threadId : posting.id,
    type : 'media'
  };

  if (threadId) {
    obj.postId = posting.id;
    obj.threadId = threadId;
  }

  writeFile(file.file_path, fixedfile, mimes, obj, function wroteFile(error) {

    if (error) {
      callback(error);
    } else {
      writeFile(thumb, realthumb, mimes, obj, callback);
    }

  });

}

function migrateFile(uri, posting, threadId, infFile, callback) {

  var mimeType = getMime(infFile.file_path);

  if (!mimeType) {
    callback();
  }

  var fixedPath = fixMediaUrl(infFile.file_path);
  var fixedThumb = fixMediaUrl(infFile.thumb_path, true);

  console.log('Migrating file ' + fixedPath);

  buildGridMeta(uri, infFile, posting, threadId, mimeType, fixedPath,
      fixedThumb, infFile.thumb_path, function migratedFiles(error) {

        if (error) {
          callback(error);
        } else {

          callback(null, {
            originalName : infFile.name,
            path : fixedPath,
            mime : mimeType,
            thumb : fixedThumb,
            name : infFile.file,
            size : infFile.size,
            md5 : infFile.hash,
            width : infFile.width,
            height : infFile.height
          });

        }

      });

}

function iterateFiles(uri, posting, threadId, foundFiles, callback, builtFiles,
    index) {

  builtFiles = builtFiles || [];
  index = index || 0;

  if (index >= foundFiles.length) {
    callback(null, builtFiles);
    return;
  }

  migrateFile(uri, posting, threadId, foundFiles[index], function(error,
      newFile) {

    if (error) {
      callback(error);
    } else {

      if (newFile) {
        builtFiles.push(newFile);
      }

      iterateFiles(uri, posting, threadId, foundFiles, callback, builtFiles,
          ++index);
    }

  });

}

function migrateFiles(uri, posting, threadId, callback) {

  if (!posting.files) {
    callback();
    return;
  }

  try {
    var foundFiles = JSON.parse(posting.files);

  } catch (error) {
    callback(error);
    return;
  }

  iterateFiles(uri, posting, threadId, foundFiles, function builtFiles(error,
      builtFiles) {

    if (error) {
      callback(error);
    } else {

      var collectionToUse = threadId ? posts : threads;

      var queryBlock = {
        boardUri : uri,
        threadId : posting.id
      };

      if (threadId) {
        queryBlock.threadId = threadId;
        queryBlock.postId = posting.id;
      }

      collectionToUse.updateOne(queryBlock, {
        $set : {
          files : builtFiles
        }
      }, callback);

    }

  });

}
// } File migration

function getMime(pathName) {
  var pathParts = pathName.split('.');

  var mime;

  if (pathParts.length) {
    var extension = pathParts[pathParts.length - 1];
    mime = exports.MIMETYPES[extension.toLowerCase()] || 'text/plain';

  } else {
    mime = 'text/plain';
  }

  return mime;
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
    ip : thread.ip.split(/\./).map(function(element) {
      return +element;
    }),
    message : reply.body_nomarkup,
    hash : getMessageHash(reply.body_nomarkup),
    name : reply.name,
    subject : reply.subject,
    files : [],
    markdown : reply.body,
    password : reply.password,
    email : reply.email
  }, function migratedReply(error) {

    if (error) {
      callback(error);
    } else {
      migrateFiles(uri, reply, thread.id, callback);
    }

  });

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

function aggregateThreadLatestReplies(uri, thread, callback) {

  posts.aggregate([ {
    $match : {
      boardUri : uri,
      threadId : thread.id
    }
  }, {
    $sort : {
      postId : -1
    }
  }, {
    $limit : 5
  }, {
    $group : {
      _id : 0,
      posts : {
        $push : '$postId'
      }
    }
  } ], function gotPosts(error, results) {

    if (error || !results.length) {
      callback(error);
    } else {

      threads.updateOne({
        boardUri : uri,
        threadId : thread.id
      }, {
        $set : {
          latestPosts : results[0].posts
        }
      }, callback);

    }

  });

}

function migrateReplies(uri, thread, callback) {

  var query = 'SELECT * from posts_' + uri + ' where thread=' + thread.id;

  vichanConnection.query(query, function(error, foundReplies) {

    if (error) {
      callback(error);
    } else {
      iterateReplies(uri, thread, foundReplies,
          function migratedReplies(error) {

            if (error) {
              callback(error);
            } else {
              aggregateThreadLatestReplies(uri, thread, callback);
            }

          });
    }

  });
}
// } Reply migration

function migrateThread(uri, thread, callback) {

  console.log('\nMigrating thread ' + thread.id);

  var thread_salt = crypto.createHash('sha256').update(
      'gunshot gunshot Cash registernoise' + Math.random() + new Date())
      .digest('hex');

  threads.insertOne({
    boardUri : uri,
    threadId : thread.id,
    creation : new Date(thread.time * 1000),
    lastBump : new Date(thread.bump * 1000),
    ip : thread.ip.split(/\./).map(function(element) {
      return +element;
    }),
    message : thread.body_nomarkup,
    hash : getMessageHash(thread.body_nomarkup),
    salt : thread_salt,
    name : thread.name,
    pinned : thread.sticky ? true : false,
    locked : thread.locked ? true : false,
    subject : thread.subject,
    password : thread.password,
    markdown : thread.body,
    email : thread.email
  }, function createdThread(error) {

    if (error) {
      callback(error);
    } else {

      migrateReplies(uri, thread, function migratedThread(error) {

        if (error) {
          callback(error);
        } else {
          migrateFiles(uri, thread, null, callback);
        }

      });
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

  vichanConnection.query(
      'SELECT * from posts_' + uri + ' where thread IS NULL', function(error,
          foundThreads) {

        if (error) {
          callback(error);
        } else {
          iterateThreads(uri, foundThreads, callback);
        }

      });
}
// } Thread migration

function aggregateThreadData(uri, callback) {

  posts.aggregate([ {
    $match : {
      boardUri : uri
    }
  }, {
    $group : {
      _id : '$threadId',
      totalPosts : {
        $sum : 1
      },
      totalFiles : {
        $sum : {
          $size : '$files'
        }
      }
    }
  } ], function gotResults(error, results) {

    if (error) {
      callback(error);
    } else if (results.length) {

      var operations = [];

      for (var i = 0; i < results.length; i++) {

        var result = results[i];

        operations.push({
          updateOne : {
            filter : {
              boardUri : uri,
              threadId : result._id
            },
            update : {
              $set : {
                postCount : result.totalPosts,
                fileCount : result.totalFiles
              }
            }
          }
        });

      }

      threads.bulkWrite(operations, callback);

    } else {
      callback();
    }

  });

}

function migrateBoard(board, callback) {

  console.log('\n\n\nMigrating /' + board.uri + '/');

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
      migrateThreads(board.uri, function migratedThreads(error) {

        if (error) {
          callback(error);
        } else {
          aggregateThreadData(board.uri, callback);
        }

      });
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

function aggregateBoardsData(callback) {

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
    aggregateBoardsData(callback);
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

  vichanConnection.query('SELECT * from boards', function(err, foundBoards) {

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

function migrateSecondaryData(callback) {

  migrateBans(function migratedBans(error) {

    if (error) {
      callback(error);
    } else {
      migrateLogs(callback);
    }

  });
}

exports.init = function(modName, path, callback) {

  lynxModName = modName;
  boardPath = path;

  migrateBoards(function migratedBoards(error) {

    if (error) {
      callback(error);
    } else {
      migrateMods(function migratedMods(error) {

        if (error) {
          callback(error);
        } else {
          migrateSecondaryData(callback);
        }

      });
    }

  });

};

exports.MIMETYPES = {
  a : 'application/octet-stream',
  ai : 'application/postscript',
  aif : 'audio/x-aiff',
  aifc : 'audio/x-aiff',
  aiff : 'audio/x-aiff',
  au : 'audio/basic',
  avi : 'video/x-msvideo',
  bat : 'text/plain',
  bin : 'application/octet-stream',
  bmp : 'image/x-ms-bmp',
  c : 'text/plain',
  cdf : 'application/x-cdf',
  csh : 'application/x-csh',
  css : 'text/css',
  dll : 'application/octet-stream',
  doc : 'application/msword',
  dot : 'application/msword',
  dvi : 'application/x-dvi',
  eml : 'message/rfc822',
  eps : 'application/postscript',
  etx : 'text/x-setext',
  exe : 'application/octet-stream',
  gif : 'image/gif',
  gtar : 'application/x-gtar',
  h : 'text/plain',
  hdf : 'application/x-hdf',
  htm : 'text/html',
  html : 'text/html',
  jpe : 'image/jpeg',
  jpeg : 'image/jpeg',
  jpg : 'image/jpeg',
  js : 'application/x-javascript',
  ksh : 'text/plain',
  latex : 'application/x-latex',
  m1v : 'video/mpeg',
  man : 'application/x-troff-man',
  me : 'application/x-troff-me',
  mht : 'message/rfc822',
  mhtml : 'message/rfc822',
  mif : 'application/x-mif',
  mov : 'video/quicktime',
  movie : 'video/x-sgi-movie',
  mp2 : 'audio/mpeg',
  mp3 : 'audio/mpeg',
  mp4 : 'video/mp4',
  mpa : 'video/mpeg',
  mpe : 'video/mpeg',
  mpeg : 'video/mpeg',
  mpg : 'video/mpeg',
  ms : 'application/x-troff-ms',
  nc : 'application/x-netcdf',
  nws : 'message/rfc822',
  o : 'application/octet-stream',
  obj : 'application/octet-stream',
  oda : 'application/oda',
  ogg : 'audio/ogg',
  ogv : 'video/ogg',
  pbm : 'image/x-portable-bitmap',
  pdf : 'application/pdf',
  pfx : 'application/x-pkcs12',
  pgm : 'image/x-portable-graymap',
  png : 'image/png',
  pnm : 'image/x-portable-anymap',
  pot : 'application/vnd.ms-powerpoint',
  ppa : 'application/vnd.ms-powerpoint',
  ppm : 'image/x-portable-pixmap',
  pps : 'application/vnd.ms-powerpoint',
  ppt : 'application/vnd.ms-powerpoint',
  pptx : 'application/vnd.ms-powerpoint',
  ps : 'application/postscript',
  pwz : 'application/vnd.ms-powerpoint',
  py : 'text/x-python',
  pyc : 'application/x-python-code',
  pyo : 'application/x-python-code',
  qt : 'video/quicktime',
  ra : 'audio/x-pn-realaudio',
  ram : 'application/x-pn-realaudio',
  ras : 'image/x-cmu-raster',
  rdf : 'application/xml',
  rgb : 'image/x-rgb',
  roff : 'application/x-troff',
  rtx : 'text/richtext',
  sgm : 'text/x-sgml',
  sgml : 'text/x-sgml',
  sh : 'application/x-sh',
  shar : 'application/x-shar',
  snd : 'audio/basic',
  so : 'application/octet-stream',
  src : 'application/x-wais-source',
  swf : 'application/x-shockwave-flash',
  t : 'application/x-troff',
  tar : 'application/x-tar',
  tcl : 'application/x-tcl',
  tex : 'application/x-tex',
  texi : 'application/x-texinfo',
  texinfo : 'application/x-texinfo',
  tif : 'image/tiff',
  tiff : 'image/tiff',
  tr : 'application/x-troff',
  tsv : 'text/tab-separated-values',
  txt : 'text/plain',
  ustar : 'application/x-ustar',
  vcf : 'text/x-vcard',
  wav : 'audio/x-wav',
  webm : 'video/webm',
  wiz : 'application/msword',
  wsdl : 'application/xml',
  xbm : 'image/x-xbitmap',
  xlb : 'application/vnd.ms-excel',
  xls : 'application/vnd.ms-excel',
  xlsx : 'application/vnd.ms-excel',
  xml : 'text/xml',
  xpdl : 'application/xml',
  xpm : 'image/x-xpixmap',
  xsl : 'application/xml',
  xwd : 'image/x-xwindowdump',
  zip : 'application/zip'
};