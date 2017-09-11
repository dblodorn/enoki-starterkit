var queryString = require('query-string')
var objectKeys = require('object-keys')
var assert = require('nanoassert')
var html = require('choo/html')
var xtend = require('xtend')
var path = require('path')
var xhr = require('xhr')

module.exports = panel

function panel (state, emitter) {
  state.panel = {
    changes: { },
    loading: false,
    publish: { }
  }
  
  emitter.on(state.events.PANEL_UPDATE, onUpdate)
  emitter.on(state.events.PANEL_SAVE, onSave)
  emitter.on(state.events.PANEL_CANCEL, onCancel)
  emitter.on(state.events.PANEL_LOADING, onLoading)
  emitter.on(state.events.PANEL_REMOVE, onRemove)
  emitter.on(state.events.PANEL_PAGE_ADD, onPageAdd)
  emitter.on(state.events.PANEL_FILES_ADD, onFilesAdd)
  emitter.on(state.events.PANEL_PUBLISH, onPublish)

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

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/update',
      body: data,
      json: true
    }, function (err, resp, body) {
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (err) alert(err.message)
      delete state.panel.changes[data.pathPage]
      emitter.emit(state.events.RENDER)
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

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/add',
      body: data,
      json: true
    }, function (err, resp, body) {
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (err) return alert(err.message)
      emitter.emit(state.events.REPLACESTATE, data.pathPage)
    })  
  }

  function onRemove (data) {
    assert.equal(typeof data, 'object', 'enoki: data must be type object')
    assert.equal(typeof data.pathPage, 'string', 'enoki: data.pathPage must be type string')

    if (data.confirm) {
      if (!window.confirm(`Are you sure you want to delete ${data.title || data.pathPage}?`)) {
        return
      }
    }

    emitter.emit(state.events.PANEL_LOADING, { loading: true })
    emitter.emit(state.events.RENDER)

    xhr.put({
      uri: '/api/v1/remove',
      body: data,
      json: true
    }, function (err, resp, body) {
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (err) return alert(err.message)
      if (data.redirect !== false) {
        emitter.emit(state.events.REPLACESTATE, path.join(data.pathPage, '../'))
      }
    })  
  }

  function onFilesAdd (data) {
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
      formData.append(file.name, file)
    })

    // send
    send.open('POST', '/api/v1/add-files', true)
    send.setRequestHeader('path-page', data.pathPage)
    send.send(formData)

    // callback
    send.addEventListener('load', function (event) {
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (this.status !== 200) return alert('Can not upload')
      // emitter.emit(state.events.REPLACESTATE, '?panel=active')
    })
  }

  function onPublish () {
    var changes = checkForChanges(state.panel.changes)

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
      emitter.emit(state.events.PANEL_LOADING, { loading: false })
      emitter.emit(state.events.RENDER)
      if (err) return alert(err.message)
      state.panel.publish.active = false
      emitter.emit(state.events.RENDER)
    })  
  }
}

function checkForChanges (changes) {
  var changes = (changes) ? objectKeys(changes) : [ ]
  return (changes.length > 0) ? changes.length : false
}