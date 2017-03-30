/**
 * Define task to compile css files
 * @function define
 * @param {string} srcDir - Source directory name
 * @param {string} destDir - Destination directory name
 * @param {Object} [options={}] - Optional settings
 * @param {string|string[]} [options.pattern=['*.css','*.pcss']] - File name pattern
 * @param {function[]} [options.plugins=[cssnext]] - PostCSS plugins
 * @returns {function} Defined task
 */
'use strict'

const aglob = require('aglob')
const co = require('co')
const path = require('path')
const { readFileAsync } = require('asfs')
const writeout = require('writeout')
const postcss = require('postcss')
const cssnext = require('postcss-cssnext')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = [ '*.css', '*.pcss' ],
    plugins = [ cssnext ]
  } = options

  const processor = postcss(plugins)

  function task (ctx) {
    let { logger } = ctx
    return co(function * () {
      let filenames = yield aglob(pattern, { cwd: srcDir })
      for (let filename of filenames) {
        const src = path.resolve(srcDir, filename)
        const dest = path.resolve(destDir, filename.replace(/\.pcss$/, '.css'))
        let content = yield readFileAsync(src)
        let { css, map } = yield processor
          .process(content, {
            from: path.relative(destDir, src),
            to: path.relative(destDir, dest),
            map: true
          })
        let written = yield writeout(dest, css, { skipIfIdentical: true, mkdirp: true })
        if (map) {
          yield writeout(dest + '.map', map, { skipIfIdentical: true, mkdirp: true })
        }
        if (!written.skipped) {
          logger.debug('File generated:', written.filename)
        }
      }
    })
  }

  return Object.assign(task,
    // Define sub tasks here
    {
      watch: (ctx) => co(function * () {
        throw new Error('Not implemented!')
      })
    }
  )
}

module.exports = define


