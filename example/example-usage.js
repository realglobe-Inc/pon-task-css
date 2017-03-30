'use strict'

const pon = require('pon')
const ponTaskCss = require('pon-task-css')

async function tryExample () {
  let run = pon({
    css: ponTaskCss('ui/stylesheets', 'pubic/css', {
      pattern: [ '*.css' ]
    })
  })

  run('css')
}

tryExample()
