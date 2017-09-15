var queryString = require('query-string')
var objectKeys = require('object-keys')
var assert = require('nanoassert')
var utils = require('enoki/utils')
var html = require('choo/html')
var xtend = require('xtend')
var path = require('path')
var xhr = require('xhr')

module.exports = panel

function panel (state, emitter) {
  state.content = { }
  state.site = { }

  state.panel = {
    session: { },
    changes: { },
    loading: false,
    publish: { }
  }

  emitter.on(state.events.DOMCONTENTLOADED, onLoad)
  emitter.on(state.events.PANEL_LOADING, onLoading)
  emitter.on(state.events.PANEL_UPDATE, onUpdate)

  emitter.on(state.events.PANEL_SAVE, onSave)
  emitter.on(state.events.PANEL_CANCEL, onCancel)
  emitter.on(state.events.PANEL_PUBLISH, onPublish)

  emitter.on(state.events.PANEL_PAGE_ADD, onPageAdd)
  emitter.on(state.events.PANEL_PAGE_REMOVE, onPageRemove)
  emitter.on(state.events.PANEL_FILE_ADD, onFileAdd)
  emitter.on(state.events.PANEL_FILE_REMOVE, onFileRemove)

  function onLoad () {
    xhr.get({
      uri: '/api/v1/state',
      json: true
    }, function (err, resp, body) {
      if (err) alert(err.message)
      state.content = body.content
      state.site = body.site
      emitter.emit(state.events.RENDER)
    })
  }

  function onUpdate (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.path, 'string', 'enoki: data.path must be type string')
    var changes = state.panel.changes[data.path]
    state.panel.changes[data.path] = xtend(changes, data.data)
    emitter.emit(state.events.RENDER)
  }

  function onSave (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.file, 'string', 'enoki: data.file must be type string')
    assert.equal(typeof data.pathPage, 'string', 'enoki: data.pathPage must be type string')
    assert.equal(typeof data.page, 'object', 'enoki: data.page must be type object')

    var pathParent = data.pathParent || ''
    var session = state.panel.session[path.join(data.pathPage, pathParent)]
    // if (!session) data.refresh = true

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/update',
      body: data,
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)
      delete state.panel.changes[path.join(data.pathPage, pathParent)]
      if (data.render) {
        emitter.emit(state.events.PANEL_LOADING, { loading: false })
        emitter.emit(state.events.RENDER)
      } else {
        onRefresh({ path: data.pathPage })
      }
    })
  }

  function onCancel (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.path, 'string', 'enoki: data.path must be type string')

    delete state.panel.changes[data.path]
    emitter.emit(state.events.RENDER)
  }

  function onLoading (data) {
    if (data && data.loading !== undefined) {
      state.panel.loading = data.loading
    } else {
      state.panel.loading = false
    }
  }

  function onPageAdd (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.pathPage, 'string', 'enoki: data.pathPage must be type string')
    assert.equal(typeof data.title, 'string', 'enoki: data.title must be type string')
    assert.equal(typeof data.view, 'string', 'enoki: data.view must be type string')

    var session = state.panel.session[data.pathPage]
    // if (!session) data.refresh = true
    // if (!session) state.panel.session[data.pathPage] = true

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/page/add',
      body: data,
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)
      if (data.render) {
        emitter.emit(state.events.PANEL_LOADING, { loading: false })
        emitter.emit(state.events.RENDER)
      } else {
        onRefresh({ path: data.pathPage })
      }

      emitter.emit(state.events.REPLACESTATE, data.pathPage)
    })  
  }

  function onPageRemove (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.pathPage, 'string', 'enoki: data.pathPage must be type string')

    if (data.confirm !== false) {
      var name = data.title || data.pathPage
      if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
        return
      }
    }

    var session = state.panel.session[data.pathPage]
    // if (session) data.refresh = true

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/page/remove',
      body: data,
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)

      if (data.render) {
        emitter.emit(state.events.PANEL_LOADING, { loading: false })
        emitter.emit(state.events.RENDER)
      } else {
        onRefresh({
          path: data.pathPage,
          redirect: path.join('/panel', data.pathPage, '../')
        })
      }
    })  
  }

  function onFileAdd (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.pathPage, 'string', 'enoki: data.pathPage must be type string')
    assert.equal(typeof data.files, 'object', 'enoki: data.files must be type object')

    var send = new XMLHttpRequest()
    var formData = new FormData()

    // loading
    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    // add the files to the request
    objectKeys(data.files).forEach(function (key) {
      var file = data.files[key]
      var pathFile = path.join(data.pathPage, file.name)
      var session = state.panel.session[pathFile]
      if (!session) state.panel.session[pathFile] = true
      formData.append(file.name, file)
    })

    // send
    send.open('POST', '/api/v1/file/add', true)
    send.setRequestHeader('path-page', data.pathPage)
    send.send(formData)

    // callback
    send.addEventListener('load', function (event) {
      if (this.status !== 200) return alert('Can not upload')
      if (data.render) {
        emitter.emit(state.events.PANEL_LOADING, { loading: false })
        emitter.emit(state.events.RENDER)
      } else {
        onRefresh({ path: path.join('panel', data.pathPage) })
      }
    })
  }

  function onFileRemove (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.pathFile, 'string', 'enoki: data.pathFile must be type string')

    if (data.confirm !== false) {
      var name = data.title || data.pathFile
      if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
        return
      }
    }

    var session = state.panel.session[data.pathFile]
    // if (session) data.refresh = true

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/file/remove',
      body: data,
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)

      if (data.render) {
        emitter.emit(state.events.PANEL_LOADING, { loading: false })
        emitter.emit(state.events.RENDER)
      } else {
        onRefresh({
          path: data.pathFile,
          redirect: path.join('/panel', data.pathFile, '../')
        })
      }
    })  
  }

  function onPublish (data) {
    var changes = checkForChanges(state.panel.changes)
    data = data || { }

    // check for and confirm changes
    if (changes && typeof window !== 'undefined') {
      var confirmed = confirm(`You have ${changes} unsaved changes. To publish without confirming these changes select “ok”, otherwise cancel to continue editing.`)
      if (!confirmed) return
    }

    state.panel.publish.active = true
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/publish',
      body: { },
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)
      state.panel.publish.active = false
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
    })  
  }

  // TODO: replace only the updated page, not whole site
  function onRefresh (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.path, 'string', 'enoki: data.path must be type string')

    xhr.get({
      uri: '/api/v1/state',
      json: true
    }, function (err, resp, body) {
      if (err) return alert(err.message)
      state.content = body.content
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (typeof data.redirect === 'string') {
        emitter.emit(state.events.REPLACESTATE, data.redirect)
      }
    })  
  }

  function checkForChanges (changes) {
    var changes = (changes) ? objectKeys(changes) : [ ]
    return (changes.length > 0) ? changes.length : false
  }
}

