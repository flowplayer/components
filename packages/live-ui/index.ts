import { install } from "../../shared/install"
import { type Player } from "@flowplayer/player"
import "./index.css"
import {BEFORE_PLAY, CLICK, CONFIG, DBL_CLICK, SOURCE, TOUCH_END} from "@flowplayer/player/core/events"

type SingletonTimer =
    | NodeJS.Timeout
    | false

const LIVE_UI_STATE = "is-live-ui"

export default class LiveUiMiddle extends HTMLElement{

  constructor(player: Player) {
    super()
    player.root.classList.toggle(LIVE_UI_STATE, !player.opt("autoplay"))

    this.classList.add("fp-middle")
    this.append(...player.createComponents(
        flowplayer.defaultElements.MIDDLE_LEFT_ZONE,
        flowplayer.defaultElements.MIDDLE_ZONE,
        flowplayer.defaultElements.MIDDLE_RIGHT_ZONE
    ))

    player.reaper && player.reaper.set("middle", this)

    player.on(BEFORE_PLAY, ()=> {
      player.root.classList.remove(LIVE_UI_STATE)
    })

    player.on(CONFIG, ()=> {
      if (player.opt("autoplay")) player.root.classList.remove(LIVE_UI_STATE)
    })

    player.on(SOURCE, ()=> {
      if (!player.currentSrc) return
      if (!player.opts.autoplay) player.root.classList.add(LIVE_UI_STATE)
    })

    this.handleClick(player)
    this.handleTouch(player)
    this.liveUi(player)
  }

  handleClick(player: Player) {
    [CLICK, DBL_CLICK].forEach(event => this.addEventListener(event, function (e) {
      if (e.defaultPrevented
          || player.root.classList.contains("is-endscreen")
          || [LIVE_UI_STATE, "is-live"].every(className => player.root.classList.contains(className))) return

      if (event === DBL_CLICK && player.root.classList.contains("no-fullscreen")) return
      e.preventDefault()
      player.emit(e.type)
      return false
    }))

    player.on(CLICK, function (e) {
      setTimeout(function () {
        if (e.defaultPrevented) return // noop
        player.togglePlay()
      }, 0)
    })

    player.on(DBL_CLICK, function (e) {
      setTimeout(function () {
        if (e.defaultPrevented) return
        player.toggleFullScreen()
      }, 0)
    })
  }

  handleTouch(player: Player) {
    let timer: SingletonTimer = false

    this.addEventListener(TOUCH_END, function (e) {
      // touchend is not cancellable during scroll events
      if (!e.cancelable || player.hasState("is-endscreen")) return
      // do not propogate click events
      // so we can do mobile specific behaviors
      e.preventDefault()
      player.emit(e.type, {source: e})
    })
    player.on(TOUCH_END, function (e) {
      // https://github.com/flowplayer/flowplayer-native/issues/301
      setTimeout(function () {
        if (e.defaultPrevented) return
        // one-touch replay
        // https://github.com/flowplayer/flowplayer-native/issues/142
        if (player.ended) return player.togglePlay(true)

        const first_touch = player.hasState("is-starting")
        // reset timer
        if (timer) clearTimeout(timer)
        // first touch should automatically
        // start playing the video & if a previous
        // touch is valid we should toggle the playing state
        if (first_touch || player.hasState("is-touched")) {
          if (player.hasState("is-touched")) {
            player.setState("is-touched", false)
            player.setState("is-touched", false)
          }
          player.togglePlay()
          if (first_touch) return
        }
        // handle first touch on a video
        // that has already started
        player.setState("is-touched", true)
        // touch menu should be shown on paused menu
        if (player.paused) return
        // make a 2 second window where another
        // touch can toggle the state
        timer = setTimeout(function () {
          timer = false
          player.setState("is-touched", false)
          // https://github.com/flowplayer/flowplayer-native/issues/318
          player.setState("is-touched", false)
        }, 2000)
      }, 0)
    })
  }

  liveUi(player: Player) {
    const live_ui = document.createElement("div")
    live_ui.classList.add("fp-live-ui")
    this.append(live_ui)

    const start = document.createElement("button")
    start.classList.add("fp-live-start")
    start.textContent = player.i18n("core.watch_beginning", "Watch from beginning")
    start.setAttribute("aria-label", player.i18n("core.watch_live_start", "Watch from beginning"))

    const live = document.createElement("button")
    live.classList.add("fp-live-edge")
    live.textContent = player.i18n("core.watch_live", "Watch live")
    live.setAttribute("aria-label", player.i18n("core.watch_live", "Watch live"))

    ;[start, live].forEach((button)=> {
      button.onclick = (e) => {
        player.root.classList.remove(LIVE_UI_STATE)
        e.preventDefault()
        player.setOpts({start_time: button === start ? 0 : -1})

        setTimeout(()=> player.togglePlay(true), 200)
      }
    })

    live_ui.append(start, live)
  }
}

install("flowplayer-middle", "live-ui-middle", LiveUiMiddle)
