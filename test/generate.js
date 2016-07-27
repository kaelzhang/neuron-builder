'use strict'

const fixture = require('./fixtures/nodes')

const Cleaner = require('../lib/cleaner')
const Generator = require('../lib/generate')
const test = require('ava')

test('abc', t => {
  let {
    cwd,
    pkg,
    nodes
  } = fixture()

  nodes = new Cleaner({
    cwd,
    pkg
  }).clean(nodes)

  let genarator = new Generator(nodes, {cwd, pkg})
  genarator.generate()
})

