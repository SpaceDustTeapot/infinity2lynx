var fs = require('fs');

var stats = fs.existsSync('dud.png');

console.log("dud: " + stats);
