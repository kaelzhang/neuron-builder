'use strict'

module.exports = unwrap


const {
  SourceMapConsumer,
  SourceNode
} = require('source-map')

const babylon = require('babylon')
const { traverse } = require('./traverse')
const access = require('object-access')

const LONG_AND_WEIRED_STRING = 'NEURON_MODULE_BUNDLER_FAKE_PLACEHOLDER_$'


function unwrap ({
  filename,
  ast,
  code,
  map
}, prefix, suffix) {

  ast = unwrapAst(ast, prefix, suffix)

  let consumer = new SourceMapConsumer(map)
  let node = SourceNode.fromStringWithSourceMap(code, consumer)
  node.prepend(`${prefix}\n`)
  node.add(`\n${suffix}`)

  let result = node.toStringWithSourceMap({file: filename})
  code = result.code
  map = JSON.parse(result.map)

  return {
    filename,
    ast,
    code,
    map
  }
}


// Based on the situation that neuron wrappings are always functions
// with no statements within the bodies
// or statements at the beginning of function bodies
function unwrapAst (ast, prefix, suffix) {
  let fake_code = `${prefix}\nlet ${LONG_AND_WEIRED_STRING}\n${suffix}`
  let fake_ast = babylon.parse(fake_code, {
    sourceType: 'module'
  })

  let selected_node
  let selected_index
  traverse(fake_ast, {
    enter: function (node, parent) {
      // removes the loc info of fake ast
      if (node.loc) {
        node.loc = null
      }

      if (node.type !== 'BlockStatement') {
        return
      }

      // find the index of LONG_AND_WEIRED_STRING
      let index = node.body.findIndex(n => {
        if (node.type !== 'VariableDeclaration') {
          return
        }

        if (
          access(n, [
            'declarations', 0,
            'id',
            'name'
          ]) === LONG_AND_WEIRED_STRING
        ) {
          return true
        }
      })

      if (!~index) {
        return
      }

      selected_node = node
      selected_index = index
    }
  })

  if (selected_node) {
    selected_node.body.splice(selected_index, 1)
    selected_node.body.push(...ast.program.body)
  }


  return fake_ast
}
