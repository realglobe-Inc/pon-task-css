/**
 * Test case for define.
 * Runs with mocha.
 */
'use strict'

const define = require('../lib/define.js')
const ponContext = require('pon-context')
const { ok } = require('assert')
const asleep = require('asleep')
const writeout = require('writeout')
const co = require('co')

describe('define', function () {
  this.timeout(5000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Define', () => co(function * () {
    let ctx = ponContext({})
    let task = define(
      `${__dirname}/../misc/mocks`,
      `${__dirname}/../tmp/testing-compiled`,
      {}
    )
    ok(task)

    yield Promise.resolve(task(ctx))
  }))

  it('Watch', () => co(function * () {
    let ctx = ponContext({})
    let srcDir = `${__dirname}/../tmp/testing-watching/src`
    let destDir = `${__dirname}/../tmp/testing-watching/dest`
    let src = srcDir + '/foo.pcss'
    yield writeout(src, ':root { --red: #d33; } a { &:hover { color: color(var(--red) a(54%)); } }', { mkdirp: true })
    yield asleep(100)
    define(srcDir, destDir, { watchDelay: 1 }).watch(ctx)
    yield writeout(src, ':root { --red: #dd1; } a { &:hover { color: color(var(--red) a(54%)); } }', { mkdirp: true })
    yield asleep(200)
    yield writeout(src, ':root { --red: #5FF; } a { &:hover { color: color(var(--red) a(54%)); } }', { mkdirp: true })
    yield asleep(200)
  }))
})

/* global describe, before, after, it */
