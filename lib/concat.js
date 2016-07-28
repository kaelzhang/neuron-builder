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
function concat (files, filename) {

  let {
    node,
    ast

  } = files.reduce((
    prev, {
      filename,
      ast,
      code,
      map,
      origin
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

    node.setSourceContent(filename, origin || code)

    if (!prev) {
      return {
        node,
        ast
      }
    }

    prev.node
      .add(CR_X2)
      .add(node)

    add_ast(prev.ast, ast)

    return prev

  }, null)

  let {
    map,
    code
  } = node.toStringWithSourceMap({
    file: filename
  })

  map = map.toJSON()

  return {
    filename,
    code,
    ast,
    map
  }
}


function add_ast (parent, ast) {
  parent.program.body.push(...ast.program.body)
}
