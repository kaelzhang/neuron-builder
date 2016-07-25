'use strict'

const test = require('ava')
const unwrap = require('../lib/unwrap')
const babylon = require('babylon')
const babel = require('babel-core')

const PREFIX = `
(function({a}){
a += 1
`

const SUFFIX = `
})({a: 1})
`

const CODE = `
let {b} = {b: 2}
a += b
return a
`

const FILENAME = 'a.js'

function get_result () {
  let filename = FILENAME

  let ast = babylon.parse(CODE, {
    allowReturnOutsideFunction: true,
    sourceType: 'module'
  })

  let result = babel.transformFromAst(ast, CODE, {
    filename,
    sourceMaps: true,
    presets: [
      'es2015'
    ]
  });

  ast = result.ast
  let map = result.map
  let code = result.code

  return unwrap({
    filename,
    ast,
    map,
    code
  }, PREFIX, SUFFIX)
}

test('should unwrap code', t => {
  let {
    filename,
    ast,
    map,
    code
  } = get_result()

  t.is(filename, 'a.js')
  t.is(code, `
(function({a}){
a += 1

"use strict";

var _b = { b: 2 };
var b = _b.b;

a += b;
return a;

})({a: 1})
`)
})

