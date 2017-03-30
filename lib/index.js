/**
 * Pon task to compile css
 * @module pon-task-css
 * @version 1.0.1
 */

'use strict'

const create = require('./create')
const Define = require('./define')

let lib = create.bind(this)

Object.assign(lib, Define, {
  create,
  Define
})

module.exports = lib
