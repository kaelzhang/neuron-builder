'use strict'

const walker = require('module-walker')
const { EventEmitter } = require('events')

module.exports = class Parser extends EventEmitter {
  constructor (filename, compilers, callback) {
    super()

    walker({
      allowCyclic: true,
      checkRequireLength: true,
      allowAbsoluteDependency: false,
      extensions: ['.js', '.json'],
      requireResolve: true,
      requireAsync: true,
      commentRequire: true,
      allowNonLiteralRequire: false,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      sourceType: 'module'
    })
    .on('warn', message => {
      this.emit('warn', message)
    })
    .register(compilers)
    .walk(filename)
    .then(nodes => {
      this.nodes = nodes
      callback(null)
    }, callback)
  }
}
