# SQL Syntax

This SQL parser is designed using [PEGGY](https://github.com/peggyjs/peggy), a javascript library that takes a PEG (parsing expression grammar) and generates a parser program. PEGs cannot be ambiguous. If a string parses, it has exactly one valid parse tree ([AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)).

Generating the parser using peggy:

``` bash
peggy -o sql.js sql.pegjs
```

The parsing tester (`peg_tester.js`) loads the peg parser (`sql.js`) compiled by peggy (see above), and the draft program (`ast_to_sql.js`) for walking the AST. 

To test the parser:

``` bash
node peg_tester.js
```

## Select Query Syntax

The supported SQL syntax is targeting full support for Snowflake's SQL systax, with the flexibility for reading the most common SQL dialects.

Syntax block section                                    | Syntax | SnowSQL | MySQL | TSQL | Postgres
------------------------------                          | :----: | :-----: | :---: | :--: | :------:
[WITH ...                                               | X      | X       | X     | X    | X
&emsp; [RECURSIVE]                                      | X      |         |       |      | X
&emsp; [XMLNAMESPACES ,]]                               | -      |         |       | X    |
SELECT                                                  | X      | X       | X     | X    | X
&emsp; [TOP \<n>]                                       | X      | X       |       | X    |
&emsp; [ALL \| DISTINCT                                 | X      | X       | X     | X    | X
&emsp;&emsp; [ON ( expression [, ...] )]                | X      |         |       |      | X
&emsp; \| DISTINCTROW]                                  | -      |         | X     |      |
&emsp; [HIGH_PRIORITY]                                  | -      |         | X     |      |
&emsp; [STRAIGHT_JOIN]                                  | -      |         | X     |      |
&emsp; [{Option Clause}                                 | X      |         | X     |      |
&emsp;&emsp; [SQL_SMALL_RESULT]                         | X      |         | X     |      |
&emsp;&emsp; [SQL_BIG_RESULT]                           | X      |         | X     |      |
&emsp;&emsp; [SQL_BUFFER_RESULT]                        | X      |         | X     |      |
&emsp;&emsp; [SQL_CACHE \| SQL_NO_CACHE]                | X      |         | X     |      |
&emsp;&emsp; [SQL_CALC_FOUND_ROWS]]                     | X      |         | X     |      |
&emsp; ...                                              | X      | X       | X     | X    | X
[INTO ...                                               | X      | X       | X     | X    | X
&emsp; [OUTFILE \| DUMPFILE \| var_name [, var_name]]   | X      |         | X     |      |
&emsp; [TEMPORARY \| TEMP \| UNLOGGED] [TABLE] ...]     | -      |         |       |      | X
[FROM ...                                               | X      | X       | X     | X    | X
&emsp; [[[FULL \| LEFT \| RIGHT] [OUTER]]               | X      | X       | X     | X    | X
&emsp; \| [INNER] JOIN ... ON ... [AND ...]             | X      | X       | X     | X    | X
&emsp; \| [CROSS JOIN] ...]                             | X      | X       | X     | X    | X
&emsp; [ ,...n ]                                        | X      | X       |       | X    | X
&emsp; [AT() \| BEFORE()]                               | -      | X       |       |      |
&emsp; [CHANGES()]                                      | -      | X       |       |      |
&emsp; [STARTS WITH ...] [CONNECT BY ...]               | -      | X       |       |      |
&emsp; [MATCH_RECOGNIZE()]                              | -      | X       |       |      |
&emsp; [PIVOT() \| UNPIVOT()]                           | -      | X       |       |      |
&emsp; [VALUES ...]                                     | -      | X       |       |      |
&emsp; [PARTITION ...]                                  | -      |         | X     |      |
&emsp; [SAMPLE \| TABLESAMPLE...]                       | -      | X       |       |      |
&emsp; [LATERAL [FLATTEN(...)]...]                      | -      | X       |       |      |
&emsp; [TABLE([FLATTEN(...)]...)]]                      | -      | X       |       |      |
[WHERE ...]                                             | X      | X       | X     | X    | X
[GROUP BY ...                                           | X      | X       | X     | X    | X
&emsp; [ASC \| DESC], ... [WITH ROLLUP]]                | -      |         | X     |      |
&emsp; [CUBE(... [, ...])]                              | X      | X       |       |      | X
&emsp; [GROUPING SETS(... [, ...])]                     | X      | X       |       |      | X
&emsp; [ROLLUP(... [, ...])]                            | X      | X       |       |      | X
[HAVING ...]                                            | X      | X       | X     | X    | X
[QUALIFY ...]                                           | X      | X       |       |      |
[ORDER BY ... [ASC \| DESC] [, ...]]                    | X      | X       | X     | X    | X
[OPTION ( ... [ ,...n ] )]                              | -      |         |       | X    |
[WINDOW ...]                                            | X      |         |       |      | X
[LIMIT ...]                                             | X      | X       | X     | X    | X

{ UNION [ ALL ] \| EXCEPT \| INTERSECT }

## Acknowledgement

This PEG syntax parser is based on the PEG examples from [flora-sql-parser](https://github.com/florajs/sql-parser) and [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser), and the following syntax references:

* [Snowflake](https://docs.snowflake.com/en/sql-reference/constructs.html)
* [MySQL](https://dev.mysql.com/doc/refman/8.0/en/select.html)
* [SQL Server](https://docs.microsoft.com/en-US/sql/t-sql/queries/select-transact-sql?view=sql-server-ver15)
* [PostgreSQL](https://www.postgresql.org/docs/14/sql-select.html)
