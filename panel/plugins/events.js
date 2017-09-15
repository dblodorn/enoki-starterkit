module.exports = events

function events (state, emitter) {
  state.events = state.events || { }

  state.events.PANEL_UPDATE = 'panel:update'
  state.events.PANEL_MOVE = 'panel:move'
  state.events.PANEL_PUBLISH = 'panel:publish'
  
  state.events.PANEL_PAGE_ADD = 'panel:page:add'
  state.events.PANEL_PAGE_REMOVE = 'panel:page:remove'
  state.events.PANEL_FILE_ADD = 'panel:file:add'
  state.events.PANEL_FILE_REMOVE = 'panel:file:remove'

  state.events.PANEL_LOADING = 'panel:loading'
  state.events.PANEL_SAVE = 'panel:save'
  state.events.PANEL_CANCEL = 'panel:cancel'

  state.events.UI_DROP = 'ui:drop'
}
