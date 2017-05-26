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

const co = require('co')
const path = require('path')
const { cachedRequire } = require('pon-cache')
const { byPattern } = require('pon-task-compile')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = [ '*.css', '*.pcss' ],
    watchDelay = 100
  } = options

  const compiler = (code, inputSourceMap = null, options = {}) => co(function * () {
    const postcss = cachedRequire('postcss') // Require here to reduce initial loading time
    const { plugins = [ cachedRequire('postcss-cssnext') ] } = options

    const processor = postcss(plugins)

    let { src, dest, cwd = process.cwd() } = options
    let { css, map } = yield processor.process(code, {
      from: path.relative(cwd, src),
      to: path.relative(cwd, dest),
      map: { inline: false }
    })
    return [ css, map ]
  })

  let task = byPattern(srcDir, destDir, compiler, {
    pattern,
    watchDelay,
    namer: (filename) => filename.replace(/\.pcss$/, '.css')
  })

  let { watch } = task

  return Object.assign(function css (ctx) {
    return task(ctx)
  }, { watch })
}

module.exports = define


