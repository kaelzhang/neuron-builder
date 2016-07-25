'use strict'

const node_path = require('path')

module.exports = class Cleaner {
  constructor (options) {
    this.cwd = node_path.resolve(options.cwd)
    // TODO: pkg should read from dynamically
    this.pkg = options.pkg
    this.allowImplicitDependency = options.allowImplicitDependency
  }

  // id -> neuron module id
  // filename -> absolute path
  clean (nodes) {
    this.nodes = nodes
    this._clean()
    return nodes
  }

  // Collect all modules which should be bundled into one file
  // @param {function(err, codes)} callback
  // - codes `Object` the `{<path>: <parsed-module>}` map
  _clean () {
    Object.keys(this.nodes).forEach((id) => {
      let node = this.nodes[id]
      this._clean_one(node)
    })
  }

  // @param {String} id Path(file entry) or package name(foreign package)
  _clean_one (node) {
    if (node.foreign || node.resolved) {
      return node
    }

    node.resolved = {}
    this._resolve_module_id(node)

    ;['require', 'resolve', 'async'].forEach(type => {
      this._resolve_dependencies(node, type)
    })

    return node
  }

  _resolve_module_id (node) {
    let id = this._generate_module_id(node.id)
    node.filename = node.id
    node.id = id
  }

  // @param {*Object} resolved
  _resolve_dependencies (node, type) {
    let deps = node[type] || {}

    Object.keys(deps).forEach((module_name) => {
      let real = deps[module_name]

      // dep is either
      // - absolute path of a module
      // - foreign package name
      let dep = this._get_node(real)
      if (!dep) {
        return
      }

      if (dep.foreign) {
        let package_name = this._apply_dependency_version(real)
        if (!package_name) {
          throw {
            code: 'NOT_INSTALLED',
            dependency: module_name,
            filename: node.filename
          }
        }

        node.resolved[module_name] = package_name
        return

      }

      let cleaned_dep = this._clean_one(dep)
      if (!cleaned_dep.id) {
        throw {
          code: 'OUT_OF_PACKAGE',
          dependency: module_name,
          filename: node.filename
        }
      }

      node.resolved[module_name] = cleaned_dep.id
    })
  }

  // filename: '/path/to/a.js'
  // cwd: '/path'
  // -> 'module@0.0.1/to/a.js'
  _generate_module_id (filename) {
    // the exact identifier
    let relative_path = node_path.relative(this.cwd, filename)

    if (relative_path.indexOf('..') === 0) {
      return
    }

    relative_path = make_posix(relative_path)

    let main_id = `${this.pkg.name}@${this.pkg.version}`

    // -> 'module@0.0.1/folder/foo'
    return node_path.join(main_id, relative_path)
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
      : this.options.allowImplicitDependency
        ? module_name + '@*'
        : id
  }

  _get_node (name) {
    return this.nodes[name]
  }
}


let make_posix = process.platform === 'win32'
  ? str => /^\\\\\?\\/.test(str)
    || /[^\x00-\x80]+/.test(str)
      ? str
      : str.replace(/\\/g, '/')
  : str => str
