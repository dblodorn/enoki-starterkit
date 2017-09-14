var choo = require('choo')
var enoki = require('enoki')
var config = require('./config')

// setup
var app = choo()
var site = enoki.state()
config(app, site)

// plugins
app.use(require('./site/plugins/scroll'))

// routes
app.route('*', require('./site/views/notfound'))

// export or mount
if (module.parent) module.exports = app
else app.mount('main')
