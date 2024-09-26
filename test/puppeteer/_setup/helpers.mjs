import pug from "pug"
import os, {tmpdir} from "os"
import fs from "fs/promises"
import path from "path"
import puppeteer from "puppeteer"
import HttpServer from "http-server"
import "dotenv/config"
import mkdirp from "mkdirp"
import {PuppeteerScreenRecorder} from "puppeteer-screen-recorder"

const debug = (...args) => process.env.DEBUG && console.log(...args)
const _dirname = path.dirname(import.meta.url)
const tmpDir = path.join(os.tmpdir(), "puppeteer-native", "html")

export function compilePug(name) {
    const fileName = path.join(_dirname, name + ".pug").slice(5)
    return pug.compileFile(fileName, {})
}

const Templates = {local: compilePug("local")}

export async function createServer(t) {
    return new Promise((resolve) => {
        const server = HttpServer.createServer({root: tmpDir})
        server.listen(0, "localhost", () => {
            Object.assign(t.context, {server, ...server.server.address()})
            Object.assign(t.context, {address: "localhost"})
            debug("server / up / %s:%s", t.context.address, t.context.port)
            resolve()
        })
    })
}

export async function destroyServer(t) {
    if (!t.context.server) return
    t.context.server.close()
    t.context.server = void 0
}

export async function loadComponent(componentName) {
    const component = await fs.readFile(
        path.join("dist", `${componentName}.js`)
    )

    return component.toString()
}

export async function writeTempFile(fileName, contents) {
    const fullName = path.join(tmpDir, fileName)
    debug("created: %s", fullName)
    await fs.writeFile(fullName, contents)
    return fullName
}

export function titleToFile(title, suffix = ".html") {
    const fileName = title
        .toLowerCase()
        .replaceAll(/\s+/g, "-")
        .replaceAll(/[/]/g, "-")
        .replaceAll(/,/g, "-")
        .replaceAll(/-{2,}/g, "-")
        .replaceAll(/=/g, "-")
        .replaceAll(/_/g, "-")
    return fileName + suffix
}

export async function compileLocalTest(t, {config, componentNames}) {
    const components = await Promise.all(componentNames.map((name) => loadComponent(name)))

    const compiled = Templates.local({
        Test: {
            components,
            config: config
        }
    })
    const fileName = titleToFile(t.title)
    const filePath = await writeTempFile(fileName, compiled)
    return {fileName, filePath}
}

const {
    PUPPETEER_PRODUCT: puppeteerProduct,
    CHROME_PATH: chromePath = "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
    FIREFOX_PATH: firefoxPath = "/usr/bin/firefox"
} = process.env

const headless = !!process.env.CI || !!process.env.PUPPETEER_HEADLESS

const executablePath = puppeteerProduct === "firefox" ? firefoxPath : chromePath

export async function makePuppeteerSession(t, args) {
    args = args || []
    if (process.env.CI) args.push("--no-sandbox")

    const browser = await puppeteer.launch({
        headless,
        executablePath,
        slowMo: !headless ? 50 : 200,
        userDataDir: path.join(tmpdir(), `puppeteer-ci-${Date.now()}`),
        args
    })
    const page = await browser.newPage({timeout: 120 * 1000})
    const recorder = new PuppeteerScreenRecorder(page)
    page.on("console", (msg) => {
        if (!process.env.DEBUG) return
        for (let i = 0; i < msg.args().length; ++i)
            debug(`console / ${t.title} / ${i}: ${msg.args()[i]}`)
    })
    return {browser, page, recorder}
}

async function getPlayer(
    t,
    componentNames,
    config,
    token,
    puppeteer,
    recorder,
    setup,
    host,
    page
) {
    const context = {host, page}
    if (typeof setup == "function") {
        await setup(context)
    }
    const recordingFile =
        "/tmp/puppeteer-native/components/recordings/" + titleToFile(t.title, ".mp4")

    if (!process.env.DEBUG) await recorder.start(recordingFile)
    const {fileName, filePath} = await compileLocalTest(t, {
        config: JSON.stringify(config).replaceAll(":host:", host),
        componentNames,
    })
    const testDocument = `${context.host}/${fileName}` //host +  fileName
    await page.goto(testDocument, puppeteer || {waitUntil: "networkidle2", timeout: 120 * 1000}
    )
    const player = await page.$(".fp-engine")
    const components = await Promise.all(componentNames.map((name) => page.$(name)))
    return {components, player, filePath, recordingFile}
}

export function withComponents({componentNames, config, token, files, puppeteer, args}, setup) {
    return async function (t, run) {
        await mkdirp(tmpDir)
        await mkdirp("/tmp/puppeteer-native/components/recordings/")
        if (!t.context.address) await createServer(t)
        const host = `http://localhost:${t.context.port}`
        if (files)
            await Promise.all(
                Object.entries(files).map(([fileName, contents]) =>
                    writeTempFile(fileName, contents)
                )
            )

        const {browser, page, recorder} = await makePuppeteerSession(t, args)

        const {components, player, filePath, recordingFile} = await getPlayer(
            t,
            componentNames,
            config,
            token,
            puppeteer,
            recorder,
            setup,
            host,
            page
        )

        //ensure we have player
        t.assert(player)
        //ensure the components are rendered
        components.forEach((component, idx) => t.assert(component, componentNames[idx]))
        try {
            try {
                await run(t, page, player, components)
            } catch (err) {
                // todo: open an issue with ava.js about this
                t.fail(err.message)
            }
        } finally {
            await destroyServer(t)
            if (!process.env.DEBUG) await recorder.stop()
            if (t.passed) {
                const testFiles = Object.keys(files || {}).map((fileName) =>
                    path.join(tmpDir, fileName)
                )
                const rm = async (f) => {
                    if (process.env.KEEP) return
                    if (process.env.DEBUG) debug("cleaning up file %s", f)
                    if (await fs.stat(f)) {
                        return await fs.rm(f)
                    }
                }
                const removals = [rm(recordingFile), rm(filePath), ...testFiles.map(rm)]
                await Promise.all(removals)
            }
            if (!process.env.KEEP) await browser.close()
        }
    }
}
