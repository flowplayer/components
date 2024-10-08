import test from "ava"
import {createServer, destroyServer, withComponents} from "../_setup/helpers.mjs"
import {captureEvent, togglePlay} from "../_setup/player.mjs";

test.before("setting up server...", createServer)
test.after("shutting down server...", destroyServer)

const Player = withComponents({
    componentNames: ["vertical-volume-bar"],
    config: {
        src: "https://fp-eu-w1-nnarhinen.s3.eu-west-1.amazonaws.com/multi-angle-hls/playlist.m3u8",
        autoplay: 1
    }
})

test("vertical-volume-bar", Player, async (t, page, player, volume_bar) => {
    await Promise.race([
        captureEvent(page, player, "playing"),
        captureEvent(page, player, "timeupdate"),
    ])

    await togglePlay(page, player, false)
    // is volume bar hidden.
    await page.evaluate((player, volume_bar) => {
        const wrapper = volume_bar.querySelector(".fp-volume-wrapper")
        if (getComputedStyle(wrapper)["visibility"] !== "hidden") throw new Error("Volume bar is not hidden")
    }, player, volume_bar)

    // is volume bar visible after volume icon is touched
    await page.evaluate((player, volume_bar) => {
        const wrapper = volume_bar.querySelector(".fp-volume-wrapper")
        const mute_icon = volume_bar.querySelector(".fp-volumebtn")

        mute_icon.dispatchEvent(new Event("pointerenter"))
        if (getComputedStyle(wrapper)["visibility"] === "hidden") throw new Error("Volume bar is not visible when mute icon is touched")
    }, player, volume_bar)

    // is volume progress height property reflects player's volume settings.
    await page.evaluate((player, volume_bar) => {
        const is_muted = player.muted
        const progress = volume_bar.querySelector(".fp-volume-progress")
        const progressHeight = progress.style.height

        if ((is_muted && progressHeight !== "0px")
            || (!is_muted && progressHeight !== Math.round(player.volume * 100) + "%")) throw new Error("Volume progress value isn't correct " + progressHeight)
    }, player, volume_bar)

    await page.evaluate((player, volume_bar) => {
        const wrapper = volume_bar.querySelector(".fp-volume-wrapper")

        volume_bar.dispatchEvent(new Event("pointerleave"))
        if (getComputedStyle(wrapper)["visibility"] !== "hidden") throw new Error("Volume bar is not hidden, when it is not touched")
    }, player, volume_bar)
})
