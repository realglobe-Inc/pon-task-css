/**
 * Pon task to compile css
 * @module pon-task-css
 * @version 8.0.1
 */

'use strict'

const define = require('./define')

let lib = define.bind(this)

Object.assign(lib, define, {
  define
})

module.exports = lib
