import test from "ava"
import {createServer, destroyServer, withComponents} from "../_setup/helpers.mjs"
import {captureEvent} from "../_setup/player.mjs";

test.before("setting up server...", createServer)
test.after("shutting down server...", destroyServer)

const Player = withComponents({
    componentNames: ["live-ui"], config: {
        src: "https://wdrlokalzeit.akamaized.net/hls/live/2018027-b/wdrlz_essen/master.m3u8"
    }
})

test("live-ui / player starts live", Player, async (t, page, player, live_ui) => {
    await startPlayback(page, player, live_ui, true)
})

test("live-ui / player starts from beginning", Player, async (t, page, player, live_ui) => {
    await startPlayback(page, player, live_ui, false)
})

async function startPlayback(page, player, live_ui, live) {
    await Promise.race([
        captureEvent(page, player, "progress"),
        captureEvent(page, player, "canplay"),
        captureEvent(page, player, "loadeddata")
    ])

    await page.evaluate((player, live_ui, live) => {
        return new Promise((ok, err) => {
            setTimeout(() => {
                player.addEventListener("seeking", () => {
                    const currentTime = player.currentTime
                    const position = live ? player.hls.liveSyncPosition : player.hls.liveSyncPosition - player.live_state.dvr_window

                    if (Math.abs(position - currentTime) > 8) err(new Error(`The player did not seek at the ${live ? "edge" : "start"}`))
                    ok("")
                })

                const buttonSelector = live ? ".fp-live-edge" : ".fp-live-start"
                live_ui.querySelector(buttonSelector).click()
            }, 10_000)
        })
    }, player, live_ui, live)
}
