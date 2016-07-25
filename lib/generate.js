'use strict'

const code_stringify = require('code-stringify')
const unique = require('make-unique')


module.exports = class Generator {
  constructor (nodes, options) {
    super()

    this.nodes = nodes
    this.cwd = options.cwd
    this.pkg = options.pkg

    this.guid = 0
    this.locals = []
    this.map = {}

    this._analyze()
    this._determine_global_map()
  }

  generate (filename, callback) {
    let options = this.options

    this._wrap_all(this.nodes, (err, code) => {
      if (err) {
        return callback(err)
      }

      if (options.babel) {
        options.babel.filename = filename

        try {
          code = babel.transform(code, options.babel).code
        } catch(e) {
          return callback(e)
        }
      }

      callback(null, this._combile_statements(code))
    })
  }

  _analyze () {
    Object.keys(this.nodes).forEach((node) => {
      this._analyze_one(node)
    })
  }

  _analyze_one (node) {
    // skip analyze foreign node
    if (node.foreign) {
      return
    }

    let deps = []

    Object.keys(node.resolved).forEach(require_name => {
      let dep_id = node.resolved[require_name]

      this._add_global_map(require_name, dep_id)

      if (require_name in node.require) {
        deps.push(dep_id)
      }
    })

    // dependencies for neuron wrapping
    node.dependencies = unique(deps)
  }

  // updates the global counting map
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

      map[require_name] = module_id
    })

    // set the real global map
    this.map = map
  }

  _add_local (module_id) {
    this.locals.push(module_id)
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

    let map = get_difference(node.resolved, this._add_global_map)

    if (Object.keys(map).length) {
      module_options.map = map
    }

    if (Object.keys(module_options)) {
      return
    }

    return module_options
  }

  // global variables for multiple modules
  _get_global_prefix () {
    let locals = this.locals

    let statements = []

    let declare_varible = (name, value) => {
      let code = this._stringify(value)
      statements.push(`const ${name} = ${code}`)
    }

    Object.keys(locals).forEach(function(v) {
      declare_varible(locals[v], v)
    })

    declare_varible('global_map', this._stringify(this.global_map))

    let variables = statements.join('\n')

    return `
;(function () {
${variables}
`
  }

  _get_global_suffix () {
    return `
})()
`
  }

  _get_module_prefix (node) {
    let dependencies_code = code_stringify(node.dependencies)
    return `
define(${node.id}, ${dependencies_code}, function(require, exports, module, __filename, __dirname) {
`
  }

  _get_module_suffix (node) {
    let options = this._get_module_options()
    let options_code = options
      ? ', ' + code_stringify(options)
      : ''

    return `
}${options_code})
`
  }

}



function get_difference (object, relative) {
  var parsed = {}
  var key
  for (key in object) {
    if (relative[key] !== object[key]) {
      parsed[key] = object[key]
    }
  }
  return parsed
}



_wrap_all (codes, callback) {
  var self = this
  var tasks = _.keys(codes).map(function (id) {
    return function (done) {
      self._wrap(id, codes[id], done)
    }
  })

  async.parallel(tasks, function (err, content_array) {
    if (err) {
      return callback(err)
    }

    callback(null, content_array.filter(Boolean).join('\n\n'))
  })
}


const WRAPPING_TEMPLATE =
    ''

// Wrap a commonjs module with wrappings so that it could run in browsers
_wrap (filename, mod, callback) {
  // Only wrap modules that have been `require()`d
  if (
    !~mod.type.indexOf('require')

    // do not build foreign packages
    // TODO: option to bundle foreign packages
    || mod.foreign
  ) {
    return callback(null)
  }

  // id
  var module_id = this._generate_module_id(filename)

  // dependencies
  var resolved_dependencies = _.keys(mod.require).map(function (dep) {
    return mod.resolved[dep] || dep
  })

  // options
  var module_options = this._generate_module_options(filename, mod)

  var pairs = []
  if (module_options.main) {
    pairs.push('main: true')
  }

  var different
  var map
  if (module_options.map) {
    different = get_difference(module_options.map, this.global_map)
    map = _.keys(different).length
      ? 'neuron.mix(' + this._stringify(different) + ', global_map)'
      : 'global_map'

    pairs.push('map: ' + map)
  }

  module_options = pairs.length
    ? '{\n'
      + '  ' + pairs.join(',\n  ')
      + '\n}'
    : ''

  var result = _.template(WRAPPING_TEMPLATE)({
    id: this._stringify(module_id),
    deps: this._stringify(resolved_dependencies),
    code: mod.json
      ? 'module.exports = ' + mod.code
      : mod.code,
    module_options: module_options
  })

  callback(null, result)
}