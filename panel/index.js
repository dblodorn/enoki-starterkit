var html = require('choo/html')
var choo = require('choo')
var xhr = require('xhr')
var config = require('./app')

var app = choo()

app.use(function (state, emitter) {
  xhr.get({
    uri: '/api/v1/state',
    json: true
  }, function (err, resp, body) {
    if (err) alert(err.message)
    config(app, body)
    app.mount('main')
  })
})

// panel api
app.use(require('./plugins/events'))
app.use(require('./plugins/interface'))
app.use(require('./plugins/panel'))

// panel catch all route
app.route('*', require('./views/default'))

// public
if (module.parent) {
  module.exports = app
} else {
}
