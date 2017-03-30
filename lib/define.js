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
const { readFileAsync } = require('asfs')
const ponWatcher = require('pon-watcher')
const ponWriter = require('pon-writer')
const postcss = require('postcss')
const cssnext = require('postcss-cssnext')

/** @lends define */
function define (srcDir, destDir, options = {}) {
  const {
    pattern = [ '*.css', '*.pcss' ],
    plugins = [ cssnext ],
    watchDelay = 100
  } = options

  const processor = postcss(plugins)
  let watching = false

  const doCompile = ({ src, dest, processor, writer, ctx }) => co(function * () {
    const writer = ponWriter({})
    const {
      logger,
      cwd = process.cwd()
    } = ctx

    const write = (filename, content) => co(function * () {
      if (!content) {
        return
      }
      let written = yield writer.write(filename, content, { skipIfIdentical: true, mkdirp: true })
      if (!written.skipped) {
        logger.debug('File generated:', written.filename)
      }
    })

    let content = yield readFileAsync(src)
    let { css, map } = yield processor
      .process(content, {
        from: path.relative(cwd, src),
        to: path.relative(cwd, dest),
        map: true
      })
    yield write(dest, css)
    yield write(`${dest}.map`, map)
  })

  const resolvePaths = (filename) => ({
    src: path.resolve(srcDir, filename),
    dest: path.resolve(destDir, filename.replace(/\.pcss$/, '.css'))
  })

  function task (ctx) {
    return co(function * () {
      let filenames = yield aglob(pattern, { cwd: srcDir })
      for (let filename of filenames) {
        const { src, dest } = resolvePaths(filename)
        yield doCompile({ src, dest, processor, ctx })
      }
    })
  }

  return Object.assign(task,
    // Define sub tasks here
    {
      watch: (ctx) => co(function * () {
        let { logger, cwd = process.cwd() } = ctx
        let watcher = ponWatcher({})
        let timer = -1
        let watching = true
        let close = yield watcher.watch(pattern, (event, filename) => {
          const { src, dest } = resolvePaths(filename)
          logger.trace(`File changed:`, path.relative(cwd, src))
          clearTimeout(timer)
          timer = setTimeout(() => {
            doCompile({ src, dest, processor, ctx })
              .catch((err) => {
                logger.error(err)
              })
          }, watchDelay)
        }, { cwd: srcDir })
        process.on('beforeExit', () => {
          watching = false
          close()
        })
        while (watching) {
          yield asleep(100)
        }
      })
    }
  )
}

module.exports = define


