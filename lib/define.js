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
const {statAsync} = require('asfs')
const adigest = require('adigest')
const {byPattern} = require('pon-task-compile')
const {write} = require('pon-task-fs')
const minify = require('./minify')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = ['*.css', '*.pcss'],
    watchDelay = 100,
    cssnext = true,
    modules = false,
    ext = '.css',
    inlineMap = false
  } = options

  const compiler = async (code, inputSourceMap = null, options = {}) => {
    const {src, dest, cwd = process.cwd(), plugins = [], ctx} = options
    const srcStat = await statAsync(src).catch(() => null)
    const destStat = await statAsync(dest).catch(() => null)
    const notChanged = srcStat && destStat && (srcStat.mtime < destStat.mtime)
    if (notChanged) {
      return []
    }

    const postcss = cachedRequire('postcss') // Require here to reduce initial loading time
    const destDir = path.dirname(dest)

    const processor = postcss([
      cssnext && cachedRequire('postcss-cssnext'),
      modules && cachedRequire('postcss-modules')({
        getJSON (filename, json) {
          const styleFilePath = path.join(
            destDir,
            path.basename(dest, path.extname(dest)) + path.extname(src) + '.js'
          )
          return write(styleFilePath, `// Generated from "${path.relative(process.cwd(), src)}"
module.exports = ${JSON.stringify(json, null, 2)}
`, {})(ctx)
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
      map: {inline: inlineMap}
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


