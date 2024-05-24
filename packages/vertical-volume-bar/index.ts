import { install } from "../../shared/install"
import { type Player } from "@flowplayer/player"
import {CLICK, VOLUME_CHANGE} from "@flowplayer/player/core/events"
import support from "../utils"
import { SliderStates, makeSlider } from "./slider"


export default class VerticalVolume extends HTMLElement {

  constructor(player: Player) {
    super()
    this.classList.add("fp-volume-control-vertical")

    const volume_icon = player.createComponents(flowplayer.defaultElements.VOLUME_ICON)[0]
    volume_icon.addEventListener(CLICK, _ => player.toggleMute())
    this.append(volume_icon)

    if (support().ios || support().android) return

    const volumeBar = this.createVolumeBar(player)
    makeSlider(volumeBar, {onseek: this.onVolumeBarSeek.bind(this, player)})
    this.append(volumeBar)

    player.on(VOLUME_CHANGE, () => {
      const muted = (player.volume == 0) || player.muted
      if (muted) this.adjustVolumeSlider(player, 0, volumeBar)

      const ui_opt = player.opt("ui")
      if (!this.classList.contains(SliderStates.GRABBING) && !(muted && typeof ui_opt === "number" && (4 & ui_opt) > 0)) {
        this.adjustVolumeSlider(player, player.volume, volumeBar)
      }
    })

    volume_icon.addEventListener("pointerenter", _ => volumeBar.style.opacity = "1")
    this.addEventListener("pointerleave", _ => volumeBar.style.opacity = "0")
  }

  createVolumeBar(player: Player) {
    const volumeBar = document.createElement("div")
    volumeBar.classList.add("fp-volume-vertical")
    volumeBar.setAttribute("tabindex", "0")
    volumeBar.setAttribute("role", "slider")
    volumeBar.setAttribute("aria-valuemin", "0")
    volumeBar.setAttribute("aria-valuemax", "1")
    volumeBar.setAttribute("aria-label", player.i18n("core.volume", "volume"))

    const container = document.createElement("div")
    container.setAttribute("aria-hidden", "true")
    container.classList.add("fp-volume-container")

    const volume = document.createElement("div")
    volume.classList.add("fp-volume-progress", "fp-color", "use-drag-handle")

    const dragger = document.createElement("div")
    dragger.classList.add("fp-dragger", "fp-color")


    volume.append(dragger)
    volumeBar.append(container)
    container.append(volume)

    return volumeBar
  }

  onVolumeBarSeek(player: Player, volumeBar: HTMLElement, amount: number) {
    player._storage.setItem("volume", (player.volume = amount / 100).toString())
    this.adjustVolumeSlider(player, player.volume, volumeBar)

    if (amount < 0) return
    player.muted = false
    player._storage.removeItem("mute")
  }

  adjustVolumeSlider(player: Player, amount: number, volume_bar: HTMLElement) {
    volume_bar.setAttribute("aria-valuenow", amount.toString())
    volume_bar.setAttribute("aria-valuetext", Math.round(amount * 100) + "%")

    const progress = this.querySelector(".fp-volume-progress") as HTMLDivElement
    if(!progress) return
    progress.style.height = player.muted ? "0" : Math.round(amount * 100) + "%"
  }
}

install("flowplayer-volume-control", "vertical-volume-bar", VerticalVolume)
