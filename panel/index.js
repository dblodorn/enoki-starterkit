var html = require('choo/html')
var choo = require('choo')

var app = choo()

// plugins
app.use(require('./plugins/scroll'))
app.use(require('./plugins/events'))
app.use(require('./plugins/ui'))
app.use(require('./plugins/panel'))

// routes
app.route('/', require('./views/home'))
app.route('*', require('./views/default'))

// export or mount
if (module.parent) module.exports = app
else app.mount('main')
