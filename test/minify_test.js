/**
 * Test case for minify.
 * Runs with mocha.
 */
'use strict'

const minify = require('../lib/minify.js')
const {ok} = require('assert')
const ponContext = require('pon-context')

describe('minify', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Minify', async () => {
    const ctx = ponContext({})
    const task = minify(
      [
        `${__dirname}/../misc/mocks/mock-css-01.css`,
        `${__dirname}/../misc/mocks/mock-css-02.css`
      ],
      `${__dirname}/../tmp/testing-css.min.css`
    )
    await task(ctx)
  })
})

/* global describe, before, after, it */
