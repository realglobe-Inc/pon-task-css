'use strict'

const path = require('path')
const { statAsync, mkdirpAsync } = require('asfs')
const adigest = require('adigest')
const { byPattern } = require('pon-task-compile')
const { write } = require('pon-task-fs')
const minify = require('./minify')

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
function define (srcDir, destDir, options = {}) {
  const {
    pattern = ['*.css', '*.pcss'],
    watchDelay = 200,
    cssnext = true,
    modules = false,
    ext = '.css',
    plugins = [],
    inlineMap = false,
  } = options

  const compiler = async (code, inputSourceMap = null, opt = {}) => {
    const { src, dest, cwd = process.cwd(), ctx } = opt
    const postcss = require('postcss') // Require here to reduce initial loading time
    const destDir = path.dirname(dest)

    const processor = postcss([
      cssnext && require('postcss-preset-env')({
        stage: 2,
        features: {
          'nesting-rules': true,
        }
      }),
      require('postcss-discard-duplicates'),
      modules && require('postcss-modules')({
        async getJSON (filename, json) {
          const styleFilePath = path.join(
            destDir,
            path.basename(dest, path.extname(dest)) + path.extname(src) + '.js'
          )
          await mkdirpAsync(path.dirname(styleFilePath))
          await write(styleFilePath, `// Generated from "${path.relative(process.cwd(), src)}"
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
    const result = await processor.process(code, {
      from: path.relative(cwd, src),
      to: path.relative(cwd, dest),
      map: { inline: inlineMap }
    })

    const { css, map } = result
    return [css, !!map ? map.toString() : null]
  }

  const task = byPattern(srcDir, destDir, compiler, {
    pattern,
    watchDelay,
    namer: (filename) => filename.replace(/\.pcss$/, ext)
  })

  const { watch } = task

  return Object.assign(function css (ctx) {
    return task(ctx)
  }, { watch })
}

Object.assign(define, { minify })

module.exports = define


