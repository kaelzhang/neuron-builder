'use strict'

const test = require('ava')
const get_result = require('./fixtures/unwrap')

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
