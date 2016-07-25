'use strict'

// A very simple wrapper of estraverse

const estraverse = require('estraverse')

const KEYS = {
  // estraverse have no NumericLiteral or NumericLiteral
  NumericLiteral: [],
  StringLiteral: [],
  BooleanLiteral: [],
  NullLiteral: [],
  RegExpLiteral: [],

  File: ['program'],
  ObjectProperty: ['key', 'value'],
  FunctionExpression: ['id', 'params', 'body', 'directives']
}

module.exports = {
  traverse (ast, visitor) {
    visitor.keys = KEYS
    estraverse.replace(ast, visitor)
  }
}
