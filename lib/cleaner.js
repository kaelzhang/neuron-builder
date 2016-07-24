'use strict'

const node_path = require('path')

module.exports = class Cleaner {
  constructor (options) {
    super()
    this.nodes = options.nodes
    this.cwd = node_path.resolve(options.cwd)
    this.pkg = options.pkg
    this.allowImplicitDependency = options.allowImplicitDependency
  }

  // Collect all modules which should be bundled into one file
  // @param {function(err, codes)} callback
  // - codes `Object` the `{<path>: <parsed-module>}` map
  _collect_modules () {
    Object.keys(this.nodes).forEach((id) => {
      let node = this.nodes[node]
      node.resolved = {}
      this._resolve_module_dependencies(node)
    })
  }

  // @param {String} id Path(file entry) or package name(foreign package)
  _resolve_module_dependencies (node) {
    if (node.foreign) {
      return
    }

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

    relative_path = make_posix(relative_path)

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
