import vm from "node:vm"

const asset = () => {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case "local":
      return "http://localhost:8080/constants/flowplayer.js"
    case "canary":
      return "https://cdn.flowplayer.com/releases/native/3/canary/constants/flowplayer.min.js"
    default:
      return "https://cdn.flowplayer.com/releases/native/3/stable/constants/flowplayer.min.js"
  }
}

export async function validComponentNames () : Promise<string[]> {
  const filename = asset()
  const req = await fetch(filename)
  if (req.status !== 200) {
    throw new Error(`
      | failed to lookup valid components |

      http.status=${req.status}
         http.url=${req.url}
    `)
  }

  const umdScript = new vm.Script(
    await req.text(),
    {filename}
  )

  const context = {window: {}} as any

  vm.createContext(context)

  const result = umdScript.runInContext(context)

  return Object.values(context.flowplayer.Components) as string[]
}


validComponentNames()
