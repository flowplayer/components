import { install } from "../../shared/install"
import { type Player } from "@flowplayer/player"
import "./index.css"
import { type FlowplayerMenu, MenuDialog } from "./menuDialog"

export default class CombinedMenuControl extends HTMLElement{
  dialog: MenuDialog

  constructor(player: Player) {
    super()
    this.classList.add("fp-controls", "fp-togglable")

    // default components
    this.append(...player.createComponents(
          flowplayer.defaultElements.CONTROL_BUTTONS
        , flowplayer.defaultElements.LIVE_STATUS
        , flowplayer.defaultElements.ELAPSED
        , flowplayer.defaultElements.TIMELINE
        , flowplayer.defaultElements.CONTROL_DURATION
        , flowplayer.defaultElements.VOLUME_CONTROL
    ))

    // menu dialog
    window.customElements.define("flowplayer-menu-dialog", MenuDialog)
    this.dialog = new (window.customElements.get("flowplayer-menu-dialog") as CustomElementConstructor)(player) as MenuDialog
    this.append(this.dialog)
  }

  append(...nodes: (Node | string)[]) {
    // append menus to the menu dialog.
    nodes.forEach((node) => {
      (node !== this.dialog && (node as Element)?.querySelector(".fp-menu")) ? this.dialog?.onSubMenuCreated(node as FlowplayerMenu) : super.append(node)
    })
  }
}

install("flowplayer-control", "combined-menu-control", CombinedMenuControl)
