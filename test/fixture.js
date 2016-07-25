const NODES = {
  '/path/to/a.js': {
    id: '/path/to/a.js',
    require: {
      './b': '/path/to/b.json',
      'b': 'b'
    },
    js: true
  },

  '/path/to/b.json': {
    id: '/path/to/b.json',
    json: true
  },

  'b': {
    id: 'b',
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


module.exports = {
  NODES,
  PKG,
  CWD
}
