import { install } from "../../shared/install"

export default class FancyUi extends HTMLElement {
  constructor () {
    super()
  }
}

// handle cdn installs
install("flowplayer-ui", "fancy-ui", FancyUi)
