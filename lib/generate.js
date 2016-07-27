'use strict'

const stringify = require('code-stringify')
const unique = require('make-unique')


module.exports = class Generator {
  constructor (nodes, {cwd, pkg}) {
    this.nodes = nodes
    this.cwd = cwd
    this.pkg = pkg

    this.guid = 0
    this.locals = {}
    this.map = {}

    this._analyze()
    this._determine_global_map()
  }

  generate () {
    let options = this.options

    this._wrap_all(this.nodes)
  }

  _wrap_all (nodes, callback) {
    let modules = []
    Object.keys(nodes).forEach(id => {
      let node = nodes[id]

      if (
        // Only wrap modules that have been `require()`d
        !~node.type.indexOf('require')
        // do not build foreign packages
        // TODO: option to bundle foreign packages
        || node.foreign
      ) {
        return
      }

      let mod = this._wrap(node)
      modules.push(mod)
    })

    let global_prefix = this._get_global_prefix()
    let global_suffix = this._get_global_suffix()

    console.log(global_prefix)
    console.log(global_suffix)
  }

  // // Wrap a commonjs module with wrappings so that it could run in browsers
  _wrap (node) {
    // let options = this._get_module_options(node)
    let prefix = this._get_module_prefix(node)
    let suffix = this._get_module_suffix(node)

    console.log(prefix, node.code, suffix)
    // // id
    // var module_id = this._generate_module_id(filename)

    // // dependencies
    // var resolved_dependencies = _.keys(mod.require).map(function (dep) {
    //   return mod.resolved[dep] || dep
    // })

    // // options
    // var module_options = this._generate_module_options(filename, mod)

    // var pairs = []
    // if (module_options.main) {
    //   pairs.push('main: true')
    // }

    // var different
    // var map
    // if (module_options.map) {
    //   different = get_difference(module_options.map, this.global_map)
    //   map = _.keys(different).length
    //     ? 'neuron.mix(' + this._stringify(different) + ', global_map)'
    //     : 'global_map'

    //   pairs.push('map: ' + map)
    // }

    // module_options = pairs.length
    //   ? '{\n'
    //     + '  ' + pairs.join(',\n  ')
    //     + '\n}'
    //   : ''

    // var result = _.template(WRAPPING_TEMPLATE)({
    //   id: this._stringify(module_id),
    //   deps: this._stringify(resolved_dependencies),
    //   code: mod.json
    //     ? 'module.exports = ' + mod.code
    //     : mod.code,
    //   module_options: module_options
    // })

    // callback(null, result)
  }

  // Analyze and collect all dependencies
  _analyze () {
    Object.keys(this.nodes).forEach((id) => {
      this._analyze_one(this.nodes[id])
    })
  }

  _analyze_one (node) {
    // Skip analyze foreign node
    if (node.foreign) {
      return
    }

    this._add_local(node.id)

    let deps = []
    Object.keys(node.resolved).forEach(require_name => {
      // resolved dependency id
      let dep_id = node.resolved[require_name]

      this._add_local(dep_id)
      this._add_global_map(require_name, dep_id)

      if (require_name in node.require) {
        deps.push(dep_id)
      }
    })

    // Dependencies for neuron wrapping
    node.dependencies = unique(deps)
  }

  // Updates the global counting map
  _add_global_map (require_name, module_id) {
    let map = this.map[module_id] || (
      this.map[module_id] = {}
    )

    map[require_name] = (map[require_name] || 0) + 1
  }

  _determine_global_map () {
    let map = {}
    Object.keys(this.map).forEach((module_id) => {
      let sub = this.map[module_id]
      let max = 0
      let determined
      Object.keys(sub).forEach((require_name) => {
        let count = sub[require_name]

        if (count > max) {
          max = count
          determined = require_name
        }
      })

      map[determined] = module_id
    })

    // set the real global map
    this.map = map
  }

  _add_local (module_id) {
    if (this.locals[module_id]) {
      return
    }

    let guid = this.guid ++
    this.locals[module_id] = `_${guid}`
  }

  // Returns `Object`
  // - main: `Boolean`
  // - map: `Object`
  _get_module_options (node) {
    let pkg = this.pkg
    let cwd = this.cwd
    let module_options = {}

    if (
      pkg.main &&
      node_path.resolve(id) === node_path.resolve(cwd, pkg.main)
    ) {
      module_options.main = true
    }

    if (Object.keys(node.resolved).length) {
      let map = get_difference(node.resolved, this.map)
      let map_string = Object.keys(map).length
        ? `mix(${map_string}, global_map)`
        : 'global_map'
      module_options.map = new stringify.Code(map_string)
    }

    if (!Object.keys(module_options).length) {
      return
    }

    return module_options
  }

  // global variables for multiple modules
  _get_global_prefix () {
    let locals = this.locals

    let statements = []

    let declare_varible = (name, code) => {
      statements.push(`var ${name} = ${code}`)
    }

    Object.keys(locals).forEach(function(v) {
      declare_varible(locals[v], stringify(v))
    })

    declare_varible('global_map', stringify(this.map, (k, v) => {
      return k === ''
        ? v
        : new stringify.Code(this.locals[v])
    }))

    let variables = statements.join('\n')

    return `
;(function () {
function mix (receiver, supplier) {
  for (var key in supplier) {
    if (!(key in receiver)) {
      receiver[key] = supplier[key]
    }
  }
}
${variables}
`
  }

  _get_global_suffix () {
    return `
})()
`
  }

  _get_module_prefix (node) {
    let id_code = this.locals[node.id]
    let dependencies_code = stringify(node.dependencies, (i, v) => {
      return typeof i === 'number'
        ? new stringify.Code(this.locals[v])
        : v
    })
    return `
define(${id_code}, ${dependencies_code}, function(require, exports, module, __filename, __dirname) {
`
  }

  _get_module_suffix (node) {
    let options = this._get_module_options(node)
    let options_code = options
      ? ', ' + stringify(options)
      : ''

    return `
}${options_code})
`
  }
}



function get_difference (object, relative) {
  let parsed = {}
  let key
  for (key in object) {
    if (relative[key] !== object[key]) {
      parsed[key] = object[key]
    }
  }

  return parsed
}
