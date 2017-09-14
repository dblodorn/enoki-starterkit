var html = require('choo/html')

module.exports = home

function home (state, emit) {
  return html`
    <main class="p1 vhmn100 vw100 x xjc xac">
      <div class="fs2">
        <a href="/panel">Panel</a>
      </div>
    </main>
  `
}