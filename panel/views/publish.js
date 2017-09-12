var html = require('choo/html')

var Publish = require('../components/publish')
var Modal = require('../components/modal')

var modal = Modal()

module.exports = Container

function Container (state, emit) {
  return modal.render({
    content: content(),
    className: 'c6'
  })

  function content () {
    return html`
      <div class="x xjc xac bgwhite p2 br1 fwb fs2 psr tac">
        Publishing
      </div>
    `
  }
}