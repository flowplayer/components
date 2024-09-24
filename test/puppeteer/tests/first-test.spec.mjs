import test from "ava"
import {createServer, destroyServer, withPlayer} from "../_setup/helpers.mjs"

test.before("setting up server...", createServer)
test.after("shutting down server...", destroyServer)


const Player = withPlayer({
    components: ["combined-menu-control"], config: {
        src: "https://fp-eu-w1-nnarhinen.s3.eu-west-1.amazonaws.com/multi-angle-hls/playlist.m3u8"
    }
})

test("dummy test", Player, async (t, page, player) => {
    setTimeout(() => console.log(player), 20_000)
})
