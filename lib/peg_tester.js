const fs = require('fs')
const parser = require('./sql');       // PEG Parser (compiled by PEGGY)
const toSQL = require('./ast_to_sql'); // draft program to process a SQL AST

fs.readFile('sample.sql', (err, data) => {
    if (err) throw err;
    
    // Use the PEG Parser for tokenizing the SQL (sample.sql) into the constants 
    // to contain the AST, etc.
    const { tableList, columnList, ast } = parser.parse(data.toString());

    console.log("Tables:", tableList);
    console.log("Type:", ast[0].type);
    console.log("Columns:", columnList);
    console.log("AST:", ast[0]);
    console.log("With:", toSQL(ast[0].with));
})
