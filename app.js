var objectValues = require('object-values')
var xtend = require('xtend')
var enoki = require('enoki')
var path = require('path')
var fs = require('fs')

var site = enoki()
var views = getViews()

module.exports = setup

function setup (app) {
  app.use(structure)
  return app

  function structure (state, emitter) {
    app.state = state
    state.content = site.content
    route(state.content)

    function route (page) {
      var view = views[page.view] || views.default
      app.route(page.path, makePage(page, view))

      if (typeof page.children === 'object') {
        objectValues(page.children).forEach(function (child) {
          if (child.children) route(child)
        })
      }
    }
  }

  function makePage (props, view) {
    return function (state, emit) {
      return view(xtend(state, { page: props }), emit)
    }
  }
}

function getViews () {
  return module.parent ? getServer() : getBrowser()

  function getServer () {
    var pathViews = path.join(__dirname, './site/views')
    return fs.readdirSync(pathViews).reduce(function (result, file) {
      file = path.basename(file, path.extname(file))
      result[file] = require(path.join(pathViews, file))
      return result
    }, { })
  }

  function getBrowser () {
    var viewSrc = require('./site/views/*.js', { mode: 'hash' })
    return Object.keys(viewSrc).reduce(function (result, value) {
      result[path.basename(value)] = viewSrc[value]
      return result
    }, { })
  }
}
