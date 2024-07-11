import { prompt } from "./prompt"
import {Eta} from "eta"
import path from "path"
import fs from "fs/promises"

~(async function main () {
  const answers = await prompt()
  const eta = new Eta({views: path.join(__dirname, "templates")})
  const code = eta.render("./component", answers)
  const pkg = eta.render("./package", answers)
  const root = path.join(".", "packages", answers.newComponentHTMLName)
  await fs.mkdir(root)
  await fs.writeFile(path.join(root, "package.json"), pkg)
  await fs.writeFile(path.join(root, "index.ts"), code)
  await fs.writeFile(path.join(root, "index.css"), "")
  console.log(`🌱 created %s`, answers.newComponentHTMLName)
}())
