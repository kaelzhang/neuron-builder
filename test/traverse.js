'use strict'

const test = require('ava')
const {
  traverse
} = require('../lib/traverse')

const babylon = require('babylon')

test('traverse an es6 ast will not fail', t => {
  let ast = babylon.parse(`
;(function(){
  "use strict"
})()
    `, {
      sourceType: 'module'
    })

  try {
    traverse(ast, {
      enter: function (node, parent) {
        node.loc = null
      }
    })
  } catch (e) {
    t.fail()
    return
  }

  t.is(ast.loc, null)
})
