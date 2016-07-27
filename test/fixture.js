'use strict'

const clone = require('clone')

const NODES = {
  '/path/to/a.js': {
    id: '/path/to/a.js',
    require: {
      './b': '/path/to/b.json',
      'b': 'b'
    },
    type: ['require'],
    js: true
  },

  '/path/to/b.json': {
    id: '/path/to/b.json',
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
