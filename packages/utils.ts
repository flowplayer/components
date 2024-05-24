export default function support () {
    const in_browser = typeof document !== "undefined" && typeof window !== "undefined"
  
    const UA = in_browser ? navigator.userAgent : ""
      , IS_IPHONE = /iP(hone|od)/i.test(UA) && !/iPad/.test(UA) && !/IEMobile/i.test(UA)
      , IS_ANDROID = /Android/.test(UA) && !/Firefox/.test(UA)
      , IS_SAFARI = /^((?!chrome|android).)*safari/i.test(UA)
      , IS_CHROME = (/chrome|crios/i).test(UA) && !(/opr|opera|chromium|edg|ucbrowser|googlebot/i).test(UA)
      , IS_FIREFOX = (/firefox|fxios/i).test(UA) && !(/seamonkey/i).test(UA)
      , IS_EDGE = (/edg/i).test(UA)
      , IS_OPERA= (/opr|opera/i).test(UA)
      , IS_SAMSUNG = /SamsungBrowser/.test(UA)
      , IS_SAMSUNG_SMART_TV = IS_SAMSUNG && /SMART-TV/.test(UA)
  
    const self =
      { controls   : !IS_IPHONE
      , video      : function (type : string) {return in_browser && document.createElement("video").canPlayType(type)}
      , lang       : in_browser && window.navigator.language
      , android    : IS_ANDROID
      , iphone     : IS_IPHONE
      , safari     : IS_SAFARI
      , edge       : IS_EDGE
      , opera      : IS_OPERA
      , chrome     : IS_CHROME
      , firefox    : IS_FIREFOX
      , ios        : in_browser && (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
      , samsung    : IS_SAMSUNG
      , samsung_tv : IS_SAMSUNG && IS_SAMSUNG_SMART_TV
      , touch      : "ontouchstart" in window
      , tizen      : "tizen" in window
      , webOS      : "webos" in window
      }
    return self
  }
  
  
  