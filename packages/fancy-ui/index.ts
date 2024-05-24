import { install } from "../../shared/install"
import { type Player } from "@flowplayer/player"

export default class FancyUi extends HTMLElement {
  constructor (player: Player) {
    super()
  }
}

// handle cdn installs
install("flowplayer-ui", "fancy-ui", FancyUi)
