var queryString = require('query-string')
var objectKeys = require('object-keys')
var html = require('choo/html')
var path = require('path')

var methodsFile = require('../methods/file')
var methodsSite = require('../methods/site')

var ActionBar = require('../components/actionbar')
var Split = require('../components/split')
var Fields = require('../containers/fields')

module.exports = File

function File (state, emit) {
  var search = queryString.parse(location.search)
  var filename = methodsFile.decodeFilename(search.file)
  if (!state.page.files) return notFound()
  var file = state.page.files[filename]
  if (!file) return notFound()
  var blueprint = getBlueprint()
  var draftFile = state.panel.changes[file.path]

  return Split(
    [sidebar(), actionbarWrapper()],
    content()
  )

  function content () {
    return html`
      <div
        id="content-file"
        class="c12 psst t0 p1 file-preview"
      >
        ${file.type === 'image' ? image() : ''}
        ${file.type === 'audio' ? audio() : ''}
        ${file.type === 'video' ? video() : ''}
      </div>
    `
  }

  function sidebar () {
    return html`
      <div id="sidebar-file" class="x xdc c12 psst t0">
        <div class="x1" style="padding-bottom: 4.5rem">
          <div class="p1 c12">
            <div class="c12 fwb usn mb1">
              Filename
            </div>
            <div class="input input-disabled p0-5 truncate">
              ${filename}
            </div>
          </div>
          ${(file.height && file.width) ? dimensions() : ''}
          ${Fields({
            blueprint: blueprint,
            draft: draftFile,
            values: file,
            handleFieldUpdate: handleFieldUpdate
          })}
          <div class="p1">
            <span
              class="tcgrey curp"
              onclick=${handleRemove}
            >Delete file</span>
          </div>
        </div>
      </div>
    `
  }

  function dimensions () {
    return html`
      <div class="p1 c12">
        <div class="c12 fwb usn mb1">
          Dimensions
        </div>
        <div class="input input-disabled p0-5">
          ${file.height}/${file.width}px
        </div>
      </div>
    `
  }

  function actionbarWrapper () {
    return html`
      <div class="psf b0 l0 r0 p1 pen z3">
        <div class="action-gradient ${draftFile === undefined ? 'dn' : 'db'}"></div>
        <div class="c4 pea sm-c12">
          ${ActionBar({
            disabled: draftFile === undefined,
            handleSave: handleSave,
            handleCancel: handleCancel
          })}
        </div>
      </div>
    `
  }

  function image () {
    return html`<img src="${file.path}" class="ofc" />`
  }

  function audio () {
    return html`
      <div class="x xjc xac h100 w100">
        <audio src="${file.path}" controls>
      </div>
    `
  }

  function video () {
    return html`
      <video class="ofc" controls >
        <source src="${file.path}" type="video/mp4">
      </video>
    `
  }

  function notFound () {
    return html`
      <div class="fs2 p1">
        <b>${filename}</b> is not found 
      </div>
    `
  }

  function handleFieldUpdate (event, data) {
    emit(state.events.PANEL_UPDATE, {
      path: file.path,
      data: { [event]: data }
    })
  }

  function handleSave () {
    emit(state.events.PANEL_SAVE, {
      file: file.filename + '.txt',
      pathParent: file.filename,
      pathPage: state.page.path,
      page: objectKeys(blueprint.fields).reduce(function (result, field) {
          result[field] = draftFile[field] === undefined ? file[field] : draftFile[field]
          return result
        }, { })
    })
  }

  function handleCancel () {
    emit(state.events.PANEL_CANCEL, {
      path: file.path
    })
  }

  function handleRemove () {
    emit(state.events.PANEL_FILE_REMOVE, {
      pathFile: file.path
    })
  } 

  function getBlueprint () {
    if (
      state.page &&
      state.page.view &&
      state.site &&
      state.site.blueprints &&
      state.site.blueprints[state.page.view] &&
      state.site.blueprints[state.page.view].files
    ) {
      return state.site.blueprints[state.page.view].files
    } else {
      return { }
    }
  }
}