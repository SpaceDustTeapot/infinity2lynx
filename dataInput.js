'use strict';

var mongo = require('mongodb');
var mongoDb = require('./mongoDb');
var mysqlDb = require('./mysqlDb');
var readline = require('readline');
var fs = require('fs');
var rl;

function getDirectory(user) {

  rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
  });

  rl.question('Where are the board directories?: ', function read(answer) {

    rl.close();

    answer = answer.trim();

    if (answer.substring(answer.length - 1) !== '/') {
      answer = answer + '/';
    }

    try {
      if (!fs.lstatSync(answer).isDirectory()) {
        throw 'Not a directory';
      }

    } catch (error) {

      console.log('Could not read informed directory.');
      console.log(error);
      getDirectory();

    }

    require('./migrate').init(user, answer);

  });

}

function getUser() {

  rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
  });

  var question = 'Which LynxChan user should own the boards?: ';
  var msg = 'User not found. See src/be/readme to see how to create users.';

  rl.question(question, function read(answer) {

    rl.close();

    answer = answer.trim();

    mongoDb.users().findOne({
      login : answer
    }, function foundUser(error, user) {

      if (error) {
        console.log();
      } else if (!user) {
        console.log(msg);

        getUser();
      } else {
        getDirectory(answer);
      }

    });

  });

}

function connectMysql() {

  mysqlDb.init(function(error, connection) {

    if (error) {
      console.log(error);

    } else {

      getUser();

    }

  });

}

mongoDb.init(function connected(error) {

  if (error) {
    console.log(error);
    process.exit();
  } else {
    connectMysql();
  }

});
