import inquirer, {type Question} from 'inquirer'
import { validComponentNames } from "./flowplayer.helpers"
import {globby} from "globby"
import fs from "fs/promises"

const createComponentClassName = (newComponentName : string) => {
  const parts = newComponentName.split("-")
  return parts.map(part => part[0].toUpperCase() + part.slice(1)).join("")
}

const ensureValidWebComponentName = (newComponentName : string)=> {
  if (newComponentName.includes("-")) return newComponentName
  return `flowplayer-${newComponentName}`
}

const isNotUnique = async (input : string)=> {
  const packageFiles = await globby("packages/*/package.json")
  for (const f of packageFiles) {
    const pkg = await fs.readFile(f).then(c => JSON.parse(c.toString()))
    if (pkg.flowplayer.componentName == input) return true
  }

  return false
}

export type ComponentInfo = {
  flowplayerComponentName: string;
  newComponentHTMLName: string;
  newComponentClassName: string;
}

export async function prompt () : ComponentInfo {
  const componentNames = await validComponentNames()
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "flowplayerComponentName",
      message: "which flowplayer component should we replace?",
      choices: componentNames,
    },
    {
      name: "newComponentHTMLName",
      message: "what should the new html component be called?",
      async validate(input : string) {
        if (input.length < 5) 
          return "the new component name must be at least 5 characters"
        if (componentNames.includes(input)) 
          return "the new component name must not conflict with a default flowplayer component"
        if (await isNotUnique(input))
          return "the new component name must not conflict with an already existing component in this repo"
        return true
      },
    },
  ])
  return {
    flowplayerComponentName: answers.flowplayerComponentName, 
    newComponentHTMLName: ensureValidWebComponentName(answers.newComponentHTMLName),
    newComponentClassName: createComponentClassName(answers.newComponentHTMLName)
  }
}
