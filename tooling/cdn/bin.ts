import fs from "fs/promises"
import * as PackageUtils from "../utils/packages"

export async function createPackageInfoList () {
  const packages = await PackageUtils.packages()
  const now = Date.now()
  const entries = packages.map(({name, description, flowplayer})=> {
    return {name, description, ...flowplayer}
  })

  await fs.writeFile("dist/index.json", JSON.stringify({createdAt: now, entries}, null, 2))
}

~(async function main () {
  await createPackageInfoList()
}())
