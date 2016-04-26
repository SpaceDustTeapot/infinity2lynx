'use strict';

var readline = require('readline');

var rl;

function connect(info, callback) {

  exports.connection = require('mysql').createConnection(info);

  exports.connection.query('SELECT 1', function(err, rows) {
    callback(err);
  });

}

function askDbPassword(info, callback) {

  rl.question('Inform the database password: ', function read(answer) {

    info.password = answer;

    rl.close();

    connect(info, callback);

  });

}

function askDbUser(info, callback) {

  rl.question('Inform the database user: ', function read(answer) {

    info.user = answer.trim();

    askDbPassword(info, callback);

  });

}

function askDbDb(info, callback) {

  rl.question('Inform the database being used on the Vichan database: ',
      function read(answer) {

        info.database = answer.trim();

        askDbUser(info, callback);

      });

}

function askDbPort(info, callback) {

  rl.question('Inform the port of Vichan database: ', function read(answer) {

    info.port = +(answer.trim());

    askDbDb(info, callback);

  });

}

exports.init = function(callback) {
  var info = {};

  rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
  });

  rl.question('Inform the address of Vichan database: ', function read(answer) {

    info.host = answer.trim();

    askDbPort(info, callback);

  });
};