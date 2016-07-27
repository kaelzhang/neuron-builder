'use strict'

module.exports = concat

const {
  SourceMapConsumer,
  SourceNode
} = require('source-map')

const CR_X2 = '\n\n'

// @param {Array} files
// - filename
// - ast
// - code
// - map
function concat (files, prefix, suffix) {
  let result = files.reduce((
    prev, {
      filename,
      ast,
      code,
      map
    }
  ) => {
    let node

    if (map) {
      let consumer = new SourceMapConsumer(map)
      node = SourceNode.fromStringWithSourceMap(code, consumer)

    // if no source map, create one from code
    } else {
      node = new SourceNode(1, 0, filename, code)
    }

    if (!prev) {
      return {
        node,
        ast,
        code
      }
    }

    prev.node
      .add(CR_X2)
      .add(node)

    add_ast(prev.ast, ast)
    prev.code += `${CR_X2}${code}`

    return prev

  }, null)

  console.log(result)
}


function add_ast (parent, ast) {
  parent.program.body.push(...ast.program.body)
}
