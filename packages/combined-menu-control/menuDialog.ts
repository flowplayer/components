import {type Player} from "@flowplayer/player"

export type FlowplayerMenu = HTMLElement & {
    menu: HTMLDivElement
    menuHeader: HTMLElement
}

enum FlowplayerSubtitlesMenuState  {
      main     = 0
    , tracks   = 1
    , style    = 2
    , styleOpt = 3
}

enum MenuType {
      asel        = 0
    , subtitles   = 1
    , qsel        = 2
    , vtsel       = 3
    , speed       = 4
}

type FlowplayerSubtitlesMenu = FlowplayerMenu & {
    createMenu: (state: FlowplayerSubtitlesMenuState)=> void
}

const MENU_CLASS = "fp-menu"
    , MENU_CONTAINER_CLASS = "fp-menu-container"
    , MENU_HEADER_CLASS = "fp-menu-header"
    , MENU_CLOSE_ICON_CLASS = "fp-close"
    , MENU_CLOSE = "is-close"

export class MenuDialog extends HTMLElement {
    menuContainer: HTMLDetailsElement
    summaryEle: HTMLElement
    mainMenu: HTMLDivElement
    menuHeader: HTMLDivElement
    menuTitle: HTMLHeadElement
    olEle: HTMLOListElement
    closeEle: HTMLSpanElement

    player

    constructor(player: Player) {
        super()
        this.className = "fp-menu-dialog"
        this.player = player

        this.menuContainer = document.createElement("details")
        this.summaryEle = document.createElement("summary")
        this.menuHeader = document.createElement("div")
        this.menuTitle = document.createElement("h3")
        this.olEle = document.createElement("ol")
        this.mainMenu = document.createElement("div")
        this.closeEle = document.createElement("span")

        this.menuHeader.classList.add(MENU_HEADER_CLASS)
        this.menuHeader.append(this.menuTitle, this.closeEle)

        this.mainMenu.classList.add(MENU_CLASS, "fp-main-menu")
        this.mainMenu.append(this.menuHeader, this.olEle)

        this.closeEle.classList.add(MENU_CLOSE_ICON_CLASS)
        this.closeEle.textContent = "×"

        this.menuContainer.classList.add(MENU_CONTAINER_CLASS)
        this.menuContainer.append(this.summaryEle, this.mainMenu)

        //TODO add settings translation
        this.menuTitle.textContent = this.player.i18n("core.settings", "Settings")

        //Accessibility
        this.olEle.setAttribute("aria-labelledby", this.summaryEle.id)
        this.olEle.setAttribute("role", "menu")
        this.summaryEle.setAttribute("aria-haspopup", "true")
        this.summaryEle.setAttribute("aria-controls", this.olEle.id)
        this.summaryEle.setAttribute("tabindex", "0")
        this.summaryEle.setAttribute("aria-expanded", "false")
        this.summaryEle.setAttribute("role", "button")
        //TODO add translation
        this.summaryEle.setAttribute("aria-label", "Settings")

        this.append(this.menuContainer)
        this.toggleVisibility()

        //listeners
        player.on("keyboard:close:menus", this.onKeyboardCloseMenu.bind(this))
        player.root.addEventListener("click", this.onRootClick.bind(this))
        this.addEventListener("click", this.onMenuClick.bind(this));
        ["focusin", "focusout"].forEach((ev)=> this.mainMenu.addEventListener(ev as any, this.onFocus.bind(this)))
    }

    onSubMenuCreated(menuComponent: FlowplayerMenu | FlowplayerSubtitlesMenu) {
        this.createDialogOpt(menuComponent)
        this.addSubMenuBackButton(menuComponent.menuHeader)
        this.menuContainer.append(menuComponent.menu)
    }

    //create new main-menu opt for a submenu
    createDialogOpt(menuComponent: FlowplayerMenu | FlowplayerSubtitlesMenu) {
        const opt = document.createElement("li")
        opt.textContent = menuComponent.menuHeader.querySelector("h3")?.textContent || ""

        const type = this.detectSubMenuType(menuComponent.classList) as MenuType
        this.toggleDialogOpt(menuComponent.menu, opt, type)

        menuComponent.addEventListener(this.findSubMenuOptionsEvent(type) as any, ()=> {
            this.toggleDialogOpt(menuComponent.menu, opt, type)
        })

        opt.onclick = type === MenuType.subtitles
            ? this.onSubtitlesOptClick.bind(this, menuComponent as FlowplayerSubtitlesMenu)
            : this.onOptClick.bind(this, menuComponent)

        //accessibility
        opt.setAttribute("role", "menuitem")
        opt.setAttribute("aria-selected", "false")
        opt.setAttribute("tabindex", "0")
        opt.setAttribute("aria-haspopup", "true")
        opt.setAttribute("aria-label", menuComponent.menuHeader.querySelector("h3")?.textContent || "")
    }

    // remove/append dialog opt based on the number of the submenu opts
    toggleDialogOpt(submenu: HTMLDivElement, dialogOpt: HTMLLIElement, type?: MenuType) {
        try {
            submenu.querySelectorAll("li").length > (type === MenuType.subtitles ? 0 : 1)
                ? this.olEle.appendChild(dialogOpt)
                : this.olEle.removeChild(dialogOpt)
        } catch (e) { }

        this.toggleVisibility()
    }

    // adds a back button to the header of a submenu
    addSubMenuBackButton(menuHeader: HTMLElement) {
        const back_button = document.createElement("div")
        back_button.className = "fp-icon fp-menu-back fp-back-button"
        back_button.setAttribute("aria-hidden", "true")
        menuHeader.append(back_button)
    }

    // opens a menu and hide the rest of dialog menus
    openMenu(menu_to_open: HTMLElement){
        this.querySelectorAll(".fp-menu")?.forEach((menu)=> {
            if (menu === menu_to_open) return
            (menu as HTMLElement)?.classList.add(MENU_CLOSE)
        })

        menu_to_open.classList.remove(MENU_CLOSE)
        menu_to_open.querySelector("li")?.focus()
    }

    //open/close dialog
    toggleMenuDialog(open: boolean) {
        this.menuContainer.open = open
        // TODO replace has-open-menu state, with flowplayer Constant
        this.player.root.classList.toggle("has-menu-opened" , open)
        this.summaryEle.setAttribute("aria-expanded", open + "")
    }

    //hide/show dialog if there are no available options to any of the submenus
    toggleVisibility() {
        const hide = !this.olEle.querySelectorAll("li").length
        this.style.setProperty("display", hide ? "none": "block")
        // close menu dialog
        if (hide && this.menuContainer.open) this.toggleMenuDialog(false)
    }

    //dialog's click listener
    onMenuClick(ev: MouseEvent){
        if (ev.defaultPrevented) return
        ev.preventDefault()

        const target = ev.target as HTMLElement
        if (target?.classList?.contains("fp-menu-back") || target?.closest("li")) return this.openMenu(this.mainMenu)

        const should_open = !this.menuContainer.open
        if (should_open) this.openMenu(this.mainMenu)
        this.toggleMenuDialog(should_open)
    }

    //dialog's focus listener
    onFocus(ev: FocusEvent) {
        const target = ev.target
        if (!(target instanceof HTMLLIElement)) return
        target.setAttribute("aria-selected", ev.type === "focusin" ? "true" : "false")
    }

    //main menu's opt click listener
    onOptClick(menuComponent: FlowplayerMenu, ev: MouseEvent) {
        ev.preventDefault()
        this.openMenu(menuComponent.menu)
    }

    //main menu's subtitle opt click listener
    onSubtitlesOptClick(menuComponent: FlowplayerSubtitlesMenu, ev: MouseEvent) {
        //Create main-subtitles-menu before opening subtitles menu
        if (!this.player.opt("subtitles.native")) menuComponent.createMenu(0)
        this.onOptClick(menuComponent, ev)
    }

    //player's root click listener
    onRootClick(ev: MouseEvent) {
        if (ev.composedPath().includes(this)) return
        this.toggleMenuDialog(false)
    }

    onKeyboardCloseMenu(ev: Event) {
        if (ev.defaultPrevented) return
        ev.preventDefault()

        if (this.mainMenu.classList.contains(MENU_CLOSE)) return this.openMenu(this.mainMenu)
        this.toggleMenuDialog(false)
        this.summaryEle.focus()
    }

    detectSubMenuType(classList: DOMTokenList) {
        //audio-menu
        if (classList.contains("fp-asel")) return MenuType.asel
        //quality menu
        if (classList.contains("fp-qsel")) return MenuType.qsel
        //speed menu
        if (classList.contains("fp-speed")) return MenuType.speed
        //subtitles menu
        if (classList.contains("fp-cc")) return MenuType.subtitles
        //video tracks menu
        if (classList.contains("fp-vsel")) return MenuType.vtsel
    }

    findSubMenuOptionsEvent(type: MenuType) {
        switch (type) {
            case MenuType.asel:
                return "audio:tracks"
            case MenuType.qsel:
                return "quality:tracks"
            case MenuType.speed:
                return "speed:options"
            case MenuType.subtitles:
                return "subs:tracks"
            case MenuType.vtsel:
                return "video:tracks"
            default:
                return ""
        }
    }
}
