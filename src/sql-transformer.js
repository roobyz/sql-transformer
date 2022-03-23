// ############################################################################
// What: SQL formatter written in Javascript 
// Why:  
//  * make SQL cleaner and easier to read 
//  * extension to enhance SQL clarity and productivity in VSCode
// How:  
//  * recursively process SQL keywords
//  * build a stack array to push and pop SQL blocks by type
// ############################################################################

// ----------------------------------------------------------------------------
// What: array of SQL keywords
// Why:  use keywords to procecss SQL blocks and assign to stack when needed
const kwords = ['WITH', 'CREATE', 'SELECT', 'FROM', 'WHERE', 'AND', 'GROUP BY', 'ORDER BY', 'LEFT', 'RIGHT', 'CROSS', 'FULL', 'INNER', 'OUTER', 'JOIN', 'ON', 'CASE', 'WHEN', 'OR', 'THEN', 'ELSE', 'END', 'AS', 'OVER', 'ALL', 'UNION', 'BETWEEN', 'HAVING', 'LIMIT', 'INSERT', 'IN', 'INTO', 'OVERWRITE', 'VALUES'];
// ----------------------------------------------------------------------------
// What: operators
const owords = ['::', '/', '*', '+', '-', '%']
// ----------------------------------------------------------------------------
// What: comments
const cwords = ['/*', '*/', '{#', '#}']
// ----------------------------------------------------------------------------
// What: Jinja brackets for DBT
const dwords = ['{{', '}}', '{%', '%}']
// ----------------------------------------------------------------------------
// What: punctuation
const pwords = [';', '(', ')', ',']
// ----------------------------------------------------------------------------
// What: reserved words
const rwords = [...kwords, ...cwords, ...dwords, ...pwords];

// ----------------------------------------------------------------------------
// What: Array class for processing the stack of SQL blocks
// Why: 
//  * Enable processing of code blocks in context of how they relate to other blocks
//  * Apply different formatting rules by block and block context
//  * set a margin for formatting the SQL blocks
// How: 
//  * peek: method for identifying the desired bocks' types
//  * getMargin: method for keeping track of the margins by block, to
//    add or subtract from the margin to adjust format layout
//  * array push to start a code block and array pop to end a code block
// ----------------------------------------------------------------------------
class CustomArray extends Array {
    /**
     * @param {Array} stack 
     * @param {Number} index 
     * @returns {String}
     */
    peek(index = -1) {
        if (this.length > index * (-1) - 1) {
            return this.slice(index)[0].type;
        }
        return '';
    }

    /**
     * Calc and returns the indentation margin value.
     * 
     * @returns {Number}
     */
    getMargin(offset = 0) {
        let margin = 0;
        for (let i = 0; i < this.length; i++) {
            margin += this[i].margin;
        }
        if (margin + offset >= 0) {
            return margin + offset;
        }
        return margin;
    }

    /**
     * Returns the current stack margin value.
     * 
     * @returns {Number}
     */
    peekMargin(index = -1) {
        if (this.length > index * (-1) - 1) {
            return this.slice(index)[0].margin;
        }
        return 0;
    }
}

class CustomQueue extends Array {
    /**
     * It pushes multiple items.
     * 
     * @param  {...any} items 
     */
    pushItems(...items) {
        for (let i = 0; i < items.length; i++) {
            this.push(items[i])
        }
    }

    /**
     * Returns the position of the given keyword in the previous line.
     * 
     * @param {String} keyword 
     * @returns {Number}
     */
    getPosOfKeywordPreviousLine(keyword) {
        for (let i = this.length - 1; i > 0; i--) {
            if (this[i] === '\n') {
                const position = this.slice(i + 1, this.length).join('').toUpperCase().lastIndexOf(keyword);
                if (position > 0) {
                    return position;
                }
            }
        }
        return 0;
    }

    /**
     * Returns the current line's column position.
     * 
     * @returns {Number}
     */
    getCurrentPosition() {
        for (let i = this.length - 1; i > 0; i--) {
            if (this[i] === '\n') {
                const position = this.slice(i + 1, this.length).join('').toUpperCase().length
                if (position > 0) {
                    return position;
                }
            }
        }
        return 0;
    }
}

function isReservedWord(word) {
    /**
     * Returns whether the given argument is a keyword. 
     * 
     * @param {String} word 
     * @returns {Boolean}
     */
    return rwords.includes(word.toUpperCase());
}

// ----------------------------------------------------------------------------
// What: Function to check for mathematical operators
// Why:  Control spacing for calculations
function isOperater(word) {
    let shouldSkip = false;
    owords.forEach(operator => {
        if (word.includes(operator)) {
            shouldSkip = true;
            return shouldSkip;
        }
    });
    return shouldSkip;
}

// ----------------------------------------------------------------------------
// What: Function to retrieve the upcoming word
// Why:  Set margins based on word boundaries
function peekNextWord(tokens) {
    /**
     * the upper case of the next word is returned.
     * 
     * @param {Array} tokens 
     * @returns {String}
     */
    if (tokens.length > 0) {
        return tokens[0].toUpperCase();
    }
    return '';
}

// ----------------------------------------------------------------------------
// What: Function to check future keyword matches 
// Why:  Process margins with context of keyword placement
// How:  Check tokens against array, up to the specified keyword steps forward
function isNextKeyword(tokens, list, steps) {
    /**
     * If the next token is keyword, the upper case of the keyword is returned.
     * 
     * @param {Array} tokens 
     * @returns {String}
     */
    var kwords = 0;
    var steps = typeof steps != "undefined" ? steps : 0;

    for (let i = 0; i < tokens.length; i++) {
        if (isReservedWord(tokens[i])) {
            if (list.includes(tokens[i])) {
                return true
            }
            kwords += 1;
            if (kwords > steps) {
                break;
            }
        }

    }
    return false;
}

// ----------------------------------------------------------------------------
// What: Function generate group by integers 
// Why:  Control group by formatting by integers
function generateArrayOfNumbers(numbers) {
    var aon = [...Array(numbers).keys()].slice(1)

    return aon.map(String)
}

// ----------------------------------------------------------------------------
// What: Function to transform all comments into comment blocks
// Why:  Returns SQL with consistent comment blocks
// How:  Use comment block boundaries to correctly process SQL blocks
function commentBlocks(sql) {
    /**
     * Returns SQL with multi-line comment blocks
     * 
     * @param {String} sql 
     * @returns {String}
     */

    // Capture any multi-line comment within a comment block
    // and split them on their boundaries (brackets)
    var regex = /(?<=\/\*)([\s\S]*?)(?=\*\/)/gm;
    var cblocks = sql.split(regex);
    var commented = '';

    if (cblocks.length > 1) {
        // Convert multi-line comment blocks into multiple line comment blocks
        const nblock = cblocks.map(cItem => {
            var ctype = '';
            var ntype = '';
            var ttype = '';

            if (cItem.substr(0, 2) !== '*/' && cItem.slice(-2) === '/*') {
                // Process non-comments with trailing bracket
                if (cItem.slice(0, -2).trim() === '') {
                    ntype = ''
                } else {
                    ntype = cItem.slice(0, -2).trim()
                }

            } else if (cItem.substr(0, 2) === '*/' && cItem.slice(-2) === '/*') {
                // Process non-comments with both brackets
                ntype = cItem.substr(2).slice(0, -2)

            } else if (cItem.substr(0, 2) === '*/' && cItem.slice(-2) !== '/*') {
                // Process non-comments with leading brackets
                ntype = cItem.substr(2)

            } else {
                // Process the comments:
                // * Split multiple comment lines into an array
                // * Convert each item into comment blocks
                ctype = cItem.split(/(\r\n|\r|\n)/g).map(tItem => {
                    if (tItem === '') {
                        ttype = ''
                    } else {
                        ttype = tItem.replace(/(\r|\n)/g, ' ')

                    }

                    // Remove any empty lines
                    if (ttype.trim() === '') {
                        ttype = ''
                    } else {
                        // Bracket the comment item in blocks
                        // and ensure they are not double bracketted
                        ttype = ('/* ' + ttype + ' */\n').replace(
                            /(?<=\/\*)(.*)(\/\*)/, ''
                        ).replace(
                            /(?<=\*\/)(.*)(\*\/)/, ''
                        )
                    }

                    return ttype
                });

                // Return multiple line comments
                ntype = ctype.join('')
            }

            return ntype
        })

        commented = nblock.join('');
    } else {
        // Process only line comment blocks
        commented = sql;
    }

    /**
     * Returns:
     * - SQL with multiple line COMMENT blocks
     * - without any leading whitespaces on each line
     * - all dash or slash comment (-- or //) converted to comment blocks
     * - swap apostrophes within COMMENT BLOCKS into backticks
     **/
    return commented.replace(
        /^\s*/gm, ''
    ).replace(
        /([^{#])(.*)([/][*])(.*)([*][/])(.*)([#][}])/g, '$4$6$7'
    ).replace(
        /(.*)(?<!\/\*)(--{1,}\1+)(?!(.*\*\/))(.*)/g, ' /* $4 */'
    ).replace(
        /(.*)(?<!\/\*)(\/\/{1,}\1+)(?!(.*\*\/))(.*)/g, ' /* $4 */'
    ).replace(
        /(?<=\/\*)(.*)(\w)(')(\w)(.*)(?=\*\/)/g, '$1$2`$4$5'
    );
}

// ----------------------------------------------------------------------------
// What: Process SQL text from editor window into tokens
// Why:  Use tokens to transform editor SQL into formated SQL text
// How:  Use tokens to generate keywords, words, and comment tokens
function tokenize(sql) {
    /**
     * Tokenizes the given sql and returns a list of tokens. 
     * 
     * @param {String} sql
     * @returns {Array}
     */

    // init
    const tokens = [];
    let idx_current = 0;
    let idx_processed = 0;
    let idx_end_of_sql = sql.length;

    while (idx_processed < idx_end_of_sql) {

        if (idx_current > idx_end_of_sql) {
            tokens.push(
                sql.slice(
                    idx_processed,
                    idx_end_of_sql
                ).replace(/(^\s*|\s*$)/g, ''));
            break;
        }

        for (let i = 0; i < idx_current - idx_processed + 1; i++) {
            const word = sql.slice(idx_current - i, idx_current);

            if (isReservedWord(word)) {
                if ((idx_current - i) - idx_processed >= 0) {
                    const tmp = sql.slice(
                        idx_processed,
                        idx_current - i
                    ).replace(/(^\s*|\s*$)/g, '');

                    if (tmp.split("'").length === 2 ||
                        tmp.split('"').length === 2) {
                        // skip when quotes are not closed.
                        continue;
                    }

                    if (['/*', '*/', '(', ')', ',', ';'].includes(word)) {
                        // pass
                    } else if (
                        (idx_current - i - 1 === -1 ||
                            [' ', '(', '*/', ';'].includes(sql[idx_current - i - 1])) &&
                        (idx_current >= idx_end_of_sql ||
                            [' ', ')', '/*', ';'].includes(sql[idx_current]))
                    ) {
                        // pass
                    } else {
                        continue;
                    }

                    if (tmp.length > 0) {
                        tokens.push(tmp);
                    }
                }

                tokens.push(word);
                idx_processed = idx_current;
                break;
            }
        }
        idx_current += 1;
    }

    return tokens;
}

module.exports = function format(text, opt) {
    /**
     * @param {String} text 
     * @returns {String}
     */

    /**
     * Regex steps:
     * - Process COMMENT blocks
     * - trim any leading whitespaces on each line
     * - remove any carriage returns or new lines
     * - ensure that ')' are treated as keywords
     * - remove any existing `Outcome` COMMENT blocks
     * - ensure THEN|FROM|ON|OR|AND are treated as keywords
     **/
    const sql = commentBlocks(text).replace(
        /(\r\n|\r|\n)/g, ' '
    ).replace(
        /\s+/g, ' '
    ).replace(
        /(\))(\w)/g, '$1 $2'
    ).replace(
        /\/\* Outcome \*\//g, ''
    ).replace(
        /(AND|AS|FROM|IN|ON|OR|THEN)\(/g, '$1 ('
    );

    const tokens = tokenize(sql);
    const stack = new CustomArray();
    const formatted = new CustomQueue();

    // Function to configure margin blocks by type
    function setStack(name, size) {
        stack.push(
            {
                type: name,
                margin: size
            }
        )
    }

    // Function to configure margin based on current margin
    function setMargin(marginChk, checkTrue, checkFalse) {
        if (stack.getMargin() === marginChk) {
            formatted.pushItems('\n', ' '.repeat(stack.getMargin(checkTrue)));
        } else {
            formatted.pushItems('\n', ' '.repeat(stack.getMargin(checkFalse)));
        }
    }

    function trimLines() {
        // Remove any extraneous lines
        while ((formatted[formatted.length - 1] || '').trim() === '') {
            formatted.pop();
        }
    }

    let keyword = '';       // Any keyword
    let last_word = '';     // Any word (including keywords)
    let last_keyword = '';  // Prior keyword
    let last_comment = '';  // Track OUTCOME comment block
    let last_primary = '';  // Top-level keywords (those that drive margins)
    let from_block = '';    // Keyword to track inline FROM blocks
    let case_block = false; // Manage CASE block stack across keywords
    let output = '';        // Final SQL to return to editor

    // Format the query by tokens
    while (tokens.length) {
        const word = tokens.shift(); // Remove next item from the beginning of token array

        if (isReservedWord(word)) {
            keyword = word.toUpperCase();

        } else {
            keyword = '';
        }

        // ###################################################################################
        // Process comment blocks.
        // ###################################################################################
        if (cwords.includes(keyword) || stack.peek() === 'COMMENT') {
            if (['/*', '{#'].includes(keyword)) {
                if (isNextKeyword(tokens, ['OUTCOME'])) {
                    last_comment = 'OUTCOME'
                }

                setStack('COMMENT', 0)

                if (last_word === ';' || last_word === '') {
                    formatted.pushItems(word);

                } else {
                    trimLines()
                    switch (stack.peek(-2)) {
                        case 'ON':
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin(3)), word);

                            break;
                        case 'CREATE':
                        case 'FUNCTION':
                        case 'INTO':
                        case 'WITH':
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin(0)), word);

                            break;
                        default:
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin(7)), word);
                    }
                }
            } else if (['*/', '#}'].includes(keyword)) {
                // End comment block
                if (stack.peek() !== 'WITH') {
                    stack.pop();
                }

                // Close the comment
                formatted.pushItems(' ', word);

                if (isNextKeyword(tokens, ['WHERE'])) {
                    if (stack.peek() === 'ON') {
                        stack.pop();
                    }
                }

                if (last_keyword === 'FROM') {
                    setMargin(0, opt.startingWidth, 6);

                } else if (last_keyword === 'WHERE') {
                    if (stack.peek() == 'JOIN') {
                        setMargin(0, opt.startingWidth - 2, 4);

                    } else {
                        setMargin(0, opt.startingWidth, 6);

                    }

                } else if ([';'].includes(peekNextWord(tokens))) {
                    // Close out any query ending after a comment
                    while (stack.length) {
                        stack.pop()
                    }
                } else if (isNextKeyword(tokens, ['JOIN'], 1)) {
                    trimLines()

                    if (!isNextKeyword(tokens, ['SELECT', '('], 1)) {
                        if (stack.peek() === 'ON') {
                            stack.pop();
                        }
                    }

                } else if (isNextKeyword(tokens, ['SELECT', 'CREATE', 'INSERT', 'WITH', 'AS', 'GROUP BY', 'ORDER BY', '('])) {
                    if (isNextKeyword(tokens, ['SELECT']) && last_keyword === '(') {
                        setMargin(0, 0, 0);

                    } else if (isNextKeyword(tokens, ['WITH'])) {
                        while (stack.length) {
                            if (stack.peek() === 'WITH') {
                                break;
                            }
                            stack.pop();
                        }

                        setMargin(0, 0, 0);

                    } else if (last_keyword === ')' && isNextKeyword(tokens, ['SELECT'])) {
                        last_comment = ''
                        while (stack.length) {
                            if (stack.peek() === 'WITH') {
                                break;
                            }
                            stack.pop();
                        }
                        setStack('SELECT', opt.startingWidth)

                    } else if (last_keyword === ',' && isNextKeyword(tokens, ['AS'])) {
                        while (stack.length) {
                            if (stack.peek() === 'WITH') {
                                break;
                            }
                            stack.pop();
                        }

                    } else if (isNextKeyword(tokens, ['GROUP BY', 'ORDER BY'])) {

                    } else if (isNextKeyword(tokens, ['('])) {
                        trimLines()
                        setMargin(0, 6, 6)

                    } else {
                        if ((formatted[formatted.length - 1] || '').trim() === '*/') {
                            setMargin(0, 0, 0)
                        }
                    }
                } else if (isNextKeyword(tokens, [','])) {
                    switch (stack.peek()) {
                        case 'FUNCTION':
                            setMargin(0, 1, -3)

                            break;
                        case 'BY':
                            setMargin(0, 9, 5)

                            break;
                        default:
                        // pass
                    }
                } else {
                    setMargin(0, 0, 0);

                }

            } else {
                // In-comment
                formatted.pushItems(' ', word);
            }

            continue;
        }

        // ###################################################################################
        // Process jinja blocks
        // ###################################################################################
        if (dwords.includes(keyword) || stack.peek() === 'JINJA') {
            if (['{%'].includes(keyword)) {
                // Start JINJA block
                setStack('JINJA', 4)

                if (keyword === '{%') {
                    formatted.pushItems('\n\n', ' '.repeat(stack.getMargin(-12)), word, ' ');
                } else {
                    formatted.pushItems(' ', word, ' ');
                }

            } else if (['{{'].includes(keyword)) {
                if (stack.peek() === 'SELECT') {
                    setMargin(0, 6, 6);
                }

                if (last_word === 'WHERE') {
                    if (['1=1', '1=1AND'].includes(word.replace(/ /g, ''))) {
                        if (['1=1AND'].includes(word.replace(/ /g, ''))) {
                            continue
                        }
                    } else {
                        formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin(2)), ' AND');
                    }
                    last_keyword = 'AND';
                    last_word = 'AND';
                }

                formatted.pushItems(' ', word);

            } else if (['}}'].includes(keyword)) {
                formatted.pushItems(' ', word);

            } else if (['%}'].includes(keyword)) {
                // End JINJA block
                stack.pop();
                formatted.pushItems(' ', word);
                setMargin(0, 6, 6);

            } else {
                // In-JINJA
                if (word === ',') {
                    formatted.pushItems(word, ' ');
                } else if (keyword === '{%') {
                    formatted.pushItems('\n', ' '.repeat(stack.getMargin()), word);
                } else {
                    formatted.pushItems(' ', word);
                }
            }
            continue;
        }

        // ###################################################################################
        //  Process margins.
        // ###################################################################################
        if (kwords.includes(keyword)) {
            last_primary = keyword
            // Adjust the keyword margins and spacing
            switch (keyword) {
                case 'SELECT':
                    if (stack.getMargin() < opt.startingWidth) {
                        setStack('SELECT', opt.startingWidth)
                    } else {
                        setStack('SELECT', 0)
                    }

                    if (last_word) {
                        if (last_word == '(') {
                            // pass
                        } else if (last_word === ')' && stack.peek(-1) === 'SELECT' || stack.peek(-2) === 'SELECT') {
                            // Process the outcome query in a CTE set
                            if (last_comment !== 'OUTCOME') {
                                // Clear the stack
                                while (stack.length) {
                                    if (stack.peek() === 'WITH') {
                                        break;
                                    }
                                    stack.pop();
                                }

                                // Pop out of the current WITH block
                                stack.pop()

                                // Add an OUTCOME comment
                                if (opt.outcomeComments) {
                                    formatted.pushItems('\n', ' '.repeat(stack.getMargin()), '/* Outcome */');
                                }

                                setStack('SELECT', opt.startingWidth)
                                setMargin(0, 0, 0)

                            } else {
                                setMargin(0, 0, 0)
                            }

                        } else {
                            trimLines()
                            setMargin(0, 0, 0)

                        }
                    } else {
                        formatted.pushItems(' '.repeat(stack.getMargin()));

                    }

                    break;
                case 'CREATE':
                    while (stack.length) {
                        stack.pop()
                    }

                    setStack('CREATE', opt.startingWidth)

                    break;
                case 'WITH':
                    while (stack.length) {
                        if (stack.peek() === 'WITH') {
                            break;
                        }
                        stack.pop();
                    }

                    if (['INTO', 'AS', 'TABLE', 'VIEW', '(', ')'].includes(last_keyword) && isNextKeyword(tokens, ['AS'])) {
                        trimLines()
                        setMargin(0, 0, 0);

                    } else if ([';', ''].includes(last_keyword)) {
                        // Pass

                    } else {
                        formatted.push(' ');
                    }

                    setStack('WITH', opt.startingWidth)

                    break;
                case 'FROM':
                    trimLines()
                    if (stack.peek() !== 'WITH') {
                        stack.pop();
                    }
                    if (stack.peek() === 'FUNCTION') {
                        stack.pop();
                    }

                    if (stack.getMargin() === 0) {
                        setMargin(0, opt.startingWidth + 2, 6);

                    } else if (stack.getMargin() === opt.startingWidth && from_block === '(') {
                        if (stack.peek() === 'WITH') {
                            setStack('SELECT', 4)
                        } else {
                            setStack('SELECT', 8)
                        }

                        setMargin(0, 2, 2);

                    } else if (stack.peek() === 'WITH') {
                        setStack('SELECT', 4)
                        setMargin(0, 3, 3);

                    } else {
                        setMargin(0, 2, 2);
                    }

                    break;
                case 'INSERT':
                    while (stack.length) {
                        stack.pop()
                    }

                    setStack('INSERT', opt.startingWidth)

                    break;
                case 'INTO':
                case 'OVERWRITE':
                    formatted.push(' ');

                    break;
                case 'VALUES':
                    setStack('VALUES', 0)
                    formatted.push('\n');

                    break;
                case 'FULL':
                case 'LEFT':
                    trimLines()
                    if (isNextKeyword(tokens, ['OUTER', 'JOIN'])) {
                        if (stack.peek() === 'INLINE') {
                            setMargin(0, opt.startingWidth - 3, -3)
                        } else {
                            setMargin(0, opt.startingWidth - 3, -2)
                        }

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'RIGHT':
                case 'CROSS':
                    trimLines()
                    if (isNextKeyword(tokens, ['OUTER', 'JOIN'])) {
                        if (stack.peek() === 'INLINE') {
                            setMargin(0, opt.startingWidth - 4, -4)
                        } else {
                            setMargin(0, opt.startingWidth - 4, -3)
                        }

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'INNER':
                case 'OUTER':
                    if (isNextKeyword(tokens, ['JOIN'])) {
                        continue;
                    }

                    break;
                case 'JOIN':
                    if (stack.peek() === 'ON') {
                        stack.pop();
                    }

                    setStack('JOIN', 2)

                    if (['LEFT', 'RIGHT', 'FULL', 'CROSS'].includes(last_word)) {
                        formatted.push(' ');

                    } else {
                        trimLines()
                        setMargin(2, opt.startingWidth, 0)
                    }

                    break;
                case 'ON':
                    if (stack.peek() === 'JOIN') {
                        stack.pop();
                    }

                    if (stack.peek() === 'INLINE') {
                        setStack('ON', 4)
                        setMargin(4, opt.startingWidth, 0)
                    } else {
                        setStack('ON', 4)
                        setMargin(4, opt.startingWidth, 1)
                    }

                    break;
                case 'WHERE':
                    trimLines()
                    if (stack.peek() === 'JOIN') {
                        setMargin(0, opt.startingWidth, -1)

                    } else {
                        setMargin(0, opt.startingWidth + 1, 1)
                    }

                    break;
                case 'OR':
                    if (stack.peek() === 'FUNCTION') {
                        setMargin(opt.startingWidth, 4, -4)

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'LIMIT':
                    if (stack.peek() === 'INLINE') {
                        setMargin(0, 0, 1)

                    } else if (stack.getMargin() > 6) {
                        setMargin(0, 0, stack.getMargin() + 6 - stack.peekMargin())

                    } else {
                        setMargin(0, opt.startingWidth + 1, 6 - stack.peekMargin())

                    }

                    break;
                case 'AND':
                    if (stack.peek() === 'INLINE' && stack.peek(-1) === 'ON') {
                        setMargin(0, -2, -2);

                    } else if (stack.peek() === 'INLINE' && stack.peek(-2) === 'ON') {
                        setMargin(0, -5, -5);

                    } else if (stack.peek() === 'BETWEEN') {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('BETWEEN') + 4));

                        if (stack.peek() !== 'WITH') {
                            stack.pop();
                        }

                    } else if (stack.peek() === 'CASE') {
                        setMargin(0, 5, 5);

                    } else if (stack.peek() === 'JOIN') {
                        setMargin(0, 5, 1)

                    } else {
                        trimLines()
                        setMargin(0, opt.startingWidth + 3, 3);
                    }

                    break;
                case 'CASE':
                    if (['('].includes(last_keyword)) {
                        if (formatted.getCurrentPosition() > 50) {
                            formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('AND') + 4));
                        }

                    } else if (['ELSE'].includes(last_word)) {
                        formatted.push(' ');

                    } else if ([','].includes(last_keyword)) {
                        formatted.push(' ');

                    } else if (case_block) {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('AND') + 4));

                    } else if (['THEN'].includes(last_keyword)) {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('AND') + 4));

                    } else if ((formatted.getCurrentPosition() - formatted.getPosOfKeywordPreviousLine(',')) < 10) {
                        // pass

                    } else if (formatted.getPosOfKeywordPreviousLine('CASE WHEN') < formatted.getCurrentPosition()) {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('END')));

                    } else {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine(',') + 4));

                    }
                    setStack('CASE', formatted.getCurrentPosition() - stack.getMargin() + 1)
                    case_block = true;

                    break;
                case 'WHEN':
                    trimLines()
                    if (last_word === 'CASE') {
                        formatted.push(' ');

                    } else {
                        setMargin(0, 4, 4);

                    }

                    break;
                case 'THEN':
                    if (['CASE', 'FUNCTION'].includes(stack.peek()) && formatted.getCurrentPosition() > 60) {
                        setMargin(0, 4, 4);

                    } else {
                        formatted.push(' ');

                    }

                    break;
                case 'ELSE':
                    setMargin(0, 4, 4)

                    break;
                case 'END':
                    setMargin(0, -1, -1)
                    if (stack.peek() !== 'WITH') {
                        stack.pop();
                        if (stack.peek() === 'CASE' || stack.peek(-1) === 'CASE' || stack.peek(-2) === 'CASE' || stack.peek(-3) === 'CASE') {
                            //pass
                        } else {
                            case_block = false;

                        }
                    }

                    break;
                case 'HAVING':
                    trimLines()
                    while (stack.peek() === 'BY') {
                        stack.pop()
                    }

                    setMargin(0, 0, 0);

                    break;
                case 'UNION':
                    trimLines()
                    setMargin(0, 1, 1)

                    break;
                case 'BETWEEN':
                    if (isNextKeyword(tokens, ['AND'])) {
                        setStack('BETWEEN', 0)
                        formatted.push(' ');
                    }

                    break;
                case 'GROUP BY':
                case 'ORDER BY':
                    trimLines()

                    if (stack.peek(-1) === 'ON') {
                        if (stack.getMargin() === 4) {
                            setStack('BY', 1)

                        } else if (stack.peek(-2) === 'INLINE' && stack.peek(-3) === 'WITH') {
                            setStack('BY', -4)

                        } else if ([stack.peek(-2), stack.peek(-3)].includes('WITH')) {
                            setStack('BY', -3)

                        } else {
                            setStack('BY', -4)

                        }

                    } else {
                        if (stack.getMargin() === 0) {
                            setStack('BY', opt.startingWidth - 1)

                        } else if (stack.peek() === 'BY') {
                            // pass

                        } else if (stack.peek() === 'JOIN') {
                            setStack('BY', opt.startingWidth - 6)

                        } else if (['FUNCTION', 'SELECT', 'INLINE', 'ON'].includes(stack.peek())) {
                            setStack('BY', opt.startingWidth - 5)

                        } else {
                            setStack('BY', opt.startingWidth - 6)

                        }
                    }

                    if (['INLINE', 'SELECT', 'ON', 'FUNCTION'].includes(stack.peek(-2))) {
                        setMargin(0, opt.startingWidth - 2, -2)
                    } else {
                        setMargin(0, opt.startingWidth - 3, -1)
                    }

                    break;
                default:
                    formatted.push(' ');
            }

            // Store the keyword
            formatted.push(word.toUpperCase());

            // Record the last keyword that is not a comment
            if (isReservedWord(word) && !['/*', '*/', '{{', '}}', '{%', '%}'].includes(word)) {
                last_keyword = keyword;
            }

            last_word = word.toUpperCase();
            continue;
        }

        // Add where 1=1, if not included
        if (last_word === 'WHERE') {
            if (['1=1', '1=1AND'].includes(word.replace(/ /g, ''))) {
                if (['1=1AND'].includes(word.replace(/ /g, ''))) {
                    continue
                }
            } else {
                if (opt.whereOneOne) {
                    if (stack.getMargin() === 0) {
                        formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin(6)), ' AND');
                    } else {
                        formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin(2)), ' AND');
                    }

                }
            }
        }

        if (['OVER'].includes(last_word)) {
            formatted.push(' ');
        }

        // Remove superfloud lines
        if (last_keyword === 'WITH' && isNextKeyword(tokens, ['AS'])) {
            trimLines()
        }

        // ###################################################################################
        //  Process stack blocks and store last words
        // ###################################################################################
        if (['(', ')'].includes(keyword) && stack.peek() !== 'JINJA') {
            switch (keyword) {
                // Open new block
                case '(':
                    if (last_keyword === 'JOIN') {
                        // pass
                    } else if (last_keyword === 'IN') {
                        if (isNextKeyword(tokens, ['SELECT'])) {
                            formatted.push(' ');
                        }

                    } else if (last_primary === 'INTO') {
                        formatted.pushItems('\n', ' '.repeat(4));

                    } else if (['AND', 'WHERE'].includes(last_keyword)) {
                        // pass
                    } else if (stack.peek(-1) === 'CREATE') {
                        if (last_keyword === 'FROM') {
                            // pass
                        } else {
                            formatted.push(' ');
                        }
                    } else if (['INSERT', 'VALUES'].includes(stack.peek(-1))) {
                        formatted.pushItems('\n', ' '.repeat(5));
                    }

                    // Define the type of stack
                    if (word === '(') {
                        if (stack.peek() === 'CREATE') {
                            if (['CREATE', 'OR', 'REPLACE'].includes(last_keyword)) {
                                setStack('ATTRIBUTES', 0)
                            }
                        } else {
                            setStack('INLINE', formatted.getCurrentPosition() - stack.getMargin() + 2)
                        }
                    }

                    if (isNextKeyword(tokens, ['SELECT'])) {
                        formatted.push(' ');

                    } else if (last_keyword === 'ON') {
                        if (stack.peek() === 'INLINE') {
                            // pass
                        } else if (last_word === 'ON') {
                            formatted.push(' ');
                        } else {
                            formatted.push(' ');
                        }

                    } else if (['INSERT', 'VALUES'].includes(stack.peek(-2))) {
                        // pass
                    } else if (stack.peek() === 'ATTRIBUTES') {
                        if (['('].includes(last_word)) {
                            formatted.push('\n ');
                        }

                    } else { // function
                        if (stack.peek() !== 'ATTRIBUTES') {
                            setStack('FUNCTION', 0)
                        }
                        // do not append any whitespaces
                    }
                    formatted.push(word);

                    break;
                // Close existing block
                case ')':
                    const popped = stack.pop();

                    if (peekNextWord(tokens) === ';') {
                        formatted.pushItems(word);
                        while (stack.length) {
                            stack.pop()
                        }
                        from_block = '';
                        formatted.push('\n;\n\n');
                        last_word = ';';
                        tokens.shift()
                        continue
                    }

                    if (popped) {
                        if (['FUNCTION', 'ATTRIBUTES'].includes(popped.type)) {
                            if (stack.peek() !== 'WITH') {
                                stack.pop();
                            }

                        } else if (stack.peek() === 'ON') {
                            stack.pop();

                        } else if (popped.type === 'INLINE' && ['AND', 'ON', 'FROM'].includes(last_primary)) {
                            // pass
                        } else if (['INSERT', 'VALUES'].includes(stack.peek(-1))) {
                            formatted.pushItems('\n', ' '.repeat(5));
                            stack.pop();

                        } else if (popped.type === 'INLINE') {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin() + popped.margin - 1));
                        }
                    }
                    formatted.push(word);

                    // Address functions in the 'BY' stacks
                    if (stack.peek(-3) === 'BY' && isNextKeyword(tokens, [')'])) {
                        setStack('BY', 0)
                    }
                    if ((stack.peek(-3) === 'BY' || stack.peek(-2) === 'BY' || stack.peek(-1) === 'BY')
                        && isNextKeyword(tokens, [','])) {
                        while (stack.peek(-1) !== 'BY') {
                            if (stack.peek() === 'WITH') {
                                break;
                            }
                            stack.pop();
                        }

                        // Process any operations on a function, before proceeding to next BY element
                        if (peekNextWord(tokens) !== ',' && word === ')') {
                            formatted.pushItems(peekNextWord(tokens));
                            tokens.shift()
                        }

                        setMargin(0, 8, 4)
                    }

                    break;

            }

            // don't forget to update last keyword
            if (isReservedWord(word) && !['/*', '*/', '{{', '}}', '{%', '%}'].includes(word)) {
                last_keyword = keyword;
            }
            if (pwords.includes(word) && last_word === 'FROM') {
                from_block = word
            }

            last_word = word.toUpperCase();
            continue;
        }

        // ###################################################################################
        //  Process identifiers, expressions, .. etc.
        // ###################################################################################
        if (['SELECT', 'CREATE', 'FROM', 'JOIN', 'LIMIT', 'OR', 'CASE'].includes(last_word)) {
            formatted.push(' ');

        } else if (last_primary === 'FROM') {
            // account for NON-ANSI SQL joins
            if (keyword === ',') {
                if (last_keyword === 'FROM') {
                    setMargin(0, 5, 5)

                } else {
                    setMargin(0, 4, 4)

                }
            }

            if (last_keyword === ',') {
                if (isNextKeyword(tokens, ['AS'])) {
                    // Ensure there is a newline ater a comma before new CTE
                    setMargin(0, 0, 0)

                } else {
                    formatted.push(' ');

                }
            }

        } else if (last_keyword === '(' && stack.peek() === 'INLINE' && last_primary !== 'INTO') {
            // pass
        } else if (last_keyword === '(' && stack.peek() === 'FUNCTION') {
            // pass
        } else if (last_keyword === ')' && keyword === ',' && isNextKeyword(tokens, ['AS'])) {
            while (stack.length) {
                if (stack.peek() === 'WITH') {
                    break;
                }
                stack.pop();
            }

            formatted.push(',');
            if (isReservedWord(word) && !['/*', '*/', '{{', '}}', '{%', '%}'].includes(word)) {
                last_keyword = keyword;
            }

            last_word = ','
            continue

        } else if (last_keyword === ')' && keyword === ',' && isNextKeyword(tokens, [')'])) {
            // pass
        } else if (last_keyword === ')' && keyword === ',' && isNextKeyword(tokens, ['OVER'], 3)) {
            while (stack.length) {
                if (stack.peek() === 'SELECT') {
                    break;
                }
                stack.pop();
            }
            setMargin(0, 5, 5)

        } else if (last_keyword === 'END' && keyword === ',' && stack.peek() === 'BY') {
            trimLines()
            setMargin(4, opt.startingWidth + 1, 5)

        } else if (last_keyword === ')' && keyword === ',' && stack.peek() === 'BY') {
            trimLines()

            if (stack.getMargin() === 0) {
                setStack('BY', 4)
            }
            setMargin(4, opt.startingWidth + 1, 5)

        } else if (stack.peek() === 'SELECT') {
            // column identifier
            if (keyword === ',') {
                if (stack.getMargin() === opt.startingWidth && last_keyword === 'SELECT' && from_block === '(') {
                    setStack('SELECT', 8)
                }
                setMargin(0, 4, 4)
            }

            // assess operators
            if (isOperater(word) && last_keyword !== ',') {
                // pass
            } else {
                formatted.push(' ');
            }

        } else if (['INSERT', 'VALUES'].includes(stack.peek(-2))) {
            // column identifier
            if (keyword === ',') {
                setMargin(0, -3, -3)
            }

            formatted.push(' ');

        } else if (['WHERE', 'AND', 'BETWEEN', 'WHEN', 'THEN', 'ELSE', 'AS', 'END', 'HAVING', ')', 'INTO', 'OVERWRITE'].includes(last_keyword)) {
            if (word.includes('::')) {
                //
            } else if (word.includes(',') && last_keyword === 'END') {
                setMargin(0, 0, 5)

            } else {
                formatted.push(' ');
            }

        } else if (stack.peek() === 'ON') {
            if (isNextKeyword(tokens, ['AND', 'WHERE', 'LEFT', 'RIGHT', 'CROSS', 'JOIN', ')'])) {
                if (stack.peek() !== 'WITH') {
                    stack.pop();
                }
            }

            formatted.push(' ');

        } else if (stack.peek() === 'INLINE') {
            if (stack.peek(-1) === 'CREATE') {
                if (keyword === ',') {
                    formatted.push(' ');
                    setMargin(0, 0, 0)
                }
            }

        } else if (stack.peek() === 'BY') {
            if (keyword === ',') {
                if (generateArrayOfNumbers(100).includes(peekNextWord(tokens))) {
                    // pass
                } else {
                    trimLines()
                    if (stack.getMargin() === 0) {
                        setMargin(0, opt.startingWidth + 5, 5)
                    } else {
                        setMargin(4, opt.startingWidth + 1, 5)
                    }
                }

            } else {
                formatted.push(' ');

                if (!isNextKeyword(tokens, [',', '/*'])) {
                    if (stack.peek() !== 'WITH') {
                        stack.pop();
                    }
                }

                if (isNextKeyword(tokens, ['('])) {
                    setStack('BY', 0)
                }

            }
        } else if (['FUNCTION'].includes(stack.peek())) {
            if (last_word === ',') {
                formatted.push(' ');

            }
            // do not append any whitespaces
        } else if (['ATTRIBUTES'].includes(stack.peek())) {
            if (last_word === ',') {
                formatted.push(' ');

            } else if (last_word === '(') {
                setMargin(0, 2, 2)

            } else {
                setMargin(0, 0, 0);

            }

        } else {
            setMargin(0, 0, 0);
        }

        // don't forget to update last keyword
        if (isReservedWord(word) && !['/*', '*/', '{{', '}}', '{%', '%}'].includes(word)) {
            last_keyword = keyword;
        }

        // Always reset the stack at end the end of each query 
        if (word === ';') {
            while (stack.length) {
                stack.pop()
            }
            from_block = '';

            trimLines()

            formatted.push('\n;\n\n');
            last_word = ';';
            last_comment = '';

        } else {
            formatted.push(word);
            last_word = word.toUpperCase();
        }
    }

    // revert backticks to apostrophes in comment blocks
    if (opt.blockComments) {
        // Output comment blocks (/* */)
        output = formatted.join('').replace(/(?<=\/\*)(.*)(\w)(`)(\w)(.*)(?=\*\/)/g, "$1$2'$4$5");

    } else {
        // Output dash comments ('--')
        output = formatted.join(''
        ).replace(
            /(?<=\/\*)(.*)(\w)(`)(\w)(.*)(?=\*\/)/g, "$1$2'$4$5"
        ).replace(
            /(.*)([/][*])(.*)([ ][*][/])/g, "$1-- $3"
        );

    }
    // formatted.pushItems('-->', 'chk0', '<--');
    // formatted.pushItems('-->', stack.peek(-2), '-*-', stack.getMargin(), '-*-', last_primary, '<--');
    return output;
}