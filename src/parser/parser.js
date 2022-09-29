const TokenTypes = require('../constants/tokenTypes');
const { exit } = require('process');
const Token = require('../constants/Token');
/**
 * We will be using Backus-Naur Form for specifying our grammar. 
 * All the non terminals would start with a capital letter,
 * and all the terminals would start with a small letter
 * Program -> Function_Declaration
 * Function_Declaration -> "int" function_name "(" ")" "{" Statement "}"
 * Statement -> "return" Expression ";"
 * Expression -> Term { ("+" | "-") Term }
 * Term -> Factor { ("*" | "/") Factor }
 * Factor -> "(" Expression ")" | UnaryOperator Factor | integer
 * BinaryOperator -> "-" | "+" | "/" | "*"
 * UnaryOperator -> "-" | "~" | "!"
 */

/**
 * Class for a node of the abstract syntax tree.
 */
class Node {
    /**
     * Constructor that returns a Node
     * @param {string} value Value of the node 
     * @param {Node[]} children Children array of the current node
     */
    constructor(type, value, children) {
        this.type = type;
        this.value = value;
        this.children = children;
    }
}

/**
 * Returns true if the token is a unary operator, false otherwise
 * @param {Object} token 
 */
function isUnaryOperator(token) {
    if (token.tokenType == TokenTypes.MINUS.name || token.tokenType == TokenTypes.LOGICAL_NEGATION.name || token.tokenType == TokenTypes.BITWISE_COMPLEMENT.name) {
        return true;
    }
    return false;
}

/**
 * This function parses factors
 * @param {Array} tokens An array of tokens
 * @param {Object} indexObject An object that holds the value of current index, as javascript
 * doesn't support pass by reference for atomic integers
 */
function parseFactor(tokens, indexObject) {
    let token = tokens[indexObject.value];
    // Check if token exists
    if (!token) {
        console.log('Unexpected end of input. Exiting');
        exit(1);
    }
    // Check if it is opening parentheses
    else if (token.tokenType == TokenTypes.OPEN_PARENTHESES.name) {
        indexObject.value++;
        // parse expression inside
        let expression = parseExpression(tokens, indexObject);
        // check if closing parentheses are there
        token = tokens[indexObject.value];
        if (token.tokenType != TokenTypes.CLOSE_PARENTHESES.name) {
            console.log(`I was expecting a closing parentheses. How mean of you to not put that in your code. I'm gonna exit now...`);
            exit(1);
        }
        return expression;
    }
    // check if it is unary operator
    else if (isUnaryOperator(token)) {
        indexObject.value++;
        let factor = parseFactor(tokens, indexObject);
        return new Node(token.tokenType, token.value, [factor]);
    }
    // check if it is integer
    else if (token.tokenType == TokenTypes.INTEGER_LITERAL.name) {
        indexObject.value++;
        return new Node(token.tokenType, token.value, []);
    } else {
        console.log(`Duh! What's this character? I didn't expect this: ${token.value}. Exiting...`);
        exit(1);
    }
}

/**
 * This function parses terms
 * @param {Array} tokens An array of tokens
 * @param {Object} indexObject An object that holds the value of current index, as javascript
 * doesn't support pass by reference for atomic integers
 */
function parseTerm(tokens, indexObject) {
    let token = tokens[indexObject.value];
    if (!token) {
        console.log(`Ahh! Can't see any more tokens to finish the input! Exiting...`);
        exit(1);
    } else {
        let factor = parseFactor(tokens, indexObject);
        token = tokens[indexObject.value];
        while (token.tokenType == TokenTypes.MULTIPLICATION.name || token.tokenType == TokenTypes.DIVISION.name) {
            indexObject.value++;
            let nextTerm = parseTerm(tokens, indexObject);
            factor = new Node(token.tokenType, token.value, [factor, nextTerm]);
            token = tokens[indexObject.value];
        }
        return factor;
    }
}


/**
 * This function parses expressions
 * @param {Array} tokens An array of tokens
 * @param {Object} indexObject An object that holds the value of current index, as javascript
 * doesn't support pass by reference for atomic integers
 */
function parseExpression(tokens, indexObject) {
    let token = tokens[indexObject.value];
    if (!token) {
        console.log('Unexpected end of input.');
        exit(1);
    }
    else {
        let term = parseTerm(tokens, indexObject);
        token = tokens[indexObject.value];
        while (token.tokenType == TokenTypes.ADDITION.name || token.tokenType == TokenTypes.MULTIPLICATION.name) {
            indexObject.value++;
            let nextTerm = parseTerm(tokens, indexObject);
            term = new Node(token.tokenType, token.value, [term, nextTerm]);
            token = tokens[indexObject.value];
        }
        return term;
    }
}

/**
 * This function parses statements
 * @param {Array} tokens An array of tokens
 * @param {Object} indexObject An object that holds the value of current index, as javascript
 * doesn't support pass by reference for atomic integers
 */
function parseStatement(tokens, indexObject) {
    let token = tokens[indexObject.value];
    if (!token) {
        console.log('Unexpected end of input. Exiting');
        exit(1);
    } else if (token.tokenType != TokenTypes.RETURN_KEYWORD.name) {
        console.log('Error while parsing statement. Expected return statement');
        exit(1);
    } else {
        // Return keyword was found, hence next we should have an integer
        indexObject.value++;
        token = tokens[indexObject.value];
        if (!token) {
            console.log('Unexpected end of input. Exiting');
            exit(1);
        } else {
            // This would return the expression AND it would increment
            // the current index
            let expression = parseExpression(tokens, indexObject);
            let statement = new Node(TokenTypes.STATEMENT.name, 'return', [expression]);
            // if we don't encounter a semicolon now, it means there is 
            // syntax error
            token = tokens[indexObject.value];
            if (!token) {
                console.log('Unexpected end of input. Exiting');
                exit(1);
            } else if (token.tokenType != TokenTypes.SEMICOLON.name) {
                console.log('Syntax Error, expected a semicolon. Exiting');
                exit(1);
            } else {
                indexObject.value++;
                return statement;
            }
        }
    }
}

/**
 * This function parses functions (LOL)
 * @param {Array} tokens  An array of tokens
 * @param {Object} indexObject An object that holds the value of current index, as javascript
 * doesn't support pass by reference for atomic integers
 */
function parseFunction(tokens, indexObject) {
    let token = tokens[indexObject.value];
    let functionName = '';
    if (!token) {
        // Unexpected end of input
        console.log('Unexpected end of input. Exiting');
        exit(1);
    }
    else if (token.tokenType != TokenTypes.INT_KEYWORD.name) {
        // int return type not found
        console.log('Error while parsing, expected return type int. Exiting');
        exit(1);
    } else {
        // int return type found, now proceeding ahead
        indexObject.value++;
        token = tokens[indexObject.value];
        if (!token) {
            // Unexpected end of input
            console.log('Unexpected end of input. Exiting');
            exit(1);
        } else if (token.tokenType != TokenTypes.IDENTIFIER.name) {
            // Identifier not found
            console.log('Error while parsing, expected a function name. Exiting');
            exit(1);
        } else {
            // Identifier found, proceeding ahead
            functionName = token.value;
            indexObject.value++;
            token = tokens[indexObject.value];
            if (!token) {
                // Unexpected end of input
                console.log('Unexpected end of input. Exiting');
                exit(1);
            } else if (token.tokenType != TokenTypes.OPEN_PARENTHESES.name) {
                // Open parentheses not found
                console.log('Error while parsing, expected an opening parentheses (. Exiting');
                exit(1);
            } else {
                // Opening parentheses found, proceeding ahead
                indexObject.value++;
                token = tokens[indexObject.value];
                if (!token) {
                    // Unexpected end of input
                    console.log('Unexpected end of input. Exiting');
                    exit(1);
                } else if (token.tokenType != TokenTypes.CLOSE_PARENTHESES.name) {
                    // Closing parentheses not found
                    console.log('Error while parsing, expected an closing parentheses ). Exiting');
                    exit(1);
                } else {
                    // Closing parentheses found, proceeding ahead
                    indexObject.value++;
                    token = tokens[indexObject.value];
                    if (!token) {
                        // Unexpected end of input
                        console.log('Unexpected end of input. Exiting');
                        exit(1);
                    } else if (token.tokenType != TokenTypes.OPEN_CURLY_BRACE.name) {
                        // Opening curly brace not found
                        console.log('Error while parsing, expected an opening curly brace {. Exiting');
                        exit(1);
                    } else {
                        // Opening curly brace found, proceeding ahead
                        indexObject.value++;
                        let statement = parseStatement(tokens, indexObject);
                        // parseStatement would increment the current index, so reading ahead
                        token = tokens[indexObject.value];
                        if (!token) {
                            // Unexpected end of input
                            console.log('Unexpected end of input. Exiting');
                            exit(1);
                        } else if (token.tokenType != TokenTypes.CLOSE_CURLY_BRACE.name) {
                            // Closing curly brace not found
                            console.log('Error while parsing, expected an closing curly brace }. Exiting');
                            exit(1);
                        } else {
                            let functionDeclaration = new Node(TokenTypes.FUNCTION_DECLARATION.name, functionName, [statement]);
                            return functionDeclaration;
                        }
                    }
                }
            }
        }
    }
}

function parseProgram(tokens, indexObject) {
    if (!tokens || !tokens.length) {
        console.log('Unexpected end of input. Exiting');
        exit(1);
    } else {
        let functionDeclaration = parseFunction(tokens, indexObject);
        let program = new Node(TokenTypes.PROGRAM.name, 'root', [functionDeclaration]);
        return program;
    }
}

module.exports.parseProgram = parseProgram;