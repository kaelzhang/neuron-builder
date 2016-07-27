'use strict'

const clone = require('clone')
const babylon = require('babylon')

const {
  SourceNode
} = require('source-map')

const CODE_A = `require('./b')
require('b')
`

const FILE_B = '/path/to/b.json'

const CODE_B = `{
  "a": 1,
  "b": []
}
`

const code_b_modularized = (function(){
  let node = new SourceNode(1, 0, FILE_B, CODE_B)
  node.prepend('module.exports = ')
  return node.toStringWithSourceMap({
    file: FILE_B
  })
})()


const NODES = {
  '/path/to/a.js': {
    id: '/path/to/a.js',
    code: CODE_A,
    ast: babylon.parse(CODE_A),
    require: {
      './b': '/path/to/b.json',
      'b': 'b'
    },
    type: ['require'],
    js: true
  },

  '/path/to/b.json': {
    id: FILE_B,
    code: code_b_modularized.code,
    ast: babylon.parse(code_b_modularized.code),
    map: code_b_modularized.map,
    type: ['require'],
    json: true
  },

  'b': {
    id: 'b',
    type: ['require'],
    foreign: true
  }
}

const PKG = {
  name: 'a',
  version: '1.0.0',
  dependencies: {
    b: '^1.0.0'
  }
}


const CWD = '/path/to'


module.exports = () => {
  return {
    cwd: CWD,
    pkg: clone(PKG),
    nodes: clone(NODES)
  }
}
