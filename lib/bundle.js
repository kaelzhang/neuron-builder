'use strict'

const fs = require('fs')
const node_path = require('path')
const util = require('util')li
const async = require('async')
const _ = require('underscore')
const { EventEmitter } = require('events')
const walker = require('module-walker')
const make_array = require('make-array')
const mix = require('mix2')
const babel = require('babel-core')


module.exports = class Bundler extends EventEmitter {
  constructor (options) {
    super()
    this.uuid = 0
    this.options = options
    this.cwd = node_path.resolve(options.cwd)
    this.pkg = options.pkg
    this.locals = {}
    this.global_map = {}
  }

  // Collect all modules which should be bundled into one file
  // @param {function(err, codes)} callback
  // - codes `Object` the `{<path>: <parsed-module>}` map
  _collect_modules () {
    Object.keys(this.nodes).forEach((id) => {
      let node = this.nodes[node]
      this._resolve_module_dependencies(node)
    })
  }

  // @param {String} id Path(file entry) or package name(foreign package)
  _resolve_module_dependencies (node) {
    if (node.foreign) {
      continue
    }

    let pkg = this.pkg
    let cwd = this.cwd
    node.resolved = {}

    ;['require', 'resolve', 'async'].forEach(type => {
      this._resolve_dependencies(node, type)
    })
  }

  // @param {*Object} resolved
  _resolve_dependencies (node, type) {
    let not_installed = []
    let deps = node[type]

    Object.keys(deps).forEach((module_name) => {
      // dep is either
      // - absolute path of a module
      // - foreign package name
      let dep = this._get_node(module_name)
      if (!dep) {
        return
      }

      let package_name

      if (dep.foreign) {
        package_name = this._apply_dependency_version(real)
        if (!package_name) {
          not_installed.push(real)
        }

      } else {
        if (this._out_of_dir(module_name, node.id)) {
          throw {
            code: 'EOUTENTRY',
            deps: [module_name]
          }
        }
        package_name = this._generate_module_id(real)
      }

      node.resolved[module_name] = package_name
      this._add_to_global_map(module_name, package_name)
      this._add_locals(package_name)
    })

    if (not_installed.length) {
      throw {
        code: 'ENOTINSTALLED',
        deps: not_installed
      }
    }
  }

  // filename: '/path/to/a.js'
  // cwd: '/path'
  // -> 'module@0.0.1/to/a.js'
  _generate_module_id (filename, relative) {
    // the exact identifier
    let cwd = this.cwd
    let pkg = this.pkg
    var main_id = `${pkg.name}@${pkg.version}`

    let relative_path = relative
      ? filename
      : node_path.relative(cwd, filename)

    // -> 'module@0.0.1/folder/foo'
    let id = node_path.join(main_id, relative_path)

    // fixes windows paths
    id = id
      .replace(new RegExp('\\' + node_path.sep, 'g'), '/')
      .toLowerCase()

    this._add_locals(id)
    return id
  }

  // id             -> module_id
  // require('./a') -> module@1.0.0/lib/a.js
  // Save the count of usage of `id`
  _add_to_global_map (id, module_id) {
    let count_map = this.global_map[module_id] || (
      this.global_map[module_id] = {}
    )

    if (id in count_map) {
      count_map[id] ++
      return
    }

    count_map[id] = 1
  }

  // 'zepto' -> 'zepto@^1.9.0'
  _apply_dependency_version (module_name) {
    let pkg = this.pkg
    let id

    ;[
      'dependencies',
      'asyncDependencies',
      'devDependencies'
    ].some(function (key) {
      let dependencies = pkg[key]
      if (!dependencies) {
        return
      }

      if (module_name in dependencies) {
        id = module_name + '@' + dependencies[module_name]
        return true
      }
    })

    return id
      ? id
      // If allow implicit dependencies
      : this.options.allowImplicitDependencies
        ? module_name + '@*'
        : id
  }

  //
  _get_node (name) {
    return this.nodes[name]
  }

  // {
  //   '/path/to/a.js': '_0',
  //   '/path/to/b.js': '_1'
  // }
  _add_locals (val) {
    let locals = this.locals
    let i = this.uuid ++

    if (!locals[val]) {
      locals[val] = `_${i}`
    }
  }
}
