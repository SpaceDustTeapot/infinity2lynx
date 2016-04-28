'use strict';

var fs = require('fs');
var mongo = require('mongodb');
var readline = require('readline');
var rl;
var cachedDb;
var lastInformedPath = __dirname + '/lastMongoData.json';

var indexesSet;
var maxIndexesSet = 18;

var cachedMessages;
var cachedUploadReferences;
var cachedLatestImages;
var cachedAggregatedLogs;
var cachedBypasses;
var cachedFlood;
var cachedVersions;
var cachedPosts;
var cachedReports;
var cachedThreads;
var cachedBoards;
var cachedBans;
var cachedUsers;
var cachedCaptchas;
var cachedFiles;
var cachedTripcodes;
var cachedLog;
var cachedLatestPosts;
var cachedRecoveryRequests;
var cachedStats;
var cachedHashBans;
var cachedTorIps;
var cachedFlags;
var cachedOverboard;
var cachedIpAggregation;

var loading;

function indexSet(callback) {

  indexesSet++;

  if (indexesSet === maxIndexesSet) {
    loading = false;
    callback();
  }

}

// start of index initialization
function initUploadReferences(callback) {

  cachedUploadReferences.ensureIndex({
    references : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

  cachedUploadReferences.ensureIndex({
    identifier : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

}

function initCaptchas(callback) {

  cachedCaptchas.ensureIndex({
    expiration : 1
  }, {
    expireAfterSeconds : 0
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initFlood(callback) {

  cachedFlood.ensureIndex({
    expiration : 1
  }, {
    expireAfterSeconds : 0
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initFlags(callback) {

  cachedFlags.ensureIndex({
    boardUri : 1,
    name : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

}

function initTorIps(callback) {

  cachedTorIps.ensureIndex({
    ip : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initTripcodes(callback) {

  cachedTripcodes.ensureIndex({
    tripcode : 1
  }, {
    unique : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initHashBans(callback) {

  cachedHashBans.ensureIndex({
    md5 : 1,
    boardUri : 1
  }, {
    unique : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initBans(callback) {

  cachedBans.ensureIndex({
    expiration : 1
  }, {
    expireAfterSeconds : 0
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initReports(callback) {

  cachedReports.ensureIndex({
    boardUri : 1,
    global : 1,
    threadId : 1,
    postId : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initPosts(callback) {

  cachedPosts.ensureIndex({
    boardUri : 1,
    postId : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

  cachedPosts.ensureIndex({
    boardUri : 1,
    threadId : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initRecoveryRequests(callback) {

  cachedRecoveryRequests.ensureIndex({
    expiration : 1
  }, {
    expireAfterSeconds : 0
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

}

function initUsers(callback) {

  cachedUsers.ensureIndex({
    login : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

}

function initThreads(callback) {

  cachedThreads.ensureIndex({
    boardUri : 1,
    threadId : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initBoards(callback) {

  cachedBoards.ensureIndex({
    boardUri : 1
  }, {
    unique : true
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });

}

function initBypasses(callback) {

  cachedBypasses.ensureIndex({
    expiration : 1
  }, {
    expireAfterSeconds : 0
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}

function initStats(callback) {

  cachedStats.ensureIndex({
    startingTime : 1
  }, function setIndex(error, index) {
    if (error) {
      if (loading) {
        loading = false;

        callback(error);
      }
    } else {
      indexSet(callback);
    }
  });
}
// end of index initialization

// start of getters
exports.messages = function() {
  return cachedMessages;
};

exports.conn = function() {
  return cachedDb;
};

exports.uniqueIps = function() {
  return cachedIpAggregation;
};

exports.bypasses = function() {
  return cachedBypasses;
};

exports.recoveryRequests = function() {
  return cachedRecoveryRequests;
};

exports.files = function() {
  return cachedFiles;
};

exports.bans = function() {
  return cachedBans;
};

exports.posts = function() {
  return cachedPosts;
};

exports.boards = function() {
  return cachedBoards;
};

exports.users = function() {
  return cachedUsers;
};

exports.threads = function() {
  return cachedThreads;
};

exports.captchas = function() {
  return cachedCaptchas;
};

exports.reports = function() {
  return cachedReports;
};

exports.tripcodes = function() {
  return cachedTripcodes;
};

exports.stats = function() {
  return cachedStats;
};

exports.latestPosts = function() {
  return cachedLatestPosts;
};

exports.latestImages = function() {
  return cachedLatestImages;
};

exports.logs = function() {
  return cachedLog;
};

exports.overboardThreads = function() {
  return cachedOverboard;
};

exports.hashBans = function() {
  return cachedHashBans;
};

exports.torIps = function() {
  return cachedTorIps;
};

exports.flags = function() {
  return cachedFlags;
};

exports.flood = function() {
  return cachedFlood;
};

exports.aggregatedLogs = function() {
  return cachedAggregatedLogs;
};

exports.uploadReferences = function() {
  return cachedUploadReferences;
};
// end of getters

function initGlobalIndexes(callback) {

  initBypasses(callback);

  initUsers(callback);

  initReports(callback);

  initBans(callback);

  initCaptchas(callback);

  initRecoveryRequests(callback);

  initTripcodes(callback);

  initHashBans(callback);

  initTorIps(callback);

  initFlood(callback);

  initUploadReferences(callback);

}

function initBoardIndexes(callback) {

  initBoards(callback);

  initThreads(callback);

  initPosts(callback);

  initFlags(callback);

  initStats(callback);

  initGlobalIndexes(callback);
}

function initBoardIndexedCollections(callback) {

  cachedPosts = cachedDb.collection('posts');
  cachedBoards = cachedDb.collection('boards');
  cachedHashBans = cachedDb.collection('hashBans');
  cachedReports = cachedDb.collection('reports');
  cachedFlags = cachedDb.collection('flags');
  cachedBans = cachedDb.collection('bans');
  cachedThreads = cachedDb.collection('threads');
  cachedStats = cachedDb.collection('boardStats');

  initBoardIndexes(callback);

}

function initGlobalIndexedCollections(callback) {

  cachedBypasses = cachedDb.collection('blockBypasses');
  cachedTripcodes = cachedDb.collection('secureTripcodes');
  cachedFlood = cachedDb.collection('floodRecord');
  cachedCaptchas = cachedDb.collection('captchas');
  cachedTorIps = cachedDb.collection('torIps');
  cachedMessages = cachedDb.collection('rebuildMessages');
  cachedRecoveryRequests = cachedDb.collection('recoveryRequests');
  cachedUsers = cachedDb.collection('users');
  cachedUploadReferences = cachedDb.collection('uploadReferences');

  initBoardIndexedCollections(callback);

}

function initCollections(callback) {

  cachedLatestImages = cachedDb.collection('latestImages');
  cachedIpAggregation = cachedDb.collection('uniqueIpAggregation');
  cachedAggregatedLogs = cachedDb.collection('aggregatedLogs');
  cachedOverboard = cachedDb.collection('overboardThreads');
  cachedLatestPosts = cachedDb.collection('latestPosts');
  cachedFiles = cachedDb.collection('fs.files');
  cachedLog = cachedDb.collection('staffLogs');

  initGlobalIndexedCollections(callback);

}

function connect(dbSettings, callback) {

  rl.close();

  if (loading) {
    callback('Already booting db');
  }

  loading = true;

  indexesSet = 0;

  var client = mongo.MongoClient;

  var connectString = 'mongodb://';

  if (dbSettings.user) {
    connectString += dbSettings.user + ':' + dbSettings.password + '@';
  }

  connectString += dbSettings.address + ':';
  connectString += dbSettings.port + '/' + dbSettings.db;

  if (dbSettings.ssl) {
    connectString += '?ssl=true';
  }

  client.connect(connectString, function connectedDb(error, db) {

    if (error) {
      loading = false;
      callback(error);
    } else {

      cachedDb = db;

      initCollections(callback);
    }

  });

}

function askDbPassword(info, callback) {

  rl.question('Inform the database password (required if user was informed): ',
      function read(answer) {

        if (answer.length) {
          info.password = answer;
        }

        fs.writeFileSync(lastInformedPath, JSON.stringify(info, null, 2));

        connect(info, callback);

      });

}

function askDbUser(info, callback) {

  rl.question('Inform the database user, if any: ', function read(answer) {

    if (answer.trim().length) {
      info.user = answer.trim();
    }

    askDbPassword(info, callback);

  });

}

function askDbSsl(info, callback) {

  rl.question('Is the database using SSL?(y/n): ', function read(answer) {

    info.ssl = answer.trim().toLowerCase() === 'y';

    askDbUser(info, callback);

  });

}

function askDbDb(info, callback) {

  rl.question('Inform the database being used on the LynxChan database: ',
      function read(answer) {

        info.db = answer.trim();

        askDbSsl(info, callback);

      });

}

function askDbPort(info, callback) {

  rl.question('Inform the port of LynxChan database(Defaults to 27017): ',
      function read(answer) {

        info.port = answer.trim();

        if (!info.port.length) {
          info.port = '27017';
        }

        askDbDb(info, callback);

      });

}

function askAddress(callback) {

  var info = {};

  rl.question('Inform the address of LynxChan database: ',
      function read(answer) {

        info.address = answer.trim();
        askDbPort(info, callback);

      });
}

exports.init = function(callback) {

  rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
  });

  try {

    var parsedLastData = JSON.parse(fs.readFileSync(lastInformedPath));

    rl.question('Do you wish to reuse the mongo information? (y/n): ',
        function read(answer) {

          if (answer.trim().toLowerCase() === 'y') {
            connect(parsedLastData, callback);
          } else {
            askAddress(callback);
          }

        });

  } catch (error) {
    askAddress(callback);
  }

};

exports.close = function() {

  if (cachedDb) {
    cachedDb.close();
  }

};
