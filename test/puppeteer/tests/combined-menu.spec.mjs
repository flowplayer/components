import test from "ava"
import {createServer, destroyServer, withComponents} from "../_setup/helpers.mjs"
import {captureEvent} from "../_setup/player.mjs";

test.before("setting up server...", createServer)
test.after("shutting down server...", destroyServer)

const Player = withComponents({
    componentNames: ["combined-menu-control"],
    config: {
        src: "https://fp-eu-w1-nnarhinen.s3.eu-west-1.amazonaws.com/multi-angle-hls/playlist.m3u8",
        autoplay: 1
    }
})

test("combined-menu-control", Player, async (t, page, player, control) => {
    await Promise.race([
        captureEvent(page, player, "playing"),
        captureEvent(page, player, "timeupdate"),
    ])

    await page.evaluate((player, control) => {
        const menu = control.querySelector("flowplayer-menu-dialog")
        const dialog = menu.menuContainer
        const settingsMenu = menu.mainMenu
        const findOpenMenu = _ => Array.from(menu.querySelectorAll(".fp-menu")).find((menu) => !menu.classList.contains("is-close"))

        menu.click()

        //test if dialog is open
        if (
            !player.root.classList.contains("has-menu-opened")
            || !dialog.open) throw new Error("menu dialog did not open after clicking on it")

        //test if the settings menu is open.
        if (findOpenMenu() !== settingsMenu) throw new Error("settings menu is closed")
        //click on a menu opt
        settingsMenu.querySelector("li").click()
        //test if menu dialog is closed
        if (!dialog.open) throw new Error("menu dialogs is closed after clicking on an opt")
        //test if settings menu is still open
        if (findOpenMenu() === settingsMenu) throw new Error("main menu is still open")
        //test if the menu dialog navigates back to the settings menu when a sub-menu opt is selected
        findOpenMenu().querySelector("li").click()
        if (findOpenMenu() !== settingsMenu) throw new Error("menu dialog did not navigate back to settings menu")
    }, player, control)
})
