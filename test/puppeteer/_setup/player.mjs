export async function captureEvent(page, player, eventName, timeout = 20_000) {
  return await page.evaluate(
    (player, eventName, timeout) => {
      return new Promise((ok, err) => {
        const serialize = (o) => {
          try {
            return JSON.parse(JSON.stringify(o))
          } catch (err) {
            return o
          }
        }

        const handle = (e) => {
          ok({
            type: e.type,
            state: player.root.className,
            detail: serialize(e.detail)
          })
        }
        player.addEventListener(eventName, handle, { once: true })
        setTimeout(
          () =>
            err(
              new Error(`failed to detect event::${eventName} in ${timeout}ms`)
            ),
          timeout
        )
      })
    },
    player,
    eventName,
    timeout
  )
}

export async function seek(page, player, time) {
  return await page.evaluate(
    (player, time) => {
      return new Promise((ok, err) => {
        const handle = (e) =>
          ok({ type: e.type, state: player.root.className, detail: e.detail })
        player.addEventListener("timeupdate", handle, { once: true })
        setTimeout(() => err(new Error(`seeking operation failed`)), 20000)
        player.currentTime = time
      })
    },
    player,
    time
  )
}

export async function toggleMute(page, player, flag) {
  return await page.evaluate(
    (player, flag) => {
      return Promise.resolve(player.toggleMute(flag))
    },
    player,
    flag
  )
}
