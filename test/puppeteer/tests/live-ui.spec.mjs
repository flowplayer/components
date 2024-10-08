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
    await page.evaluate((player) => {
        const currentTime = player.currentTime
        const edge = player.hls.liveSyncPosition

        if (Math.abs(currentTime - edge) > 1) throw new Error("playback did not start from edge")
    }, player)
})

test("live-ui / player starts from beginning", Player, async (t, page, player, live_ui) => {
    await startPlayback(page, player, live_ui, false)
    await page.evaluate((player) => {
        const currentTime = player.currentTime
        const start = player.hls.liveSyncPosition - player.live_state.dvr_window
        if (Math.abs(currentTime - start) > 1) throw new Error("playback did not start from beginning")
    }, player)
})

async function startPlayback(page, player, live_ui, live) {
    await Promise.race([
        captureEvent(page, player, "progress"),
        captureEvent(page, player, "canplay"),
        captureEvent(page, player, "loadeddata")
    ])

    //wait for 10'' before starting playback
    setTimeout(() => {
        page.evaluate((live_ui, live) => {
            const buttonSelector = live ? ".fp-live-edge" : ".fp-live-start"
            live_ui.querySelector(buttonSelector).click()
        }, live_ui, live)

    }, 10_000)

    await Promise.all([
        captureEvent(page, player, "playing"),
        captureEvent(page, player, "seeked"),
    ])
}
