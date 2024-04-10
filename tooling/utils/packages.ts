import { globby } from "globby";
import fs from "fs/promises"

export type FlowplayerComponentPackage = {
  name: string;
  description: string;
  flowplayer: {componentName: string; overridenComponent: string; className: string;}
}

export async function packages () : Promise<FlowplayerComponentPackage[]> {
  return globby("packages/*/package.json")
    .then(packages => Promise
      .all(packages
        .map(pkg => fs.readFile(pkg)
          .then(contents => JSON.parse(contents.toString()))
        ))
    )
}
