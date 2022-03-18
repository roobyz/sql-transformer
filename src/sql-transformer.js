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

function generateArrayOfNumbers(numbers) {
    var aon = [...Array(numbers).keys()].slice(1)

    return aon.map(String)
}

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

module.exports = function format(text) {
    /**
     * @param {String} text 
     * @returns {String}
     */

    /**
     * Regex steps:
     * - trim any leading whitespaces on each line
     * - convert dash or slash comment (-- or //) to comment blocks (including at end of line)
     * - remove any carriage returns or new lines
     * - replace single quotes with backticks
     * - remove any existing `Outcome` comments
     * - ensure ON is treated as a kwyword
     **/
    const sql = text.replace(
        /^\s*/gm, ''
    ).replace(
        /^--(.*)/gm, '/* $1 */'
    ).replace(
        /^\/\/(.*)/gm, '/* $1 */'
    ).replace(
        /([^{#])(.*)([/][*])(.*)([*][/])(.*)([#][}])/g, '$4$6$7'
    ).replace(
        /(\r\n|\r|\n)/g, ' '
    ).replace(
        /\s+/g, ' '
    ).replace(
        /[']/g, '`'
    ).replace(
        /\/\* Outcome \*\//g, ''
    ).replace(
        /THEN\(/g, 'THEN ('
    ).replace(
        /ON\(/g, 'ON ('
    ).replace(
        /AND\(/g, 'AND ('
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

    let keyword = '';
    let last_word = '';
    let last_keyword = '';
    let last_comment = '';
    let last_primary = '';
    let from_block = '';
    let case_block = false;
    let output = '';

    while (tokens.length) {
        const word = tokens.shift(); // Remove next item from the beginning of token array

        if (isReservedWord(word)) {
            keyword = word.toUpperCase();

        } else {
            keyword = '';
        }

        // Process comment blocks.
        if (cwords.includes(keyword) || stack.peek() === 'COMMENT') {
            if (['/*', '{#'].includes(keyword)) {
                if (isNextKeyword(tokens, ['OUTCOME'])) {
                    last_comment = 'OUTCOME'
                }

                // Start comment block
                if (stack.getMargin() === 0) {
                    setStack('COMMENT', 4)

                } else {
                    setStack('COMMENT', 0)

                }

                if (last_word === ';' || last_word === '') {
                    formatted.pushItems(word);

                } else {
                    while ((formatted[formatted.length - 1] || '-').trim() === '') {
                        formatted.pop()
                    }

                    if (stack.peek(-2) === 'ON') {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin(3)), word);

                    } else if (stack.peek(-2) !== 'FUNCTION') {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin(7)), word);

                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin(0)), word);
                    }

                }

            } else if (['*/', '#}'].includes(keyword)) {
                // End comment block
                if (stack.peek() !== 'WITH') {
                    stack.pop();
                }

                // Close the comment
                formatted.pushItems(' ', word);

                if (isNextKeyword(tokens, [')'])) {
                    setMargin(0, 0, 0);
                }

                if ((formatted[formatted.length - 1] || '') === '*/') {
                    if (last_keyword === 'WHERE') {
                        setMargin(0, 6, 6);

                    } else if (['INSERT', 'CREATE'].includes(peekNextWord(tokens))) {
                        setMargin(0, 0, 0);

                    } else if (kwords.includes(peekNextWord(tokens))) {
                        // pass

                    } else if ([','].includes(peekNextWord(tokens))) {
                        // pass

                    } else {
                        setMargin(0, 0, 0);

                    }
                }

                if (isNextKeyword(tokens, ['JOIN'], 1)) {
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
                        setStack('SELECT', 4)

                    } else if (last_keyword === ',' && isNextKeyword(tokens, ['AS'])) {
                        while (stack.length) {
                            if (stack.peek() === 'WITH') {
                                break;
                            }
                            stack.pop();
                        }

                        setMargin(0, 0, 0);

                    } else if (isNextKeyword(tokens, ['GROUP BY', 'ORDER BY'])) {
                        formatted.pushItems(' '.repeat(stack.getMargin(-2)));
                        if (stack.getMargin() === 0) {
                            setStack('BY', 4)

                        } else {
                            setStack('BY', 0)

                        }

                    } else if (isNextKeyword(tokens, ['('])) {
                        while ((formatted[formatted.length - 1] || '').trim() === '') {
                            formatted.pop();
                        }

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
                }

            } else {
                // In-comment
                formatted.pushItems(' ', word);

            }

            continue;
        }

        // Process jinja blocks
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

        //  Process keywords.
        if (kwords.includes(keyword)) {
            last_primary = keyword
            // Adjust the keyword margins and spacing
            switch (keyword) {
                case 'SELECT':
                    if (stack.getMargin() < 4) {
                        setStack('SELECT', 4)
                    } else {
                        setStack('SELECT', 0)
                    }

                    if (last_word) {
                        if (last_word == '(') {
                            // pass
                        } else if (last_word === ')' && stack.peek(-1) === 'SELECT' || stack.peek(-2) === 'SELECT') {
                            if (last_comment !== 'OUTCOME') {
                                while (stack.length) {
                                    if (stack.peek() === 'WITH') {
                                        break;
                                    }
                                    stack.pop();
                                }

                                stack.pop()
                                formatted.pushItems('\n', ' '.repeat(stack.getMargin()), '/* Outcome */');
                                setStack('SELECT', 4)
                                setMargin(0, 0, 0)

                            } else {
                                setMargin(0, 0, 0)
                            }

                        } else {
                            while ((formatted[formatted.length - 1] || '').trim() === '') {
                                formatted.pop();
                            }
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

                    setStack('CREATE', 4)

                    break;
                case 'WITH':
                    while (stack.length) {
                        if (stack.peek() === 'WITH') {
                            break;
                        }
                        stack.pop();
                    }

                    if (['INTO', 'AS', 'TABLE', 'VIEW', '(', ')'].includes(last_keyword) && isNextKeyword(tokens, ['AS'])) {
                        setMargin(0, 0, 0);

                    } else if ([';'].includes(last_keyword)) {
                        formatted.push('')

                    } else {
                        formatted.push(' ');
                    }

                    setStack('WITH', 4)

                    break;
                case 'FROM':
                    if (stack.peek() !== 'WITH') {
                        stack.pop();
                    }

                    if (stack.getMargin() === 0) {
                        setMargin(0, 6, 6);

                    } else if (stack.getMargin() === 4 && from_block === '(') {
                        if (stack.peek() === 'WITH') {
                            setStack('SELECT', 4)
                        } else {
                            setStack('SELECT', 8)
                        }

                        setMargin(0, 2, 2);

                    } else {
                        setMargin(0, 2, 2);
                    }

                    break;
                case 'INSERT':
                    while (stack.length) {
                        stack.pop()
                    }

                    setStack('INSERT', 4)

                    break;
                case 'INTO':
                    formatted.push(' ');

                    break;
                case 'OVERWRITE':
                    formatted.push(' ');

                    break;
                case 'VALUES':
                    setStack('VALUES', 0)
                    formatted.push('\n');

                    break;
                case 'LEFT':
                    // Check for left joins
                    if (isNextKeyword(tokens, ['OUTER', 'JOIN'])) {
                        setMargin(0, 1, -3)

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'RIGHT':
                    // Check for right function
                    if (isNextKeyword(tokens, ['OUTER', 'JOIN'])) {
                        setMargin(0, 0, -4)

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'CROSS':
                    // Check for right function
                    if (isNextKeyword(tokens, ['OUTER', 'JOIN'])) {
                        setMargin(0, 0, -4)

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'FULL':
                    setMargin(0, 1, -3)

                    break;
                case 'INNER':
                    if (isNextKeyword(tokens, ['JOIN'])) {
                        continue;
                    }

                    break;
                case 'OUTER':
                    if (isNextKeyword(tokens, ['JOIN'])) {
                        continue;
                    }

                    break;
                case 'JOIN':
                    if (stack.peek() === 'ON') {
                        stack.pop();
                    }

                    if (last_word === 'CROSS') {
                        setStack('JOIN', 0)

                    } else {
                        setStack('JOIN', 2)
                    }

                    if (['LEFT', 'RIGHT', 'FULL', 'CROSS'].includes(last_word)) {
                        formatted.push(' ');

                    } else {
                        setMargin(2, 4, 0)
                    }

                    break;
                case 'ON':
                    if (stack.peek() === 'JOIN') {
                        stack.pop();
                    }

                    setStack('ON', 4)
                    setMargin(4, 4, 0)

                    break;
                case 'WHERE':
                    if (stack.peek() === 'JOIN') {
                        setMargin(0, 5, -1)

                    } else {
                        setMargin(0, 5, 1)
                    }

                    break;
                case 'OR':
                    if (stack.peek() === 'FUNCTION') {
                        setMargin(4, 4, -4)

                    } else {
                        formatted.push(' ');
                    }

                    break;
                case 'LIMIT':
                    setMargin(0, 5, 1)

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
                        setMargin(0, 7, 3);
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
                    while (stack.peek() === 'BY') {
                        stack.pop()
                    }

                    setMargin(0, 0, 0);

                    break;
                case 'UNION':
                    setMargin(0, 1, 1)

                    break;
                case 'BETWEEN':
                    if (isNextKeyword(tokens, ['AND'])) {
                        setStack('BETWEEN', 0)
                        formatted.push(' ');
                    }

                    break;
                case 'GROUP BY':
                    if (stack.peek(-1) === 'ON') {
                        setStack('BY', -4)

                    } else {
                        setStack('BY', 0)

                    }

                    setMargin(0, 2, -2)

                    break;
                case 'ORDER BY':
                    if (stack.peek(-1) === 'ON') {
                        setStack('BY', -4)

                    } else {
                        setStack('BY', 0)

                    }

                    setMargin(0, 2, -2)

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
                if (stack.getMargin() === 0) {
                    formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin(6)), ' AND');
                } else {
                    formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin(2)), ' AND');
                }
            }
        }

        if (['OVER'].includes(last_word)) {
            formatted.push(' ');
        }

        //  Process stack blocks and store last words
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

        //  Process identifiers, expressions, .. etc.
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
                formatted.push(' ');
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
            setMargin(0, 0, 0)

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

        } else if (stack.peek() === 'SELECT') {
            // column identifier
            if (keyword === ',') {
                if (stack.getMargin() === 4 && last_keyword === 'SELECT' && from_block === '(') {
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
                    // Check whether a margin was created by a COMMENT block
                    if ((formatted[formatted.length - 1] || '').trim() === '') {
                        // pass
                    } else {
                        setMargin(0, 9, 5)
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

            while ((formatted[formatted.length - 1] || '').trim() === '') {
                formatted.pop();
            }

            formatted.push('\n;\n\n');
            last_word = ';';
            last_comment = '';

        } else {
            formatted.push(word);
            last_word = word.toUpperCase();

        }

    }

    // revert backticks to single quotes on the final string
    if (false) {
        // Output dash comments ('--')
        output = formatted.join(''
        ).replace(
            /[`]/g, "'"
        ).replace(
            /(.*)([/][*])(.*)([ ][*][/])/g, "$1-- $3"
        ).replace(
            /(.*)([/][*])(.*)([ ])/g, '$1-- $3'
        ).replace(
            /(.*)([/][*])/g, '$1--'
        );

    } else {
        // Output comment blocks (/* */)
        output = formatted.join('').replace(/[`]/g, "'");

    }
    // formatted.pushItems('-->', 'chk0', '<--');
    // formatted.pushItems('-->', stack.peek(), '<--');
    // formatted.pushItems('-->', stack.getMargin(), '<--');

    return output;

}