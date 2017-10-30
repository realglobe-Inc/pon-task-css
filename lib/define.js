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

const path = require('path')
const {cachedRequire} = require('pon-cache')
const {byPattern} = require('pon-task-compile')
const minify = require('./minify')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = ['*.css', '*.pcss'],
    watchDelay = 100
  } = options

  const compiler = async (code, inputSourceMap = null, options = {}) => {
    const postcss = cachedRequire('postcss') // Require here to reduce initial loading time
    const {plugins = [cachedRequire('postcss-cssnext')]} = options

    const processor = postcss(plugins)

    const {src, dest, cwd = process.cwd()} = options
    const {css, map} = await processor.process(code, {
      from: path.relative(cwd, src),
      to: path.relative(cwd, dest),
      map: {inline: false}
    })
    return [css, map]
  }

  const task = byPattern(srcDir, destDir, compiler, {
    pattern,
    watchDelay,
    namer: (filename) => filename.replace(/\.pcss$/, '.css')
  })

  const {watch} = task

  return Object.assign(function css (ctx) {
    return task(ctx)
  }, {watch})
}

Object.assign(define, {minify})

module.exports = define


