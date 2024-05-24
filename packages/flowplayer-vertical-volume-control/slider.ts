import { TOUCH_START, TOUCH_MOVE, TOUCH_END, TOUCH_CANCEL,
  MOUSE_UP, MOUSE_DOWN, MOUSE_MOVE } from "@flowplayer/player/core/events"

const PASSIVE = {passive: true}

export enum SliderStates
{ GRABBING = "has-grab"
, TOUCHING = "has-touch"
}

export type SliderOpts =
    {   onseek?: (r: HTMLElement, n : number)=> void
      ; onstart?: (r: HTMLElement, n : number)=> void
      ; onend?: (r: HTMLElement, n : number)=> void
      ; onmouse?: (r: HTMLElement, n : number)=> void
      ; ontouch?: (r: HTMLElement, n : number)=> void
      ; ontouchend?: (r: HTMLElement, n : number)=> void
    }

export function makeSlider (root : HTMLElement, opts : SliderOpts) : HTMLElement {
  let offset = 0, max = -1, prev = -1
  const id = randomElementId()
  const classList = root.classList
  root.id = id

  classList.remove(SliderStates.GRABBING)
  classList.remove(SliderStates.TOUCHING)

  const onseek      = opts.onseek     || noop
      , onstart       = opts.onstart    || noop
      , onend         = opts.onend      || noop
      , onmouse       = opts.onmouse    || noop
      , ontouch       = opts.ontouch    || noop
      , ontouchend    = opts.ontouchend || noop

  // root dimensions can change
  function calc () {
    const rect = root.getBoundingClientRect()
    offset = rect.bottom - (parseFloat(window.getComputedStyle(root).paddingBottom))
    max = rect.height - parseFloat(window.getComputedStyle(root).paddingBottom) - parseFloat(window.getComputedStyle(root).paddingTop)
  }

  function extractValue (e : MouseEvent | TouchEvent) {
    calc()
    const pos = is_touch_event(e) ? e.changedTouches[0].pageY : e.pageY
    let val = offset - pos
    if (val > max) val = max
    if (val < 0) val = 0
    return val / max * 100
  }

  function move (e : MouseEvent | TouchEvent) {
    const val = extractValue(e)
    if (val == prev) return
    onseek(root, val)
    prev = val
  }

  root.addEventListener(TOUCH_START, function(e) {
    if (!shouldFire(root, e)) return
    //root.touching = true
    classList.add(SliderStates.TOUCHING)
    if (!is_visible(root.parentElement)) return
    //root.grabbing = true
    classList.add(SliderStates.GRABBING)
    ontouch(root, extractValue(e))
    onstart(root, extractValue(e))
    move(e)
  }, PASSIVE)

  root.addEventListener(TOUCH_MOVE, function(e) {
    move(e)
    onmouse(root, extractValue(e))
  }, PASSIVE)

  root.addEventListener(TOUCH_END, function(e) {
    // mouse-up event is emitted after touchend. Prevent mouse-up event to seek when touched.
    setTimeout(function () {
      //root.touching = false
      classList.remove(SliderStates.TOUCHING)
    }, 500)
    if (!shouldFire(root, e)) return
    //root.grabbing = false
    classList.remove(SliderStates.GRABBING)
    ontouchend(root, extractValue(e))
    onend(root, extractValue(e))
    max = 0
  }, PASSIVE)

  root.addEventListener(TOUCH_CANCEL, function() {
    classList.remove(SliderStates.GRABBING, SliderStates.TOUCHING)
    max = 0
  }, PASSIVE)

  root.addEventListener(MOUSE_DOWN, function(e) {
    if (classList.contains(SliderStates.TOUCHING)) return
    document.addEventListener(MOUSE_MOVE, move)
    //root.grabbing = true
    classList.add(SliderStates.GRABBING)
    onstart(root, extractValue(e))
    e.preventDefault()
    move(e)
  })

  root.addEventListener(MOUSE_MOVE, function(e) {
    if (classList.contains(SliderStates.TOUCHING)) return
    onmouse(root, extractValue(e))
  })


  // remove listener
  document.addEventListener(MOUSE_UP, function (e) {
    if (classList.contains(SliderStates.TOUCHING)) return
    document.removeEventListener(MOUSE_MOVE, move)
    if(!classList.contains(SliderStates.GRABBING)) return
    // root.grabbing = false
    classList.remove(SliderStates.GRABBING)
    onend(root, extractValue(e))
    max = 0
  })

  return root
}

function shouldFire (root : HTMLElement, e : Event) : boolean {
  const target = e.target
  if (!target) return false
  return (
      target &&
      !(target as any).closest(root.id) ||
      !is_visible(root.parentElement) ||
      !root.classList.contains(SliderStates.TOUCHING))
}


function is_visible (elem: HTMLElement | null) {
  if (!elem) return false
  const style = window.getComputedStyle(elem)
  return style.width      !== "0" &&
      style.height     !== "0" &&
      style.opacity    !== "0" &&
      style.display    !== "none" &&
      style.visibility !== "hidden"
}

function is_touch_event (e : any) : e is TouchEvent {
  return (typeof window.TouchEvent === "function" && e instanceof TouchEvent)
}

function noop () {}

function randomElementId () {
    return Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 5)
  }