/**
 * Test case for define.
 * Runs with mocha.
 */
'use strict'

const define = require('../lib/define.js')
const ponContext = require('pon-context')
const {ok} = require('assert')
const asleep = require('asleep')
const writeout = require('writeout')

describe('define', function () {
  this.timeout(5000)

  before(async () => {

  })

  after(async () => {

  })

  it('Define', async () => {
    let ctx = ponContext({})
    let task = define(
      `${__dirname}/../misc/mocks`,
      `${__dirname}/../tmp/testing-compiled`,
      {}
    )
    ok(task)

    await Promise.resolve(task(ctx))
  })

  it('Watch', async () => {
    let ctx = ponContext({})
    let srcDir = `${__dirname}/../tmp/testing-watching/src`
    let destDir = `${__dirname}/../tmp/testing-watching/dest`
    let src = srcDir + '/foo.pcss'
    await writeout(src, ':root { --red: #d33; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(100)
    const close = await define(srcDir, destDir, {watchDelay: 1}).watch(ctx)
    await writeout(src, ':root { --red: #dd1; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(200)
    await writeout(src, ':root { --red: #5FF; } a { &:hover { color: color(var(--red) a(54%)); } }', {mkdirp: true})
    await asleep(200)
    close()
  })
})

/* global describe, before, after, it */
