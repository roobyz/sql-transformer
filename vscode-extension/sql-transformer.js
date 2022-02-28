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
// Why:  use keywords to process SQL blocks and assign to stack when needed
// ----------------------------------------------------------------------------
const kwords = ['WITH', 'CREATE', 'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'GROUP BY', 'ORDER BY', 'LEFT', 'RIGHT', 'FULL', 'INNER', 'OUTER', 'JOIN', 'ON', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'OVER', 'ALL', 'UNION', 'BETWEEN', 'HAVING', 'LIMIT', 'INSERT', 'IN', 'INTO', 'OVERWRITE', 'VALUES'];

const rwords = [...kwords, ';', '(', ')', ',', '{{', '}}', '/*', '*/'];

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
                const position = this.slice(i + 1, this.length).join('').toUpperCase().indexOf(keyword);
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

function peekNextKeyword(tokens) {
    /**
     * If the next token is keyword, the upper case of the keyword is returned.
     * 
     * @param {Array} tokens 
     * @returns {String}
     */
    for (let i = 0; i < tokens.length; i++) {
        if (isReservedWord(tokens[i])) {
            return tokens[i].toUpperCase();
        }
    }
    return '';
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

    const sql = text.replace(
        /--(.*)/g, '/* $1 */'
    ).replace(
        /(\r\n|\r|\n)/g, ' '
    ).replace(
        /\s+/g, ' '
    );

    const tokens = tokenize(sql);
    const stack = new CustomArray();
    const formatted = new CustomQueue();

    let keyword = '';
    let last_word = '';
    let last_keyword = '';

    while (tokens.length) {
        const word = tokens.shift(); // Remove next item from the beginning of token array

        if (isReservedWord(word)) {
            keyword = word.toUpperCase();
        } else {
            keyword = '';
        }

        //  Process comment blocks.
        if (['/*', '*/'].includes(keyword) || stack.peek() === 'COMMENT') {
            if (keyword === '/*') {
                // Start comment block
                stack.push(
                    {
                        type: 'COMMENT',
                        margin: 0
                    }
                );
                formatted.pushItems(' ', word);
            } else if (keyword === '*/') {
                // End comment block
                stack.pop();
                formatted.pushItems(' ', word);
                if (stack.getMargin() === 0 && peekNextKeyword(tokens, 'SELECT')) {
                    formatted.pushItems('\n');
                }
            } else {
                // In-comment
                formatted.pushItems(' ', word);
            }
            continue;
        }

        //  Process keywords.
        if (kwords.includes(keyword)) {
            // Adjust the keyword margins and spacing
            switch (keyword) {
                case 'SELECT':
                    if (stack.getMargin() < 4) {
                        stack.push(
                            {
                                type: 'SELECT',
                                margin: 4
                            }
                        );
                    } else {
                        stack.push(
                            {
                                type: 'SELECT',
                                margin: 0
                            }
                        );
                    }
                    if (last_word) {
                        if (last_word == '(') {
                            // pass
                        } else if (last_word == ')' && stack.peek(-1) === 'SELECT' || stack.peek(-2) === 'SELECT') {
                            formatted.pushItems('\n/* Outcome */\n', ' '.repeat(stack.getMargin()));
                        } else {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
                        }
                    } else {
                        formatted.pushItems(' '.repeat(stack.getMargin()));
                    }

                    break;
                case 'CREATE':
                    if (stack.getMargin() === 0) {
                        stack.push(
                            {
                                type: 'CREATE',
                                margin: 4
                            }
                        );
                    }






                    break;
                case 'WITH':
                    stack.push(
                        {
                            type: 'WITH',
                            margin: 0
                        }
                    );
                    formatted.push('\n');

                    break;
                case 'FROM':
                    stack.pop();
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 6));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 2));
                    }

                    break;
                case 'INSERT':
                    stack.push(
                        {
                            type: 'INSERT',
                            margin: 0
                        }
                    );
                    break;
                case 'INTO':
                    formatted.push(' ');

                    break;
                case 'OVERWRITE':
                    formatted.push(' ');

                    break;
                case 'VALUES':
                    stack.push(
                        {
                            type: 'VALUES',
                            margin: 0
                        }
                    );
                    formatted.push('\n');

                    break;
                case 'LEFT':
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 1));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 3));
                    }

                    break;
                case 'RIGHT':
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 0));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 4));
                    }

                    break;
                case 'FULL':
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 1));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 3));
                    }

                    break;
                case 'INNER':
                    if (peekNextKeyword(tokens, 'JOIN')) {
                        continue;
                    }

                    break;
                case 'OUTER':
                    if (peekNextKeyword(tokens, 'JOIN')) {
                        continue;
                    }

                    break;
                case 'JOIN':
                    if (stack.peek() === 'ON') {
                        stack.pop();
                    }
                    stack.push(
                        {
                            type: 'JOIN',
                            margin: 2
                        }
                    );
                    if (['LEFT', 'RIGHT', 'FULL'].includes(last_word)) {
                        formatted.push(' ');
                    } else {
                        if (stack.getMargin() === 2) {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 4));
                        } else {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
                        }
                    }

                    break;
                case 'ON':
                    if (stack.peek() === 'JOIN') {
                        stack.pop();
                    }
                    stack.push(
                        {
                            type: 'ON',
                            margin: 4
                        }
                    );
                    if (stack.getMargin() === 4) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 4));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
                    }

                    break;
                case 'WHERE':
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 5));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 1));
                    }

                    break;
                case 'LIMIT':
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 5));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
                    }

                    break;
                case 'AND':
                    // formatted.pushItems(stack.peek())
                    // formatted.pushItems('\n', stack.peek(), '*'.repeat(stack.getMargin() - 2));
                    if (stack.peek() === 'INLINE' && stack.peek(-1) === 'ON') {
                        formatted.pushItems('\n', '*'.repeat(stack.getMargin() - 2));
                    } else if (stack.peek() === 'INLINE' && stack.peek(-2) === 'ON') {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 5));
                    } else if (stack.peek() === 'CASE') {
                        formatted.push(' ');
                    } else if (stack.peek() === 'BETWEEN') {
                        formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('BETWEEN') + 4));
                        stack.pop();
                    } else {
                        if (stack.getMargin() === 0) {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 7));
                        } else {
                            formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 3));
                        }
                    }

                    break;
                case 'CASE':
                    if (last_keyword !== '(') {
                        formatted.push(' ');
                    }
                    stack.push(
                        {
                            type: 'CASE',
                            margin: formatted.getCurrentPosition() - stack.getMargin() + 1
                        }
                    );

                    break;
                case 'WHEN':
                    if (last_word === 'CASE') {
                        formatted.push(' ');
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 4));
                    }

                    break;
                case 'THEN':
                    formatted.push(' ');

                    break;
                case 'ELSE':
                    formatted.pushItems('\n', ' '.repeat(formatted.getPosOfKeywordPreviousLine('WHEN')));

                    break;
                case 'END':
                    formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 1));
                    stack.pop();

                    break;
                case 'HAVING':
                    formatted.pushItems('\n', ' '.repeat(stack.getMargin()));

                    break;
                case 'UNION':
                    formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 1));

                    break;
                case 'BETWEEN':
                    stack.push(
                        {
                            type: 'BETWEEN',
                            margin: 0
                        }
                    );
                    formatted.push(' ');

                    break;
                case 'GROUP BY':
                    stack.push(
                        {
                            type: 'BY',
                            margin: 0
                        }
                    );
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 2));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 2));
                    }

                    break;
                case 'ORDER BY':
                    stack.push(
                        {
                            type: 'BY',
                            margin: 0
                        }
                    );
                    if (stack.getMargin() === 0) {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 2));
                    } else {
                        formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 2));
                    }

                    break;
                default:
                    formatted.push(' ');
            }

            // Store the keyword
            formatted.push(word.toUpperCase());

            // Record the last keyword that is not a comment
            if (isReservedWord(word) && !['/*', '*/'].includes(word)) {
                last_keyword = keyword;
            }
            last_word = word.toUpperCase();
            continue;
        }

        // Add where 1=1, if not included
        if (last_word === 'WHERE') {
            if (word.replace(/ /g, '') === '1=1') {
                // skip
            } else {
                if (stack.getMargin() === 0) {
                    formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin() + 6), ' AND');
                } else {
                    formatted.pushItems(' 1=1', '\n', ' '.repeat(stack.getMargin() + 2), ' AND');
                }
            }
        }

        if (['OVER'].includes(last_word)) {
            formatted.push(' ');
        }

        //  Process parenthesis.
        if (['(', ')'].includes(keyword)) {
            if (keyword === '(') { // parenthesis open
                if (last_keyword === 'JOIN') {
                    // formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 1));
                } else if (stack.peek(-1) === 'CREATE') {
                    formatted.push(' ');
                } else if (last_keyword === 'IN') {
                    formatted.push(' ');
                } else if (['INSERT', 'VALUES'].includes(stack.peek(-1))) {
                    formatted.pushItems('\n', ' '.repeat(5));
                }

                if (stack.peek() === 'CREATE' && word === '(') {
                    stack.push(
                        {
                            type: 'ATTRIBUTES',
                            margin: 0
                        }
                    )
                };
                if (stack.peek() !== 'ATTRIBUTES') {
                    stack.push(
                        {
                            type: 'INLINE',
                            margin: formatted.getCurrentPosition() - stack.getMargin() + 2
                        }
                    );
                }

                if (peekNextKeyword(tokens) === 'SELECT') { // select clause
                    formatted.push(' ');
                } else if (last_keyword === 'ON') { // on clause
                    formatted.push(' ');
                } else if (['INSERT', 'VALUES'].includes(stack.peek(-2))) {
                    // pass
                } else if (stack.peek() === 'ATTRIBUTES') {
                    if (['('].includes(last_word)) {
                        formatted.push('\n ');
                    }
                } else { // function
                    if (stack.peek() !== 'ATTRIBUTES') {
                        stack.push(
                            {
                                type: 'FUNCTION',
                                margin: 0
                            }
                        );
                    }
                    // do not append any whitespaces
                }
                formatted.push(word);
            } else if (keyword === ')') { // parenthesis close
                const popped = stack.pop();
                
                if (['FUNCTION', 'ATTRIBUTES'].includes(popped.type)) {
                    stack.pop();
                } else if (stack.peek() === 'ON') {
                    stack.pop();
                } else if (['INSERT', 'VALUES'].includes(stack.peek(-1))) {
                    formatted.pushItems('\n', ' '.repeat(5));
                    stack.pop();
                } else if (popped.type === 'INLINE') {
                    formatted.pushItems('\n', ' '.repeat(stack.getMargin() + popped.margin - 1));
                }
                formatted.push(word);
            }

            // don't forget to update last keyword
            if (isReservedWord(word) && !['/*', '*/'].includes(word)) {
                last_keyword = keyword;
            }
            last_word = word.toUpperCase();
            continue;
        }

        //  Process identifiers, expressions, .. etc.
        if (last_word === 'SELECT') {
            // first column identifier
            formatted.push(' ');
        } else if (['CREATE', 'FROM', 'JOIN', 'LIMIT'].includes(last_word)) { // table identifier
            formatted.push(' ');
        } else if (stack.peek() === 'SELECT') {
            // column identifier
            if (keyword === ',') {
                formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 4));
            }
            formatted.push(' ');
        } else if (['INSERT', 'VALUES'].includes(stack.peek(-2))) {
            // column identifier
            if (keyword === ',') {
                formatted.pushItems('\n', ' '.repeat(stack.getMargin() - 3));
            }
            formatted.push(' ');
        } else if (last_word === 'FROM') { // table identifier
            formatted.push(' ');
        } else if (['WHERE', 'AND', 'BETWEEN', 'WHEN', 'THEN', 'ELSE',
            'AS', 'END', 'HAVING', ')', 'INTO', 'OVERWRITE'].includes(last_keyword)) {
            formatted.push(' ');
        } else if (stack.peek() === 'ON') {
            if (peekNextKeyword(tokens, 'AND')) {
                stack.pop();
            }
            formatted.push(' ');
        } else if (stack.peek() === 'INLINE' && stack.peek(-2) === 'ON') {
            if (last_word !== '(') {
                formatted.push(' ');
            }
        } else if (stack.peek() === 'BY') {
            if (keyword === ',') {
                // pass
            } else {
                formatted.push(' ');
                if (peekNextKeyword(tokens) !== ',') {
                    stack.pop();
                }
            }
        } else if (stack.peek() === 'INLINE' && stack.peek(-1) === 'CREATE') {
            if (keyword === ',') {
                formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
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
                formatted.pushItems('\n', ' '.repeat(stack.getMargin() + 2));
            } else {
                formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
            }

        } else {
            // first select
            if (word === ';') {
                // pass
            } else {
                formatted.pushItems('\n', ' '.repeat(stack.getMargin()));
            }
        }

        if (word === ';') {
            formatted.push('\n;\n\n');
        } else {
            formatted.push(word);
        }

        // don't forget to update last keyword
        if (isReservedWord(word) && !['/*', '*/'].includes(word)) {
            last_keyword = keyword;
        }
        last_word = word.toUpperCase();
    }

    return formatted.join('');
}