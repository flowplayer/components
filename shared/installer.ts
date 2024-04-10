/**
 * 
 * @param flowplayerComponent name of the component to override
 * @param name the new name for the component in the customElements registry 
 * @param klass the CustomElementConstructor for the new component
 * @returns void
 */
export function installer (flowplayerComponent : string, name : string, klass : CustomElementConstructor) : void {
  // window doesn't exist for some reason
  if (typeof window === "undefined") return

  window.customElements.define(name, klass)
  if (window.flowplayer && window.flowplayer.customElements) {
    return void window.flowplayer.customElements.set(flowplayerComponent, name)
  }

  window.addEventListener("flowplayer:umd" as any, (e : CustomEvent<typeof window.flowplayer>) => {
    const flowplayer = e.detail
    flowplayer.customElements.set(flowplayerComponent, name)
  })
}

