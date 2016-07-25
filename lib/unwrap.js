'use strict'

module.exports = unwrap


const {
  SourceMapConsumer,
  SourceNode
} = require('source-map')

const babylon = require('babylon')
const { replace } = require('./traverse')
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


function unwrapAst (ast, prefix, suffix) {
  let fake_code = `${prefix}\nlet ${LONG_AND_WEIRED_STRING}\n${suffix}`
  let fake_ast = babylon.parse(fake_code, {
    sourceType: 'module'
  })

  replace(fake_ast, {
    enter: function (node, parent) {
      let declare_node
      let decorator_node

      // removes the loc info of fake ast
      if (node.loc) {
        node.loc = null
      }


      // replace the
      if (
        node.type === 'BlockStatement'
        && access(node, [
          'body', 0,
          'declarations', 0,
          'id',
          'name'
        ]) === LONG_AND_WEIRED_STRING
      ) {
        node.body = ast.program.body
        node.loc = ast.program.loc
        this.skip()
      }

      return node
    }
  })

  return fake_ast
}
