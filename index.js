var choo = require('choo')
var config = require('./app')

// wrap choo in cms
var app = config(choo())

// create your app
app.use(require('./site/plugins/scroll'))

// error route
app.route('*', require('./site/views/notfound'))

// public
if (module.parent) {
  module.exports = app
} else {
  app.mount('main')
}
