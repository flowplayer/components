import { installer } from "../../shared/installer"

export default class FancyUi extends HTMLElement {
  constructor () {
    super()
  }
}

// handle cdn installs
installer("flowplayer-ui", "fancy-ui", FancyUi)
