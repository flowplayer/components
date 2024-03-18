export class FancyUi extends HTMLElement {
  constructor () {
    super()
  }
}

window.customElements.define("fancy-ui", FancyUi)
flowplayer.customElements.set("flowplayer-ui", "fancy-ui")
