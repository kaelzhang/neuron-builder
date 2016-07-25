'use strict'

// A very simple wrapper of estraverse

const estraverse = require('estraverse')

module.exports = {
  replace (ast, visitor) {
    visitor.keys = {
      // estraverse have no NumericLiteral or NumericLiteral
      NumericLiteral: [],
      StringLiteral: [],
      BooleanLiteral: [],
      NullLiteral: [],
      RegExpLiteral: [],

      File: ['program'],
      FunctionExpression: ['id', 'params', 'body', 'directives']
    }

    estraverse.replace(ast, visitor)
  }
}
