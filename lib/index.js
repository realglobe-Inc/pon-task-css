/**
 * Pon task to compile css
 * @module pon-task-css
 * @version 4.0.0
 */

'use strict'

const define = require('./define')

let lib = define.bind(this)

Object.assign(lib, define, {
  define
})

module.exports = lib
