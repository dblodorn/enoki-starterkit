var queryString = require('query-string')
var utils = require('enoki/utils')
var html = require('choo/html')
var ok = require('object-keys')
var xtend = require('xtend')
var path = require('path')

// components
var ActionBar = require('../components/actionbar')
var Breadcrumbs = require('../components/breadcrumbs')
var Sidebar = require('../components/sidebar')
var Split = require('../components/split')

// containers
var Fields = require('../containers/fields')

// views
var File = require('./file')
var FilesAll = require('./files-all')
var FileNew = require('./file-new')
var PagesAll = require('./pages-all')
var PageNew = require('./page-new')
var Publish = require('./publish')

// methods
var methodsFile = require('../methods/file')
var methodsPage = require('../methods/page')
var methodsSite = require('../methods/site')

module.exports = View

function View (state, emit) {
  // TODO: currently overwrite page
  state.page = utils.page().find(state.href, state.content)

  var search = queryString.parse(location.search)
  var draftPage = getDraftPage()
  var blueprint = getBlueprint()

  return html`
    <main class="x xdc vhmn100">
      ${header()}
      ${content()}
      ${loading()}
    </main>
  `

  function header () {
    return html`
      <div id="header" class="x usn z2 psr bgblack">
        <div class="px1 wsnw breadcrumbs">
          <a href="/" class="db p1 nbb">index</a>
          ${Breadcrumbs({ page: state.page })}
        </div>
        <div class="p1 tcwhite tdn curp" onclick=${handlePublish}>
          Publish
        </div>
      </div>
    `
  }

  function loading () {
    if (!state.panel.loading) return
    return html`
      <div class="psf z2 t0 r0 p1">
        <div class="loader"></div>
      </div>
    `
  }

  function sidebar () {
    return Sidebar({
      page: state.page,
      uploadActive: state.ui.dragActive,
      pagesActive: !(blueprint.pages === false),
      filesActive: !(blueprint.files === false),
      handleFiles: handleFilesUpload,
      handleRemovePage: handleRemovePage,
      handleFilesUpload: handleFilesUpload
    }, emit)
  }

  // TODO: clean this up
  function content () {
    // publish
    if (state.panel.publish.active) {
      return Split(sidebar(), [Publish(state, emit), Page()])
    }

    // files
    if (search.file === 'new') {
      return Split(sidebar(), [FileNew(state, emit), Page()])
    } else if (search.file) {
      return File(state, emit)
    }

    // file
    if (search.files === 'all') {
      return FilesAll(state, emit)
    }

    // pages
    if (search.pages === 'all') {
      return PagesAll(state, emit)
    } else if (search.page === 'new') {
      return Split(
        sidebar(),
        [PageNew(state, emit), Page()]
      )
    }

    return Split(
      sidebar(),
      Page()
    )
  }

  function Page () {
    return html`
      <div id="content-page" class="x xdc c12">
        <div class="x1">
          <div class="x xw">
            ${Fields({
              blueprint: blueprint,
              draft: draftPage,
              site: state.site,
              page: state.page,
              values: state.page,
              handleFieldUpdate: handleFieldUpdate
            })}
          </div>
          <div class="psf b0 l0 r0 p1 pen z3">
            <div class="action-gradient ${draftPage === undefined ? 'dn' : 'db'}"></div>
            <div class="c4 pea sm-c12">
              ${ActionBar({
                disabled: draftPage === undefined,
                saveLarge: true,
                handleSave: handleSavePage,
                handleCancel: handleCancelPage,
                handleRemove: handleRemovePage
              })}
            </div>
          </div>
        </div>
      </div>
    `
  }

  function handleFieldUpdate (event, data) {
    emit(state.events.PANEL_UPDATE, {
      path: state.page.path,
      data: { [event]: data }
    })
  }

  function handleSavePage () {
    if (!draftPage) return

    emit(state.events.PANEL_SAVE, {
      file: state.page.file,
      pathPage: state.page.path,
      page: ok(blueprint.fields)
        .reduce(function (result, field) {
          result[field] = draftPage[field] === undefined
            ? state.page[field]
            : draftPage[field]
          return result
        }, { })
    })
  }

  function handleCancelPage () {
    emit(state.events.PANEL_CANCEL, {
      path: state.page.path
    })
  }

  function handleRemovePage () {
    emit(state.events.PANEL_REMOVE, {
      confirm: true,
      title: state.page.title,
      pathPage: state.page.path
    })
  }

  function handleFilesUpload (event, data) {
    emit(state.events.PANEL_FILES_ADD, {
      pathPage: state.page.path,
      files: data.files
    })
  }

  function handlePublish (event) {
    emit(state.events.PANEL_PUBLISH)
  }

  function getBlueprint () {
    if (state.page && state.site && state.site.blueprints) {
      return (
        state.site.blueprints[state.page.view] ||
        state.site.blueprints.default
      )
    } else {
      return { }
    }
  }

  function getDraftPage () {
    return state.panel && state.page && state.panel.changes[state.page.path]
  }
}
