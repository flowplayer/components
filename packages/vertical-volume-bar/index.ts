import {install} from "../../shared/install"
import {type Player} from "@flowplayer/player"
import "./index.css"
import {CLICK, VOLUME_CHANGE} from "@flowplayer/player/core/events"
import support from "../utils"
import {SliderStates, makeSlider} from "./slider"


export default class VerticalVolume extends HTMLElement {

    constructor(player: Player) {
        super()
        this.classList.add("fp-volume-control-vertical")

        const volume_icon = player.createComponents(flowplayer.defaultElements.VOLUME_ICON)[0]
        volume_icon.addEventListener(CLICK, _ => player.toggleMute())
        this.append(volume_icon)

        if (support().ios || support().android) return

        const volumeBar = this.createVolumeBar(player)
        this.append(volumeBar)

        volume_icon.addEventListener("pointerenter", _ => volumeBar.style.visibility = "visible")
        this.addEventListener("pointerleave", _ => volumeBar.style.visibility = "hidden")
        this.addEventListener("focusin", ()=> volumeBar.style.visibility = "visible")
        this.addEventListener("focusout", ()=> {
            setTimeout(()=> {
                if (document.activeElement !== volumeBar) volumeBar.style.visibility = "hidden"
            }, 0)
        })
    }

    createVolumeBar(player: Player) {
        const volumeWrapper = document.createElement("div")
        volumeWrapper.classList.add("fp-volume-wrapper")
        volumeWrapper.setAttribute("tabindex", "0")
        volumeWrapper.setAttribute("role", "slider")
        volumeWrapper.setAttribute("aria-valuemin", "0")
        volumeWrapper.setAttribute("aria-valuemax", "1")
        volumeWrapper.setAttribute("aria-label", player.i18n("core.volume", "volume"))
        player.on(VOLUME_CHANGE, this.onVolumeChange.bind(this, player, volumeWrapper))

        const volumeBar = document.createElement("div")
        volumeBar.setAttribute("aria-hidden", "true")
        volumeBar.classList.add("fp-volume-vertical")
        makeSlider(volumeBar, {onseek: this.onVolumeBarSeek.bind(this, player)})

        const container = document.createElement("div")
        container.classList.add("fp-volume-container")

        const volume = document.createElement("div")
        volume.classList.add("fp-volume-progress", "fp-color", "use-drag-handle")

        const dragger = document.createElement("div")
        dragger.classList.add("fp-dragger", "fp-color")

        volume.append(dragger)
        volumeBar.append(container)
        container.append(volume)
        volumeWrapper.append(volumeBar)

        return volumeWrapper
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
        if (!progress) return
        progress.style.height = player.muted ? "0" : Math.round(amount * 100) + "%"
    }

    onVolumeChange(player: Player, volumeBar: HTMLElement) {
        const muted = player.volume == 0 || player.muted
        if (muted) this.adjustVolumeSlider(player, 0, volumeBar)

        const ui_opt = player.opt("ui")
        if (!this.classList.contains(SliderStates.GRABBING) && !(muted && typeof ui_opt === "number" && (4 & ui_opt) > 0)) {
            this.adjustVolumeSlider(player, player.volume, volumeBar)
        }
    }
}

install("flowplayer-volume-control", "vertical-volume-bar", VerticalVolume)
