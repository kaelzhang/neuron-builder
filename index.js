'use strict'

module.exports = bundler

// ## Usage
// ```js
// builder(options)
// .on('warn', function () {
// })
// .parse(filename, callback)
// ```
function bundler(entry, options, callback) {
  make_sure(options, 'pkg')
  make_sure(options, 'cwd')

  if (Object(options.babel) !== options.babel && options.babel !== false) {
    options.babel = {}
  }

  options.babel = mix({
    presets: ['es2015']
  }, options.babel, false)

  return new Builder(options).parse(entry, callback)
}


function make_sure (options, key) {
  if (key in options) {
    return
  }

  throw new Error('`options.' + key + '` must be defined')
}


builder.Builder = Builder


// for (id in nodes) {
    //   node = nodes[id]



    //   try {
    //     node.resolved =
    //   } catch (e) {
    //     let message = e.code == 'ENOTINSTALLED'
    //       ? 'Explicit version of dependency <%= deps.map(function(dep){return dep}).join(", ") %> <%= deps.length > 1 ? "are" : "is" %> not defined.\n file: <%= file %>'
    //       errmsg =
    //     } else if (e.code == 'EOUTENTRY') {
    //       errmsg = 'Relative dependency "<%= deps[0] %>" out of main entry\'s directory. file: <%= file %>'
    //     } else {
    //       errmsg = e.message
    //     }

    //     e.file = id
    //     return callback(new Error(_.template(errmsg)(e)))
    //   }
    // }