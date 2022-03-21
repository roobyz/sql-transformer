const fs = require('fs');
const path = require('path');
const format = require('../src/sql-transformer');

const loadedSql = fs.readFileSync(path.resolve(__dirname, 'sample.sql')).toString();
const options = {
  "blockComments": true,
  "outcomeComments": true,
  "startingWidth": 5,
  "whereOneOne": true
}

console.log(format(loadedSql, options));
