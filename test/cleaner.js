'use strict'

const test = require('ava')
const Cleaner = require('../lib/cleaner')
const clone = require('clone')

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

function get_clone () {
  return {
    cwd: CWD,
    pkg: clone(PKG),
    nodes: clone(NODES)
  }
}


test('should clean nodes', t => {
  let {
    cwd,
    pkg,
    nodes
  } = get_clone()

  let cleaner = new Cleaner({
    cwd,
    pkg
  })

  nodes = cleaner.clean(nodes)
  let a = nodes['/path/to/a.js']

  t.is(a.id, 'a@1.0.0/a.js')
  t.is(a.resolved['./b'], 'a@1.0.0/b.json')
})


test('should throw error if no dependencies found in pkg', t => {
  let {
    cwd,
    pkg,
    nodes
  } = get_clone()

  delete pkg.dependencies

  try {
    new Cleaner({
      cwd,
      pkg
    }).clean(nodes)
  } catch (e) {
    t.is(e.code, 'NOT_INSTALLED')
    t.is(e.dependency, 'b')
    t.is(e.filename, '/path/to/a.js')
    return
  }

  t.fail()
})


test('should not throw error if no dependencies found in pkg, but allowImplicitDependency is true', t => {
  let {
    cwd,
    pkg,
    nodes
  } = get_clone()

  delete pkg.dependencies

  try {
    nodes = new Cleaner({
      cwd,
      pkg,
      allowImplicitDependency: true
    }).clean(nodes)
  } catch (e) {
    t.fail()
  }

  t.is(nodes['/path/to/a.js'].resolved.b, 'b@*')
})


test('should throw if require a module out of package', t => {
  let {
    cwd,
    pkg,
    nodes
  } = get_clone()

  let b = '/path/b.json'

  nodes['/path/to/a.js'].require['../b'] = b
  nodes[b] = {
    id: b
  }

  try {
    new Cleaner({
      cwd,
      pkg
    }).clean(nodes)
  } catch (e) {
    t.is(e.code, 'OUT_OF_PACKAGE')
    t.is(e.dependency, '../b')
    t.is(e.filename, '/path/to/a.js')
    return
  }

  t.fail()
})

