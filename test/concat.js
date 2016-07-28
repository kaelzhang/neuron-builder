'use strict'

const get_cleaned = require('./fixtures/nodes').cleaned
const concat = require('../lib/concat')
const test = require('ava')

test.only('concat', t => {
  let { nodes } = get_cleaned()

  nodes = Object.keys(nodes).map((key) => {
    let node = nodes[key]

    if (node.foreign) {
      return
    }

    return nodes[key]
  })
  .filter(Boolean)

  let {
    code,
    map
  } = concat(nodes, 'a.js')

  const fs = require('fs')
  const node_path = require('path')

  let dest = node_path.join(__dirname, 'demo/a.js')
  fs.writeFileSync(dest, code + '\n\n//# sourceMappingURL=a.js.map')
  fs.writeFileSync(dest + '.map', JSON.stringify(map))
})
