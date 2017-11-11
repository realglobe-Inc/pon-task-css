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
const {writeFileAsync, mkdirpAsync} = require('asfs')
const adigest = require('adigest')
const {byPattern} = require('pon-task-compile')
const minify = require('./minify')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = ['*.css', '*.pcss'],
    watchDelay = 100,
    cssnext = true,
    modules = false,
    ext = '.css'
  } = options

  const compiler = async (code, inputSourceMap = null, options = {}) => {
    const postcss = cachedRequire('postcss') // Require here to reduce initial loading time
    const {src, dest, cwd = process.cwd(), plugins = []} = options

    const processor = postcss([
      cssnext && cachedRequire('postcss-cssnext'),
      modules && cachedRequire('postcss-modules')({
        getJSON (filename, json) {
          const jsonFilePath = dest + '.json'
          return mkdirpAsync(path.dirname(jsonFilePath)).then(() =>
            writeFileAsync(jsonFilePath, JSON.stringify(json, null, 2))
          )
        },
        generateScopedName (name, filename, css) {
          return [
            path.basename(filename, path.extname(filename)),
            name,
            adigest(path.resolve(filename)).substr(0, 8)
          ].join('__')
        }
      }),
      ...plugins
    ].filter(Boolean))
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
    namer: (filename) => filename.replace(/\.pcss$/, ext)
  })

  const {watch} = task

  return Object.assign(function css (ctx) {
    return task(ctx)
  }, {watch})
}

Object.assign(define, {minify})

module.exports = define


