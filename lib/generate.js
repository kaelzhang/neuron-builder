_generate_code (filename, callback) {
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

// Returns `Object`
  // - main: `Boolean`
  // - map: `Object`
  _generate_module_options (id, mod) {
    var pkg = this.pkg
    var cwd = this.cwd
    var module_options = {}

    if (
      pkg.main &&
      node_path.resolve(id) === node_path.resolve(cwd, pkg.main)
    ) {
      module_options.main = true
    }

    if (Object.keys(mod.resolved).length) {
      module_options.map = mod.resolved
    }

    return module_options
  }

// global variables for multiple modules
  _generate_code_prefix () {
    let locals = this.locals

    let statements = []

    let declare_varible = (name, value, raw) => {
      let code = this._stringify(value)
      statements.push(`const ${name} = ${code}`)
    }

    Object.keys(locals).forEach(function(v) {
      declare_varible(locals[v], v)
    })

    declare_varible('global_map', this._stringify(this.global_map))

    let variables = statements.join('\n')


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


function get_difference (object, relative) {
  var parsed = {}
  var key
  for(key in object){
    if (relative[key] !== object[key]) {
      parsed[key] = object[key]
    }
  }
  return parsed
}


const WRAPPING_TEMPLATE =
    'define(<%= id %>, <%= deps %>, function(require, exports, module, __filename, __dirname) {\n'
  +   '<%= code %>\n'
  + '}<%= module_options ? ", " + module_options : "" %>)'

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