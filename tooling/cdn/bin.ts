import * as PackageUtils from "../utils/packages"

export async function createPackageInfoList () {
  const packages = await PackageUtils.packages()
  const now = Date.now()
  const entries = packages.map(({name, description, flowplayer})=> {
    return {name, description, ...flowplayer}
  })
  process.stdout.write(JSON.stringify({createdAt: now, entries}, null, 2))
}

~(async function main () {
  await createPackageInfoList()
}())
