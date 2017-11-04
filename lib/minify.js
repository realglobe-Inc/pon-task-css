/**
 * Define task to minify css files
 * @function minify
 * @param {string|string[]} src - Source file names
 * @param {string} dest - Destination file name
 * @returns {function} Defined task
 */
'use strict'

const CleanCSS = require('clean-css')
const path = require('path')
const writeout = require('writeout')

/** @lends minify */
function minify (src, dest, options = {}) {
  const {
    rebaseTo = 'public'
  } = options
  return async function task (ctx) {
    const {logger} = ctx
    const {styles} = new CleanCSS({
      rebaseTo
    }).minify(src)
    const result = await writeout(dest, styles, {
      mkdirp: true,
      skipIfIdentical: true
    })
    if (!result.skipped) {
      logger.debug('File generated', path.relative(process.cwd(), result.filename))
    }

  }
}

module.exports = minify