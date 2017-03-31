/**
 * Define task to compile css files
 * @function define
 * @param {string} srcDir - Source directory name
 * @param {string} destDir - Destination directory name
 * @param {Object} [options={}] - Optional settings
 * @param {string|string[]} [options.pattern=['*.css','*.pcss']] - File name pattern
 * @param {function[]} [options.plugins=[cssnext]] - PostCSS plugins
 * @param {number} [options.watchDelay=100] - Delay after watch
 * @returns {function} Defined task
 */
'use strict'

const aglob = require('aglob')
const co = require('co')
const asleep = require('asleep')
const path = require('path')
const postcss = require('postcss')
const cssnext = require('postcss-cssnext')
const compile = require('pon-task-compile')
const watch = require('pon-task-watch')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = [ '*.css', '*.pcss' ],
    plugins = [ cssnext ],
    watchDelay = 100
  } = options

  const processor = postcss(plugins)

  const compiler = (code, inputSourceMap = null, options = {}) => co(function * () {
    let { src, dest, cwd = process.cwd() } = options
    let { css, map } = yield processor.process(code, {
      from: path.relative(cwd, src),
      to: path.relative(cwd, dest),
      map: { inline: false }
    })
    return [ css, map ]
  })

  const resolvePaths = (filename) => ({
    src: path.resolve(srcDir, filename),
    dest: path.resolve(destDir, filename.replace(/\.pcss$/, '.css'))
  })

  function task (ctx) {
    return co(function * () {
      let filenames = yield aglob(pattern, { cwd: srcDir })
      let results = []
      for (let filename of filenames) {
        const { src, dest } = resolvePaths(filename)
        let result = yield compile(src, dest, compiler)(ctx)
        results.push(result)
      }
      return results
    })
  }

  return Object.assign(task,
    // Define sub tasks here
    {
      watch: (ctx) => co(function * () {
        return watch(
          [].concat(pattern).map((pattern) => path.join(srcDir, pattern)),
          (event, filename) => {
            const { src, dest } = resolvePaths(filename)
            compile(src, dest, compiler)(ctx)
          },
          {
            delay: watchDelay
          }
        )(ctx)
      })
    }
  )
}

module.exports = define


