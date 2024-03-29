export class FancyUi extends HTMLElement {
  constructor () {
    super()
  }
}

// handle cdn installs
if (typeof window !== "undefined" && typeof flowplayer !== "undefined") {
  window.customElements.define("fancy-ui", FancyUi)
  window.flowplayer.customElements.set("flowplayer-ui", "fancy-ui")
}
