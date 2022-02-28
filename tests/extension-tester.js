const fs = require('fs');
const path = require('path');
const format = require('../src/sql-transformer');

const loadedSql = fs.readFileSync(path.resolve(__dirname, 'sample.sql')).toString();

console.log(format(loadedSql));
